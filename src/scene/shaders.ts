/**
 * GLSL for the Relay scene (WebGL2 / GLSL ES 3.0 through three.js ShaderMaterial).
 *
 * Node positions live in one float texture (uNodes): row 0 = layout we come from (xyz) + seed,
 * row 1 = layout we go to (xyz) + weight, row 2 = cluster, constellation, layer. Nodes, edges
 * and pulses all read it through `nodePos`, so a link always ends exactly at its agents, also
 * mid re-wiring. `nodeProgress` mirrors morph.ts — keep the two in step.
 *
 * Colours arrive as raw sRGB uniforms from the brand tokens; every pass is additive over the
 * scene background, so "brighter" always means "more work happening here".
 */
import { STAGGER_SPREAD } from './morph.ts';

const float = (n: number): string => (Number.isInteger(n) ? `${String(n)}.0` : String(n));

export const COMMON = /* glsl */ `
precision highp float;
precision highp sampler2D;

uniform sampler2D uNodes;
uniform float uMorph;
uniform float uTime;
uniform float uDrift;
uniform float uFogNear;
uniform float uFogFar;

const float SPREAD = ${float(STAGGER_SPREAD)};

float nodeProgress(float p, float seed) {
  float s = clamp((p - seed * SPREAD) / (1.0 - SPREAD), 0.0, 1.0);
  return s * s * (3.0 - 2.0 * s);
}

vec4 nodeMeta(int i) {
  return texelFetch(uNodes, ivec2(i, 2), 0);
}

// World position of agent i: the layout morph, a lift into depth while moving, and a slow drift.
vec3 nodePos(int i, out float seed, out float weight) {
  vec4 a = texelFetch(uNodes, ivec2(i, 0), 0);
  vec4 b = texelFetch(uNodes, ivec2(i, 1), 0);
  seed = a.w;
  weight = b.w;
  float s = nodeProgress(uMorph, seed);
  vec3 p = mix(a.xyz, b.xyz, s);
  p.z += sin(s * 3.14159265) * (seed - 0.5) * 1.6;
  float t = uTime;
  p += uDrift * vec3(
    sin(t * 0.21 + seed * 31.0),
    cos(t * 0.17 + seed * 17.0),
    0.6 * sin(t * 0.13 + seed * 11.0)
  );
  return p;
}

vec3 nodePos(int i) {
  float seed;
  float weight;
  return nodePos(i, seed, weight);
}

// Linear fog toward the background: far agents fade, near ones stay crisp.
float fogFactor(float viewDistance) {
  return clamp((uFogFar - viewDistance) / (uFogFar - uFogNear), 0.12, 1.0);
}

// 1 when nodes a and b sit in the same group of the split (0 none, 1 clusters, 2 constellations).
float sameGroup(float split, vec4 ma, vec4 mb) {
  if (split < 0.5) return 1.0;
  float ga = split < 1.5 ? ma.x : ma.y;
  float gb = split < 1.5 ? mb.x : mb.y;
  return abs(ga - gb) < 0.5 ? 1.0 : 0.0;
}

float inFocus(float split, float focus, vec4 m) {
  if (split < 0.5 || focus < -0.5) return 0.0;
  float g = split < 1.5 ? m.x : m.y;
  return abs(g - focus) < 0.5 ? 1.0 : 0.0;
}
`;

export const NODE_VERTEX = /* glsl */ `
${COMMON}
uniform float uGlow;
uniform vec2 uCursor;        // NDC
uniform float uCursorStrength;
uniform float uSplitTo;
uniform float uFocus;
uniform float uHubNode;
uniform float uHub;          // 0..1, converge strength

in float aHeat;

out vec2 vUv;
out float vWeight;
out float vHeat;
out float vFog;
out float vLift;
out float vHub;

void main() {
  int i = gl_InstanceID;
  float seed;
  float weight;
  vec3 p = nodePos(i, seed, weight);
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * view;
  vec2 ndc = clip.xy / clip.w;

  float near = 1.0 - smoothstep(0.0, 0.32, length((ndc - uCursor) * vec2(1.0, 0.6)));
  float focus = inFocus(uSplitTo, uFocus, nodeMeta(i));
  float hub = float(i) == uHubNode ? uHub : 0.0;

  vWeight = weight;
  vHeat = aHeat;
  vFog = fogFactor(-view.z);
  vLift = 0.6 * focus + 0.6 * near * uCursorStrength;
  vHub = hub;

  // Radius of the whole sprite (core + glow) in world units.
  float radius = (0.05 + 0.07 * weight + 0.09 * aHeat + 0.2 * hub) * (0.6 + 0.4 * uGlow);
  vUv = position.xy;
  view.xy += position.xy * radius;
  gl_Position = projectionMatrix * view;
}
`;

