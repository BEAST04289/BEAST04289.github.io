// Hero background: a raw WebGL2 particle field, monochrome by design.
// ~12k points start as a sphere, drift away from the cursor, and reassemble into a
// slow, breathing wave surface as you scroll. No 3D library — one VAO, one program.

const VERT = `#version 300 es
precision highp float;
layout(location=0) in vec3 aA;
layout(location=1) in vec3 aB;
layout(location=2) in vec4 aSeed;   // x: random, y: size, z: brightness, w: morph delay
uniform mat4 uMVP;
uniform float uTime, uMorph, uPR, uSize, uForce, uAspect, uCamZ;
uniform vec2 uMouse, uOffset;
out float vLum;
out float vA;

void main() {
  float m = smoothstep(0.0, 1.0, clamp((uMorph - aSeed.w * 0.4) / 0.6, 0.0, 1.0));
  vec3 p = mix(aA, aB, m);
  float t = uTime * 0.6 + aSeed.x * 6.2831;
  p += vec3(sin(t), cos(t * 1.3), sin(t * 0.7)) * 0.01;
  p.y += m * 0.07 * sin(uTime * 0.9 + p.x * 2.2 + p.z * 1.4);   // the surface breathes

  vec4 clip = uMVP * vec4(p, 1.0);
  vec2 ndc = clip.xy / clip.w + uOffset;
  vec2 d = ndc - uMouse;
  d.x *= uAspect;
  float dist = length(d);
  float f = uForce * exp(-dist * dist * 26.0);
  vec2 dir = d / max(dist, 1e-4);
  dir.x /= uAspect;
  ndc += dir * f * 0.085;
  gl_Position = vec4(ndc * clip.w, clip.z, clip.w);

  float depth = clamp(1.0 - (clip.w - uCamZ) * 0.3, 0.35, 1.3);
  gl_PointSize = aSeed.y * uSize * uPR * depth * (1.0 + f * 1.4);
  vLum = mix(0.5, 1.0, aSeed.z) * (0.75 + 0.25 * depth);
  vA = (0.4 + 0.6 * (0.5 + 0.5 * sin(uTime * 1.6 + aSeed.x * 40.0))) * depth;
}`;

const FRAG = `#version 300 es
precision highp float;
in float vLum;
in float vA;
uniform float uAlpha;
out vec4 o;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = dot(c, c) * 4.0;
  float a = exp(-r * 3.4) * vA * uAlpha;
  if (a < 0.004) discard;
  o = vec4(vec3(vLum) * a, a);
}`;

// ---------------------------------------------------------------- tiny math (column-major)
const persp = (fov, asp, n, f) => {
  const t = 1 / Math.tan(fov / 2), nf = 1 / (n - f);
  return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0];
};
const mul = (a, b) => {
  const o = new Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
};
const rotY = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; };
const rotX = (a) => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; };
const trans = (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// Deterministic PRNG so the field looks the same on every visit.
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGeometry(N) {
  const R = rng(4289);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const side = Math.ceil(Math.sqrt(N));
  const A = new Float32Array(N * 3), B = new Float32Array(N * 3), S = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    // A: Fibonacci sphere with a slightly fuzzy shell
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i, j = 0.95 + R() * 0.1;
    A.set([Math.cos(th) * r * j, y * j, Math.sin(th) * r * j], i * 3);
    // B: a rippled surface (a scattered grid, so points fly to new homes as you scroll)
    const k = (i * 7919) % N;
    const gx = ((k % side) / (side - 1)) * 2 - 1, gz = (Math.floor(k / side) / (side - 1)) * 2 - 1;
    const x = gx * 2.9 + (R() - 0.5) * 0.03, z = gz * 1.8 + (R() - 0.5) * 0.03;
    B.set([x, 0.24 * Math.sin(gx * 4.2) * Math.cos(gz * 3.4) - 0.2, z], i * 3);
    const big = R() < 0.03;
    S.set([R(), big ? 2.4 + R() * 1.1 : 0.7 + R() * 1.0, R(), R()], i * 4);
  }
  return { A, B, S };
}

