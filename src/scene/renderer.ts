/**
 * The Relay scene on the GPU: four draw calls (edges, agents, pulses, cursor glow), no render
 * targets. Positions, morph and drift are computed in the vertex shaders from one float texture;
 * the CPU only uploads heat (who just worked) and the few pulses in flight.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  DynamicDrawUsage,
  FloatType,
  GLSL3,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LineSegments,
  Mesh,
  NearestFilter,
  PerspectiveCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
  type IUniform,
} from 'three';
import type { Frame } from './layouts.ts';
import { edgesWithin, type Network } from './network.ts';
import { pixelRatio, type QualityLevel } from './quality.ts';
import type { Pulse } from './routing.ts';
import {
  CURSOR_FRAGMENT,
  CURSOR_VERTEX,
  EDGE_FRAGMENT,
  EDGE_VERTEX,
  NODE_FRAGMENT,
  NODE_VERTEX,
  PULSE_FRAGMENT,
  PULSE_VERTEX,
} from './shaders.ts';
import type { SceneTokens } from '../styles/tokens.ts';

const FOV = 40;
const CAMERA_Z = 12;
const DEPTH = 3;

/** Group split encoded for the shaders: 0 none, 1 clusters, 2 constellations. */
export type Split = 0 | 1 | 2;

/** Token colour (0xrrggbb, sRGB) as a raw shader vec3: the scene composes in display space. */
function rgb(hex: number): Vector3 {
  return new Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);
}

export interface FrameState {
  /** Seconds of drift time (already scaled by --motion-scale). */
  readonly time: number;
  /** Global eased progress of the current re-wiring. */
  readonly morph: number;
  readonly nodeHeat: Float32Array;
  readonly edgeHeat: Float32Array;
  readonly pulses: readonly Pulse[];
  /** Pointer in NDC and how present it is (0–1). */
  readonly cursor: readonly [number, number];
  readonly cursorStrength: number;
  /** Camera offset from the pointer (parallax), world units. */
  readonly parallax: readonly [number, number];
  /** Focused group (hovered service or project), -1 for none. */
  readonly focus: number;
  /** Converge strength 0–1: the contact node lights up. */
  readonly hub: number;
  /** Overall brightness of the section. */
  readonly brightness: number;
}

export class RelayRenderer {
  readonly renderer: WebGLRenderer;
  readonly camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
  frame: Frame = { halfWidth: 1, halfHeight: 1, depth: DEPTH };

  private readonly scene = new Scene();
  private readonly texture: DataTexture;
  private readonly shared: Record<string, IUniform>;
  private readonly nodeGeometry = new InstancedBufferGeometry();
  private readonly edgeGeometry = new BufferGeometry();
  private readonly pulseGeometry = new InstancedBufferGeometry();
  /** Shared unit quad (agents and pulses) and the cursor-glow quad. */
  private readonly quad = new PlaneGeometry(2, 2);
  private readonly cursorQuad = new PlaneGeometry(2, 2);
  private readonly materials: ShaderMaterial[] = [];
  private readonly nodeHeat: InstancedBufferAttribute;
  private readonly edgeHeat: BufferAttribute;
  private readonly pulseAttrs: Record<
    'aFrom' | 'aTo' | 'aT' | 'aKind' | 'aAlive',
    InstancedBufferAttribute
  >;
  private readonly net: Network;
  private readonly maxPulses: number;
  private width = 1;
  private height = 1;
  private level: QualityLevel;

