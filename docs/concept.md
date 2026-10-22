# 3D scene concept — "Relay"

Status: implemented in `src/scene/` (deviations from this document, with reasons:
`docs/superpowers/decisions/relay-scene.md`). Direction: dark, technical, generative —
"intelligence in motion".

## Goal

A visitor remembers kokot.it as "intelligence in motion" — AI agents that cooperate as a network —
while the content stays fast and readable on a mid-range phone (budget: 60 fps on a mid-range
laptop, smooth on a phone, Lighthouse mobile Performance ≥ 85, the scene is never the LCP element).

## Options considered

| Option                                | What it is                                                                                                                                                                                              | Strongest case against                                                                                                                                                 | Performance cost                                                                                                                                               | Reversal cost                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **A. Relay: a hand-off network** ✅   | A sparse 3D graph of agent nodes; warm pulses (tasks) travel along the links, cool ones (results) return; the cursor is a client order the network routes to; scrolling re-forms the graph per section. | Nodes and lines are the most common "technical" background (the particles.js plexus); if the pulses are too subtle, the scene collapses into exactly that cliché.      | Low: ~1–1.5k instanced nodes, ~3–4k segments, a few dozen pulses; a handful of draw calls, no render targets. CPU: BFS routing on a small graph, occasionally. | Before implementation: one document. After: rewrite `src/scene` (about 6 files, 1.5 days); tokens and pages unchanged. |
| **B. Swarm: GPGPU boids** (runner-up) | 30–60k particles as boids on the GPU (ping-pong FBOs); the cursor is a target they fly to; sections arrange the swarm into formations.                                                                  | A swarm forming shapes is the most cloned WebGL showcase; it shows motion, not cooperation; float render targets are the first thing mid-range phones choke on.        | High: additive fill rate, 2 simulations per frame; on mobile it has to drop to ~8–16k and still risks < 45 fps.                                                | Before: one document. After: rewrite `src/scene` + GPGPU helpers (about 8 files, 2 days).                              |
| **C. Mycelium: a growing network**    | Agents as tips exploring space (space colonisation) — the network grows from the cursor; scrolling completes the growth until the full graph at the contact section.                                    | Growth is a one-way story, spent after the first scroll; an organic look pulls the brand toward biology instead of engineering; geometry grows every frame on the CPU. | Medium and rising: geometry buffers resized on the fly, growth algorithm on the CPU (or in a worker).                                                          | Before: one document. After: rewrite `src/scene` and the worker (about 7 files, 2 days).                               |
| **D. Static diagram** (minimum)       | No WebGL: one generated SVG network behind the hero, CSS parallax and a highlight following the cursor.                                                                                                 | Fails the brief: the site itself is meant to show front-end craft with real 3D, and a static diagram is what every agency template has.                                | Minimal.                                                                                                                                                       | Before: one document. Later: 1 SVG + 1 CSS, one hour.                                                                  |

**Choice: A — Relay.** It shows _cooperation_ (work handed between agents), not just motion, and
fits a phone budget with a few thousand instances instead of a GPGPU simulation.
**Runner-up: B — Swarm**: more spectacular on desktop, but more of a cloned effect and more
expensive on mobile. Weighting order: fidelity to the goal → reversibility → strength of evidence →
repository conventions → speed.

### Assumptions to verify

- **Assumption (would reverse the choice):** a mid-range phone draws ~1.5k nodes + ~4k segments with
  pulses at 60 fps, while 30k+ GPGPU particles fall below 45 fps. Check: frame-time probe with
  DevTools CPU throttling and a Moto G class device profile.
- **Assumption (would reverse the choice):** a sparse graph with directed, routed pulses reads as
  "agents handing work to each other", not as a generic plexus. Check: a 5-second test of the
  prototype with 3 people outside the project ("what does the background show?").

## Relay — description

### Elements