export const NODE_FRAGMENT = /* glsl */ `
precision highp float;
out vec4 outColor;
uniform vec3 uNodeColor;
uniform vec3 uTaskColor;
uniform vec3 uCursorColor;
uniform float uBrightness;   // overall brightness of the section

in vec2 vUv;
in float vWeight;
in float vHeat;
in float vFog;
in float vLift;
in float vHub;

void main() {
  float d = length(vUv);
  if (d > 1.0) discard;
  float core = smoothstep(0.26, 0.14, d);
  float glow = exp(-d * d * 7.0) * (0.18 + 0.5 * vHeat);
  // Hubs carry a faint ring: the agents work starts from.
  float ring = vWeight > 0.99 ? smoothstep(0.06, 0.0, abs(d - 0.55)) * 0.35 : 0.0;
  float ink = (0.32 + 0.68 * vWeight) * (core + ring) + glow;
  vec3 color = mix(uNodeColor, uTaskColor, clamp(vHeat * 0.85, 0.0, 1.0));
  color = mix(color, uCursorColor, vHub * 0.8);
  float lift = 1.0 + vLift + vHub * 1.4;
  outColor = vec4(color * ink * vFog * lift * uBrightness, 1.0);
}
`;

export const EDGE_VERTEX = /* glsl */ `
${COMMON}
uniform vec2 uSplit;   // group split we come from / go to
uniform float uFocus;

in float aNode;
in float aOther;
in vec2 aHeat;         // task, result

out float vFog;
out float vVisible;
out vec2 vHeat;
out float vFocus;
out float vLength;

void main() {
  int i = int(aNode);
  int j = int(aOther);
  vec3 p = nodePos(i);
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  vec4 mi = nodeMeta(i);
  vec4 mj = nodeMeta(j);
  // Links between groups fade while the network is split into islands: topology stays, the eye rests.
  float seed = texelFetch(uNodes, ivec2(i, 0), 0).w;
  float s = nodeProgress(uMorph, seed);
  vVisible = mix(sameGroup(uSplit.x, mi, mj), sameGroup(uSplit.y, mi, mj), s);
  vFocus = inFocus(uSplit.y, uFocus, mi) * inFocus(uSplit.y, uFocus, mj);
  // Long links recede: the eye reads neighbourhoods, not a web of lines across the screen.
  vLength = 1.0 - 0.88 * smoothstep(0.7, 2.6, distance(p, nodePos(j)));
  vFog = fogFactor(-view.z);
  vHeat = aHeat;
  gl_Position = projectionMatrix * view;
}
`;

export const EDGE_FRAGMENT = /* glsl */ `
precision highp float;
out vec4 outColor;
uniform vec3 uEdgeColor;
uniform vec3 uTaskColor;
uniform vec3 uResultColor;
uniform float uBrightness;

in float vFog;
in float vVisible;
in vec2 vHeat;
in float vFocus;
in float vLength;

void main() {
  vec3 base = uEdgeColor * (0.42 + 0.58 * vFocus) * vLength;
  vec3 lit = uTaskColor * vHeat.x + uResultColor * vHeat.y;
  outColor = vec4((base + lit) * vVisible * vFog * uBrightness, 1.0);
}
`;

