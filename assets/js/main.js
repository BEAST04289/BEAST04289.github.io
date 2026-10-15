// Shaurya Upadhyay — portfolio. Vanilla ES modules + GSAP 3.15 (ScrollTrigger, SplitText,
// ScrambleText, DrawSVG) + Lenis 1.3. Everything degrades: no JS, no WebGL and
// prefers-reduced-motion all leave a complete, readable page.
import { createParticleField } from './gl.js';
import { initProcess } from './process.js';
import { initTerminal } from './terminal.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const DESKTOP = '(min-width: 900px)';

const safe = (name, fn) => {
  try { return fn(); } catch (err) { console.error(`[portfolio] ${name} failed`, err); return null; }
};

// ------------------------------------------------------------------ small UI bits (no GSAP needed)
function toast(msg) {
  const t = $('.toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('is-on'), 2200);
}

function initClock() {
  const el = $('[data-clock]');
  if (!el) return;
  const fmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
  const tick = () => { el.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 15000);
}

function initCopy() {
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      toast('Email copied to clipboard');
    } catch {
      toast(b.dataset.copy);
    }
  }));
}

function initAnchors(lenis) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 ? $(id) : null;
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(id === '#top' ? 0 : target, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    if (id === '#main') { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
    history.replaceState(null, '', id);
  });
}

function initNav(lenis, gsap) {
  const nav = $('.nav');
  const toggle = $('.nav__toggle');
  let lastY = 0;
  const onScroll = (y) => {
    nav.classList.toggle('is-scrolled', y > 40);
    if (!root.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > lastY && y > 240);
    lastY = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else window.addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) {
      lenis?.stop();
      nav.classList.remove('is-hidden');
      gsap?.from('.menu a', { y: 40, opacity: 0, stagger: 0.05, duration: 0.7, ease: 'expo.out' });
    } else lenis?.start();
  };
  toggle?.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  $$('.menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
}

// ------------------------------------------------------------------ pointer effects (desktop only)
function initCursor(gsap) {
  if (!finePointer || reduced) return;
  root.classList.add('cursor-on');
  const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
  cur.classList.add('is-hidden');   // until the pointer actually moves
  gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08 }), dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  window.addEventListener('pointermove', (e) => {
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    cur.classList.remove('is-hidden');
  }, { passive: true });
  document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) cur.classList.add('is-hidden'); });
  document.addEventListener('pointerover', (e) => {
    const t = e.target;
    const interactive = t.closest('a, button, input, [data-magnetic]');
    cur.classList.toggle('is-link', !!interactive);
    cur.classList.toggle('is-view', !interactive && !!t.closest('[data-cursor="view"]'));
  });
}

function initMagnetic(gsap) {
  if (!finePointer || reduced) return;
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.36);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

function initTilt(gsap) {
  if (!finePointer || reduced) return;
  $$('.project').forEach((card) => {
    gsap.set(card, { transformPerspective: 1400 });
    const rX = gsap.quickTo(card, 'rotationX', { duration: 0.7, ease: 'power3' });
    const rY = gsap.quickTo(card, 'rotationY', { duration: 0.7, ease: 'power3' });
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      rY((px - 0.5) * 6);
      rX(-(py - 0.5) * 6);
      card.style.setProperty('--gx', `${px * 100}%`);
      card.style.setProperty('--gy', `${py * 100}%`);
    });
    card.addEventListener('pointerleave', () => { rX(0); rY(0); });
  });
}