| Element        | Meaning                    | Look (tokens)                                                                                    |
| -------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| Node           | agent                      | point; size and brightness by "load" (`--scene-node`)                                            |
| Link           | hand-off channel           | thin line, almost invisible at rest (`--scene-edge`)                                             |
| Task pulse     | work going out to an agent | warm point with a short trail; the link behind it lights up (`--scene-pulse-task`)               |
| Result pulse   | result returning           | cool point, slower (`--scene-pulse-result`)                                                      |
| Cursor / touch | the client placing work    | faint glow (`--scene-cursor`); the nearest node becomes the "entry" and the network routes to it |
| Depth          | scale of the organisation  | 3 depth planes, linear fog toward `--scene-bg`, slight parallax with the cursor                  |

What sets it apart from a plexus (originality anchors, mandatory):

1. **The graph is fixed, not distance-based.** Links do not flicker as points drift closer — it is
   the topology of an organisation (nearest neighbours in 3D, with a few hubs), not an effect.
2. **Motion has a direction and a cause.** Every pulse follows a route (BFS) from the requester to
   an agent and comes back as a result of another colour. Nothing pulses "for decoration".
3. **The cursor is a client, not a magnet.** The cursor does not push points away; when it rests
   (~300 ms) the network sends work out from the node under it and the result comes back — the page
   "answers".
4. **Silence as the base state.** At rest motion is sparse (a few pulses per second) and links are
   barely visible. It is a background for the content, not a screensaver.

### Scene and page sections

Transitions take `--duration-scene` (1400 ms) with `--ease-in-out`; the active section comes from an
`IntersectionObserver`, not raw scroll events (no work per scroll event).

| Section  | Network state                                                                                                                | Message                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Hero     | Full, free network in depth; the first pulses start ~1 s after load; the cursor places work.                                 | "intelligence in motion"                  |
| Services | The network gathers into 3 clusters (packages P1 / P2 / P3); pulses circulate inside the cluster of the active service card. | one process → several processes → program |
| Projects | 4 constellations (the 4 showcase projects); hovering a project card fires a series of hand-offs in its constellation.        | working runs, not slides                  |
| Contact  | All routes converge on one node next to the e-mail address; the network quietens to a few pulses.                            | one point of contact                      |

### Performance

- Nodes: instanced quads with the circle and glow drawn in the fragment shader; links: one
  `LineSegments` with an "activity" attribute; pulses: a pool of instances.
- Motion computed in the vertex shader from `uTime` (node drift); the CPU only plans pulse routes
  (BFS on the graph, a few times per second).
- Adaptive quality: start from a level chosen by `hardwareConcurrency` and screen width (phones get
  fewer nodes and DPR ≤ 1.5), then measure the mean frame time — above 20 ms for 2 s lowers the level
  (node count, DPR, glow); it never goes back up during a session (no pumping).
- Paused off screen (`IntersectionObserver` on the canvas) and in a hidden tab (`visibilitychange`);
  `requestAnimationFrame` is stopped, not just idle.
- Lazy loading: three.js and the scene live in a separate chunk loaded with a dynamic `import()`
  after the content has rendered (`requestIdleCallback`).

### Fallbacks

- **No WebGL** (the renderer throws, or `webglcontextlost` without a restore): the canvas is removed
  and a static still of the network is shown instead — the deterministic graph from
  `src/scene/relay-graph.ts` drawn as SVG with the scene tokens. Preview: `/brand/`.
- **`prefers-reduced-motion: reduce`**: `--motion-scale` = 0 — no drift and no autonomous pulses;
  the scene renders one still frame, section changes cut to the new layout instead of re-forming,
  and the cursor starts no animation. Content and navigation are unchanged.
- **Weak hardware** (the lowest quality level still above 20 ms per frame): the same static still as
  without WebGL.
- **Print / PDF**: the scene is not rendered (`display: none` in print); documents use the `paper`
  theme.

### Colours and motion only from tokens

The scene has no colour literals. It reads `sceneTokensFromDocument()` from `src/styles/tokens.ts`
(`--scene-bg`, `--scene-node`, `--scene-edge`, `--scene-pulse-task`, `--scene-pulse-result`,
`--scene-cursor`, `--motion-scale`, `--duration-scene`) and the easing curves `--ease-in-out` and
`--ease-signal`. Changing the palette in `tokens.css` changes the scene, the pages, the logo
(`npm run brand:assets`) and the PDFs at once.