  constructor(
    canvas: HTMLCanvasElement,
    net: Network,
    tokens: SceneTokens,
    level: QualityLevel,
    maxPulses: number,
  ) {
    this.net = net;
    this.maxPulses = maxPulses;
    this.level = level;
    // Throws without WebGL2: the caller shows the still instead.
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
      depth: false,
      stencil: false,
    });
    this.renderer.setClearColor(tokens.colors.bg, 1);
    this.camera.position.set(0, 0, CAMERA_Z);

    const n = net.nodes.length;
    const data = new Float32Array(n * 4 * 3);
    net.nodes.forEach((node, i) => {
      data[i * 4 + 3] = node.seed;
      data[(n + i) * 4 + 3] = node.weight;
      data[(2 * n + i) * 4] = net.groups.clusters[i] ?? 0;
      data[(2 * n + i) * 4 + 1] = net.groups.constellations[i] ?? 0;
      data[(2 * n + i) * 4 + 2] = node.layer;
    });
    this.texture = new DataTexture(data, n, 3, RGBAFormat, FloatType);
    this.texture.minFilter = NearestFilter;
    this.texture.magFilter = NearestFilter;
    this.texture.needsUpdate = true;

    const c = tokens.colors;
    this.shared = {
      uNodes: { value: this.texture },
      uMorph: { value: 1 },
      uTime: { value: 0 },
      uDrift: { value: 0.07 * tokens.motionScale },
      uFogNear: { value: CAMERA_Z - DEPTH },
      uFogFar: { value: CAMERA_Z + DEPTH * 1.6 },
      uPixelRatio: { value: 1 },
      uGlow: { value: level.glow },
      uBrightness: { value: 1 },
      uViewport: { value: new Vector2(1, 1) },
      uNodeColor: { value: rgb(c.node) },
      uEdgeColor: { value: rgb(c.edge) },
      uTaskColor: { value: rgb(c.pulseTask) },
      uResultColor: { value: rgb(c.pulseResult) },
      uCursorColor: { value: rgb(c.cursor) },
      uCursor: { value: new Vector2(9, 9) },
      uCursorStrength: { value: 0 },
      uCursorWorld: { value: new Vector3() },
      uCursorRadius: { value: 0.9 },
      uFocus: { value: -1 },
      uHub: { value: 0 },
      uHubNode: { value: 0 },
    };

    // Agents: one quad per node, instanced; the instance id is the node index.
    const quad = this.quad;
    this.nodeGeometry.index = quad.index;
    this.nodeGeometry.setAttribute('position', quad.getAttribute('position'));
    this.nodeHeat = new InstancedBufferAttribute(new Float32Array(n), 1).setUsage(DynamicDrawUsage);
    this.nodeGeometry.setAttribute('aHeat', this.nodeHeat);
    this.add(
      new Mesh(
        this.nodeGeometry,
        this.material(NODE_VERTEX, NODE_FRAGMENT, { uSplitTo: { value: 0 } }),
      ),
      1,
    );

    // Links: two vertices per edge, each naming its node and the other end.
    const e = net.edges.length;
    const node = new Float32Array(e * 2);
    const other = new Float32Array(e * 2);
    net.edges.forEach(([a, b], k) => {
      node[k * 2] = a;
      other[k * 2] = b;
      node[k * 2 + 1] = b;
      other[k * 2 + 1] = a;
    });
    this.edgeGeometry.setAttribute('position', new BufferAttribute(new Float32Array(e * 2 * 3), 3));
    this.edgeGeometry.setAttribute('aNode', new BufferAttribute(node, 1));
    this.edgeGeometry.setAttribute('aOther', new BufferAttribute(other, 1));
    this.edgeHeat = new BufferAttribute(new Float32Array(e * 2 * 2), 2).setUsage(DynamicDrawUsage);
    this.edgeGeometry.setAttribute('aHeat', this.edgeHeat);
    this.add(
      new LineSegments(
        this.edgeGeometry,
        this.material(EDGE_VERTEX, EDGE_FRAGMENT, { uSplit: { value: new Vector2(0, 0) } }),
      ),
      0,
    );

    // Pulses: a fixed pool of stretched quads; dead ones are parked off-screen.
    this.pulseGeometry.index = quad.index;
    this.pulseGeometry.setAttribute('position', quad.getAttribute('position'));
    const attr = (): InstancedBufferAttribute =>
      new InstancedBufferAttribute(new Float32Array(maxPulses), 1).setUsage(DynamicDrawUsage);
    this.pulseAttrs = { aFrom: attr(), aTo: attr(), aT: attr(), aKind: attr(), aAlive: attr() };
    for (const [name, a] of Object.entries(this.pulseAttrs))
      this.pulseGeometry.setAttribute(name, a);
    this.pulseGeometry.instanceCount = maxPulses;
    this.add(new Mesh(this.pulseGeometry, this.material(PULSE_VERTEX, PULSE_FRAGMENT)), 2);

    this.add(new Mesh(this.cursorQuad, this.material(CURSOR_VERTEX, CURSOR_FRAGMENT)), 3);
    this.setLevel(level);
  }

  /** Layouts to morph between (xyz per node) and the group split of each. */
  setLayouts(
    from: Float32Array,
    to: Float32Array,
    split: readonly [Split, Split],
    hubNode: number,
  ): void {
    const data = this.texture.image.data as Float32Array;
    const n = this.net.nodes.length;
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < 3; k++) {
        data[i * 4 + k] = from[i * 3 + k] ?? 0;
        data[(n + i) * 4 + k] = to[i * 3 + k] ?? 0;
      }
    }
    this.texture.needsUpdate = true;
    for (const m of this.materials) {
      const u = m.uniforms;
      if (u['uSplit']) (u['uSplit'].value as Vector2).set(split[0], split[1]);
      if (u['uSplitTo']) u['uSplitTo'].value = split[1];
    }
    this.u('uHubNode', hubNode);
  }

  setLevel(level: QualityLevel): void {
    this.level = level;
    this.nodeGeometry.instanceCount = level.nodes;
    this.edgeGeometry.setDrawRange(0, edgesWithin(this.net, level.nodes) * 2);
    this.u('uGlow', level.glow);
    this.resize(this.width, this.height);
  }

  get nodeCount(): number {
    return this.level.nodes;
  }

  /** Sizes the drawing buffer; returns the world frame visible at z = 0. */
  resize(width: number, height: number): Frame {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    const dpr = pixelRatio(this.level, window.devicePixelRatio || 1);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    (this.shared['uViewport']?.value as Vector2).set(this.width * dpr, this.height * dpr);
    this.u('uPixelRatio', dpr);
    const halfHeight = CAMERA_Z * Math.tan(((FOV / 2) * Math.PI) / 180);
    this.frame = { halfWidth: halfHeight * this.camera.aspect, halfHeight, depth: DEPTH };
    return this.frame;
  }

  render(state: FrameState): void {
    this.u('uTime', state.time);
    this.u('uMorph', state.morph);
    this.u('uCursorStrength', state.cursorStrength);
    this.u('uFocus', state.focus);
    this.u('uHub', state.hub);
    this.u('uBrightness', state.brightness);
    (this.shared['uCursor']?.value as Vector2).set(state.cursor[0], state.cursor[1]);
    (this.shared['uCursorWorld']?.value as Vector3).set(
      state.cursor[0] * this.frame.halfWidth,
      state.cursor[1] * this.frame.halfHeight,
      0,
    );

    const heat = this.nodeHeat.array as Float32Array;
    heat.set(state.nodeHeat.subarray(0, heat.length));
    this.nodeHeat.needsUpdate = true;
    const edgeHeat = this.edgeHeat.array as Float32Array;
    const drawn = edgesWithin(this.net, this.level.nodes);
    for (let e = 0; e < drawn; e++) {
      const task = state.edgeHeat[e * 2] ?? 0;
      const result = state.edgeHeat[e * 2 + 1] ?? 0;
      edgeHeat[e * 4] = task;
      edgeHeat[e * 4 + 1] = result;
      edgeHeat[e * 4 + 2] = task;
      edgeHeat[e * 4 + 3] = result;
    }
    this.edgeHeat.needsUpdate = true;

    const p = this.pulseAttrs;
    for (let i = 0; i < this.maxPulses; i++) {
      const pulse = state.pulses[i];
      (p.aAlive.array as Float32Array)[i] = pulse ? 1 : 0;
      if (!pulse) continue;
      (p.aFrom.array as Float32Array)[i] = pulse.a;
      (p.aTo.array as Float32Array)[i] = pulse.b;
      (p.aT.array as Float32Array)[i] = pulse.t;
      (p.aKind.array as Float32Array)[i] = pulse.kind === 'task' ? 0 : 1;
    }
    for (const a of Object.values(p)) a.needsUpdate = true;

    this.camera.position.set(state.parallax[0], state.parallax[1], CAMERA_Z);
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
  }

  /** Screen positions (CSS px, xy per node) of the first `count` agents at the given layout. */
  project(positions: Float32Array, count: number): Float32Array {
    const out = new Float32Array(count * 2);
    const v = new Vector3();
    for (let i = 0; i < count; i++) {
      v.set(positions[i * 3] ?? 0, positions[i * 3 + 1] ?? 0, positions[i * 3 + 2] ?? 0);
      v.project(this.camera);
      out[i * 2] = ((v.x + 1) / 2) * this.width;
      out[i * 2 + 1] = ((1 - v.y) / 2) * this.height;
    }
    return out;
  }

  dispose(): void {
    this.texture.dispose();
    this.nodeGeometry.dispose();
    this.edgeGeometry.dispose();
    this.pulseGeometry.dispose();
    this.quad.dispose();
    this.cursorQuad.dispose();
    for (const m of this.materials) m.dispose();
    this.renderer.dispose();
  }

  private u(name: string, value: number): void {
    const uniform = this.shared[name];
    if (uniform) uniform.value = value;
  }

  private material(
    vertexShader: string,
    fragmentShader: string,
    own: Record<string, IUniform> = {},
  ): ShaderMaterial {
    const material = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader,
      fragmentShader,
      // Shared uniform objects: one update reaches every material.
      uniforms: { ...this.shared, ...own },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.materials.push(material);
    return material;
  }

  private add(object: Mesh | LineSegments, order: number): void {
    object.frustumCulled = false;
    object.renderOrder = order;
    this.scene.add(object);
  }
}