function initSpotlight() {
  const bento = $('.bento');
  if (!bento || !finePointer) return;
  const cells = $$('.cell', bento);
  bento.addEventListener('pointermove', (e) => {
    cells.forEach((c) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - r.left}px`);
      c.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

// ------------------------------------------------------------------ loader + hero
function runLoader(gsap, lenis) {
  const loader = $('.loader');
  if (!loader || reduced) { root.classList.add('is-ready'); return Promise.resolve(); }
  let quick = false;
  try { quick = sessionStorage.getItem('su-seen') === '1'; sessionStorage.setItem('su-seen', '1'); } catch { /* storage blocked */ }
  lenis?.stop();
  const count = $('.loader__count'), bar = $('.loader__bar span');
  const o = { v: 0 };
  return new Promise((resolve) => {
    gsap.timeline({ onComplete: () => { root.classList.add('is-ready'); lenis?.start(); resolve(); } })
      .from('.loader__mark', { scale: 0.5, opacity: 0, rotation: -30, duration: 0.8, ease: 'expo.out' })
      .from('.loader__box', { drawSVG: '0%', duration: 1, ease: 'power2.inOut' }, 0)
      .from('.loader__name span', { yPercent: 110, duration: 0.9, ease: 'expo.out' }, 0.1)
      .to(o, {
        v: 100, duration: quick ? 0.45 : 1.25, ease: 'power2.inOut',
        onUpdate: () => {
          count.textContent = String(Math.round(o.v)).padStart(3, '0');
          bar.style.transform = `scaleX(${o.v / 100})`;
        },
      }, 0.15)
      .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.95, ease: 'expo.inOut' }, '+=0.1');
  });
}

function preHide(gsap) {
  if (reduced) return;
  gsap.set('[data-hero]', { opacity: 0, y: 34 });
  gsap.set('.hero__title', { opacity: 0 });
}

function heroIntro(gsap, SplitText, ScrollTrigger) {
  if (reduced) return;
  const split = SplitText.create('.hero__title .line', { type: 'chars' });
  gsap.set('.hero__title', { opacity: 1 });
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from(split.chars, { yPercent: 118, rotate: 7, duration: 1.35, stagger: 0.035 })
    .to('[data-hero]', { opacity: 1, y: 0, duration: 1.15, stagger: 0.09 }, 0.35);

  // rotating verb, scrambled like a decoder
  const rot = $('.rotator');
  if (!rot || !window.ScrambleTextPlugin) return;
  const words = rot.dataset.words.split(',');
  let i = 0, visible = true;
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onToggle: (s) => { visible = s.isActive; } });
  setInterval(() => {
    if (document.hidden || !visible) return;
    i = (i + 1) % words.length;
    gsap.to(rot, { duration: 1.1, scrambleText: { text: words[i], chars: 'lowerCase', speed: 0.6, revealDelay: 0.25 }, ease: 'none' });
  }, 2800);
}

// ------------------------------------------------------------------ scroll scenes
function buildScenes(gsap, ScrollTrigger, SplitText, field) {
  // headings: masked line reveals
  if (!reduced) {
    $$('[data-split]').forEach((h) => {
      SplitText.create(h, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 108, duration: 1.15, ease: 'expo.out', stagger: 0.09,
          scrollTrigger: { trigger: h, start: 'top 86%', once: true },
        }),
      });
    });
    $$('[data-reveal]').forEach((el) => gsap.from(el, {
      opacity: 0, y: 36, duration: 1.15, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    }));
  }

  const mm = gsap.matchMedia();

  // ABOUT: words light up as you scroll (pinned on desktop)
  const words = $('[data-scrub-words]');
  if (words && !reduced) {
    const split = SplitText.create(words, { type: 'words' });
    gsap.set(split.words, { opacity: 0.14 });
    mm.add({ desktop: DESKTOP, mobile: '(max-width: 899px)' }, (ctx) => {
      const { desktop } = ctx.conditions;
      gsap.fromTo(split.words, { opacity: 0.14 }, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: desktop
          ? { trigger: '.manifesto__pin', start: 'top top', end: '+=115%', pin: true, scrub: 0.6, refreshPriority: 3 }
          : { trigger: words, start: 'top 82%', end: 'bottom 42%', scrub: 0.6, refreshPriority: 3 },
      });
    });
  }

  // the particle sphere unfolds into clusters across the hero + about
  if (field) {
    ScrollTrigger.create({
      trigger: '.hero', start: 'top top', endTrigger: '.manifesto', end: 'bottom top',
      onUpdate: (s) => field.setScroll(s.progress),
      onRefresh: (s) => field.setScroll(s.progress),
    });
  }

  // NUMBERS: ranks count *down* to the final place, money counts up
  $$('.stat .num').forEach((el, i) => {
    if (reduced) return;
    const delay = (i % 3) * 0.12;
    if (el.hasAttribute('data-scramble')) {
      const text = el.textContent;
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(el, { duration: 1.6, delay, scrambleText: { text, chars: '0123456789#%', revealDelay: 0.4, speed: 0.5 } }),
      });
      return;
    }
    const from = +el.dataset.countFrom, to = +el.dataset.countTo, prefix = el.dataset.prefix ?? '';
    const o = { v: from };
    const render = () => { el.textContent = prefix + Math.round(o.v).toLocaleString('en-US'); };
    render();
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(o, { v: to, duration: from > 1000 ? 2.4 : 1.6, delay, ease: 'expo.out', onUpdate: render }),
    });
  });

  // PROCESS: "How I build AI systems" scrollytelling
  safe('process', () => initProcess(gsap, ScrollTrigger, { reduced }));

  // WORK: horizontal gallery, pinned (desktop)
  mm.add(DESKTOP, () => {
    if (reduced) return undefined;
    const track = $('.work__track');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.work__pin', start: 'top top', end: () => `+=${dist() * 0.8}`,
        pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: 1,
      },
    });
    $$('.project', track).forEach((card) => {
      gsap.fromTo(card.querySelector('.project__art svg'), { xPercent: 16, scale: 0.9 }, {
        xPercent: -8, scale: 1, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
      });
    });
    return () => gsap.set(track, { clearProps: 'transform' });
  });
  mm.add('(max-width: 899px)', () => {
    if (reduced) return;
    $$('.project').forEach((card) => gsap.from(card, {
      opacity: 0, y: 50, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 88%', once: true },
    }));
  });

  // JOURNEY: the line draws itself, cards slide in from their side
  const line = $('.timeline__fill');
  if (line && !reduced) {
    gsap.fromTo(line, { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 70%', scrub: 0.5 },
    });
    $$('.tl').forEach((item) => {
      const fromLeft = item.matches(':nth-child(even)') && matchMedia(DESKTOP).matches;
      const st = { trigger: item, start: 'top 84%', once: true };
      gsap.from(item.querySelector('.tl__card'), { opacity: 0, x: fromLeft ? -60 : 60, duration: 1.1, ease: 'expo.out', scrollTrigger: st });
      gsap.from(item.querySelector('.tl__when'), { opacity: 0, y: 14, duration: 0.9, ease: 'expo.out', scrollTrigger: st });
      gsap.from(item.querySelector('.tl__node'), { scale: 0, duration: 0.7, ease: 'back.out(3)', scrollTrigger: st });
    });
  }

  // STACK: twin marquees that speed up (and flip) with scroll velocity
  const tweens = [];
  $$('.marquee__row').forEach((row) => {
    const list = row.querySelector('ul');
    const clone = list.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    row.appendChild(clone);
    if (reduced) return;
    const dir = +row.dataset.dir || 1;
    tweens.push({ dir, t: gsap.fromTo(row, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 48, ease: 'none', repeat: -1 }) });
  });
  if (tweens.length && window.__lenis) {
    let speed = 1;
    gsap.ticker.add(() => {
      const v = window.__lenis.velocity || 0;
      const target = (1 + Math.min(Math.abs(v) * 0.09, 5)) * (v < -0.5 ? -1 : 1);
      speed += (target - speed) * 0.08;
      tweens.forEach(({ t }) => t.timeScale(speed));
    });
  }

  // nav: highlight the section in view
  $$('.nav__links a').forEach((a) => {
    const sec = $(a.getAttribute('href'));
    if (sec) ScrollTrigger.create({ trigger: sec, start: 'top 45%', end: 'bottom 45%', onToggle: (s) => a.classList.toggle('is-active', s.isActive) });
  });

  // top progress bar
  gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
  ScrollTrigger.sort();
}

// ------------------------------------------------------------------ boot
function boot() {
  const { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, Lenis } = window;
  initClock();
  initCopy();

  if (!gsap || !ScrollTrigger || !SplitText) {
    // a vendor file failed to load: keep everything visible and usable
    root.classList.remove('js');
    initAnchors(null);
    initNav(null, null);
    safe('terminal', () => initTerminal({ reduced: true }));
    return;
  }
  window.__portfolioReady = true;
  gsap.registerPlugin(ScrollTrigger, SplitText, ...[ScrambleTextPlugin, DrawSVGPlugin].filter(Boolean));
  ScrollTrigger.config({ ignoreMobileResize: true });

  let lenis = null;
  if (!reduced && Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }

  initAnchors(lenis);
  initNav(lenis, gsap);
  safe('cursor', () => initCursor(gsap));
  safe('magnetic', () => initMagnetic(gsap));
  safe('tilt', () => initTilt(gsap));
  safe('spotlight', () => initSpotlight());
  preHide(gsap);

  const canvas = $('canvas.gl');
  const field = !reduced && canvas ? safe('webgl', () => createParticleField(canvas, { mobile: !matchMedia(DESKTOP).matches })) : null;
  if (!field) root.classList.add('no-gl');
  window.__gl = !!field;

  const ready = document.fonts?.ready ?? Promise.resolve();
  ready.then(() => {
    safe('scenes', () => buildScenes(gsap, ScrollTrigger, SplitText, field));
    safe('terminal', () => initTerminal({ gsap, reduced }));
    ScrollTrigger.refresh();
    return runLoader(gsap, lenis);
  }).then(() => {
    safe('hero', () => heroIntro(gsap, SplitText, ScrollTrigger));
    field?.setScroll(ScrollTrigger.getAll().length ? (scrollY / Math.max(1, innerHeight * 2)) : 0);
  }).catch((err) => {
    console.error('[portfolio] boot failed', err);
    gsap.set(['[data-hero]', '.hero__title'], { clearProps: 'all' });
    root.classList.add('is-ready');
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
}

boot();