export const PULSE_VERTEX = /* glsl */ `
${COMMON}
uniform vec2 uViewport;     // drawing buffer size in pixels
uniform float uPixelRatio;
uniform float uGlow;

in float aFrom;
in float aTo;
in float aT;
in float aKind;             // 0 task, 1 result
in float aAlive;

// Fragment position relative to the head, in drawing-buffer pixels.
out float vAlong;           // along the travel direction, negative behind the head
out float vAcross;
out float vTrail;           // trail length
out float vWidth;           // half width of the spark
out float vKind;
out float vFog;

void main() {
  vec3 pa = nodePos(int(aFrom));
  vec3 pb = nodePos(int(aTo));
  // Tasks leave a longer trail than results: they are the faster, warmer half of the exchange.
  float trail = mix(0.45, 0.3, aKind);
  vec3 head = mix(pa, pb, aT);
  vec3 tail = mix(pa, pb, max(aT - trail, 0.0));
  vec4 vh = modelViewMatrix * vec4(head, 1.0);
  vec4 ch = projectionMatrix * vh;
  vec4 ct = projectionMatrix * modelViewMatrix * vec4(tail, 1.0);

  vec2 sh = (ch.xy / ch.w) * 0.5 * uViewport;
  vec2 st = (ct.xy / ct.w) * 0.5 * uViewport;
  vec2 dir = sh - st;
  float len = length(dir);
  dir = len > 0.001 ? dir / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float width = (5.0 + 4.0 * uGlow) * uPixelRatio * (1.0 - 0.2 * aKind);

  // position.x: -1 at the tail, 1 a spark's width past the head; position.y: across.
  float along = mix(-len - width, width, position.x * 0.5 + 0.5);
  vec2 s = sh + dir * along + nrm * position.y * width;
  vAlong = along;
  vAcross = position.y * width;
  vTrail = max(len, 1.0);
  vWidth = width;
  vKind = aKind;
  vFog = fogFactor(-vh.z);
  gl_Position = aAlive > 0.5 ? vec4(s / (0.5 * uViewport) * ch.w, ch.z, ch.w) : vec4(2.0, 2.0, 2.0, 1.0);
}
`;

export const PULSE_FRAGMENT = /* glsl */ `
precision highp float;
out vec4 outColor;
uniform vec3 uTaskColor;
uniform vec3 uResultColor;
uniform float uBrightness;

in float vAlong;
in float vAcross;
in float vTrail;
in float vWidth;
in float vKind;
in float vFog;

void main() {
  // Spark: a round glow with a hot core, centred on the head.
  float d = length(vec2(vAlong, vAcross)) / vWidth;
  float glow = exp(-d * d * 3.0);
  float core = exp(-d * d * 22.0);
  // Trail: a hairline behind the head, brightening toward it.
  float behind = clamp(1.0 + vAlong / vTrail, 0.0, 1.0) * step(vAlong, 0.0);
  float line = exp(-pow(vAcross / (vWidth * 0.16), 2.0));
  float trail = pow(behind, 1.8) * line * 0.85;
  vec3 color = mix(uTaskColor, uResultColor, vKind);
  // The hot core desaturates toward white: light, not a brand colour.
  vec3 ink = color * (trail + glow * 0.55) + mix(color, vec3(1.0), 0.6) * core;
  outColor = vec4(ink * max(vFog, 0.5) * uBrightness, 1.0);
}
`;

export const CURSOR_VERTEX = /* glsl */ `
precision highp float;
uniform vec3 uCursorWorld;
uniform float uCursorRadius;
out vec2 vUv;
void main() {
  vUv = position.xy;
  vec4 view = modelViewMatrix * vec4(uCursorWorld, 1.0);
  view.xy += position.xy * uCursorRadius;
  gl_Position = projectionMatrix * view;
}
`;

export const CURSOR_FRAGMENT = /* glsl */ `
precision highp float;
out vec4 outColor;
uniform vec3 uCursorColor;
uniform float uCursorStrength;
in vec2 vUv;
void main() {
  float d = length(vUv);
  float glow = exp(-d * d * 5.0) * (1.0 - smoothstep(0.8, 1.0, d));
  outColor = vec4(uCursorColor * glow * 0.045 * uCursorStrength, 1.0);
}
`;