function program(gl, vs, fs) {
  const make = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  };
  const p = gl.createProgram();
  gl.attachShader(p, make(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, make(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) {
    const name = gl.getActiveUniform(p, i).name;
    u[name] = gl.getUniformLocation(p, name);
  }
  return { p, u };
}

export function createParticleField(canvas, { mobile = false } = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  if (!gl) return null;

  let prog;
  try {
    prog = program(gl, VERT, FRAG);
  } catch (err) {
    console.warn('[gl] shader setup failed, using fallback', err);
    return null;
  }

  const N = mobile ? 5200 : 12000;
  const geo = buildGeometry(N);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const attr = (loc, data, size) => {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  attr(0, geo.A, 3);
  attr(1, geo.B, 3);
  attr(2, geo.S, 4);
  gl.bindVertexArray(null);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  const base = { x: mobile ? 0 : 0.42, y: mobile ? 0.36 : 0.1 };
  const state = {
    morph: 0, alpha: 0, targetAlpha: mobile ? 0.5 : 0.9, offX: base.x, offY: base.y,
    mx: 0, my: 0, tmx: 0, tmy: 0, force: 0, lastMove: -1e9,
    yaw: 0, pitch: 0.3, running: false, past: false, raf: 0, t0: performance.now(), w: 1, h: 1, pr: 1,
  };

  function resize() {
    state.pr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.6);
    const w = Math.round(canvas.clientWidth * state.pr), h = Math.round(canvas.clientHeight * state.pr);
    if (w === state.w && h === state.h) return;
    canvas.width = state.w = Math.max(1, w);
    canvas.height = state.h = Math.max(1, h);
    gl.viewport(0, 0, state.w, state.h);
  }

  window.addEventListener('pointermove', (e) => {
    state.tmx = (e.clientX / innerWidth) * 2 - 1;
    state.tmy = -((e.clientY / innerHeight) * 2 - 1);
    state.lastMove = performance.now();
  }, { passive: true });
  window.addEventListener('resize', resize);

  function frame(now) {
    state.raf = requestAnimationFrame(frame);
    resize();
    const t = (now - state.t0) / 1000;
    const active = now - state.lastMove < 1600;
    state.mx = lerp(state.mx, state.tmx, 0.08);
    state.my = lerp(state.my, state.tmy, 0.08);
    state.force = lerp(state.force, active ? 1 : 0, 0.05);
    state.alpha = lerp(state.alpha, state.targetAlpha, 0.05);
    state.yaw = t * 0.06 * (1 - state.morph * 0.7) + state.mx * 0.3;
    state.pitch = lerp(state.pitch, 0.3 + state.morph * 0.25 - state.my * 0.15, 0.05);

    const aspect = state.w / state.h;
    const camZ = Math.max(3.9, 1 / (0.72 * aspect * 0.3443)) + state.morph * 0.3;
    const model = mul(rotX(state.pitch), rotY(state.yaw));
    const mvp = mul(persp(0.663, aspect, 0.1, 60), mul(trans(0, 0, -camZ), model));

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog.p);
    const u = prog.u;
    gl.uniformMatrix4fv(u.uMVP, false, mvp);
    gl.uniform1f(u.uTime, t);
    gl.uniform1f(u.uMorph, state.morph);
    gl.uniform1f(u.uAlpha, state.alpha);
    gl.uniform1f(u.uForce, state.force);
    gl.uniform1f(u.uAspect, aspect);
    gl.uniform1f(u.uCamZ, camZ);
    gl.uniform1f(u.uPR, state.pr);
    gl.uniform1f(u.uSize, mobile ? 2.4 : 2.2);
    gl.uniform2f(u.uMouse, state.mx, state.my);
    gl.uniform2f(u.uOffset, state.offX, state.offY);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.POINTS, 0, N);
    gl.bindVertexArray(null);
  }

  const api = {
    start() {
      if (state.running) return;
      state.running = true;
      canvas.style.visibility = 'visible';
      state.raf = requestAnimationFrame(frame);
    },
    stop() {
      if (!state.running) return;
      state.running = false;
      cancelAnimationFrame(state.raf);
      canvas.style.visibility = 'hidden';
    },
    // p: 0 at the top of the hero → 1 once the About section has scrolled past
    setScroll(p) {
      state.morph = smooth(0.08, 0.62, p);
      const spread = smooth(0, 0.5, p);
      state.offX = lerp(base.x, 0, spread);
      state.offY = lerp(base.y, 0, spread);
      state.targetAlpha = lerp(mobile ? 0.5 : 0.9, mobile ? 0.3 : 0.45, smooth(0.25, 0.7, p)) * (1 - smooth(0.86, 1, p));
      state.past = p >= 0.999;
      if (state.past) api.stop(); else if (!document.hidden) api.start();
    },
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) api.stop();
    else if (!state.past) api.start();
  });
  resize();
  return api;
}
