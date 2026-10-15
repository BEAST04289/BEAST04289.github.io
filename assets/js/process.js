// "How I build AI systems" — scrollytelling. Each step on the left drives the sticky
// pipeline on the right: the rail fills, the active stage lights up and its panel
// animates in. States are absolute, so scrolling back up rewinds cleanly.

const STAGES = ['define', 'retrieve', 'reason', 'act', 'evaluate', 'ship'];

export function initProcess(gsap, ScrollTrigger, { reduced = false } = {}) {
  const section = document.querySelector('#process');
  const viz = section?.querySelector('#viz');
  if (!viz) return;
  const steps = [...section.querySelectorAll('.step')];
  const items = [...viz.querySelectorAll('.pipe li')];
  const panels = [...viz.querySelectorAll('.panel')];
  const fill = viz.querySelector('.pipe__fill');
  const hudStep = viz.querySelector('.viz__step');
  const hudLabel = viz.querySelector('.viz__label');
  const d = (s) => (reduced ? 0 : s);

  gsap.set(panels, { autoAlpha: 0, y: 16 });
  gsap.set(fill, { scaleY: 0, transformOrigin: '50% 0%' });

  let current = 0;
  function apply(n) {
    if (n === current) return;
    current = n;
    hudStep.textContent = String(n).padStart(2, '0');
    hudLabel.textContent = STAGES[n - 1];
    steps.forEach((s, i) => s.classList.toggle('is-active', i === n - 1));
    items.forEach((li, i) => {
      li.classList.toggle('is-active', i === n - 1);
      li.classList.toggle('is-done', i < n - 1);
    });
    gsap.to(fill, { scaleY: (n - 1) / 5, duration: d(0.8), ease: 'power3.out', overwrite: 'auto' });
    panels.forEach((p, i) => {
      const on = i === n - 1;
      gsap.to(p, { autoAlpha: on ? 1 : 0, y: on ? 0 : 16, duration: d(on ? 0.6 : 0.25), delay: on ? d(0.1) : 0, ease: 'power3.out', overwrite: 'auto' });
    });

    const panel = panels[n - 1];
    if (!panel || reduced) return;
    const bits = panel.querySelectorAll('.node, .badge, .code, .panel__big');
    const bars = panel.querySelectorAll('.rank i, .ship__bar i');
    if (bits.length) gsap.fromTo(bits, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: 'expo.out', delay: 0.12, overwrite: 'auto' });
    if (bars.length) gsap.fromTo(bars, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0% 50%', duration: 1.1, stagger: 0.14, ease: 'expo.out', delay: 0.3 });
    panel.querySelectorAll('.meter i').forEach((bar, k) => {
      gsap.fromTo(bar, { '--s': 0 }, { '--s': 1, duration: 1.2, delay: 0.3 + k * 0.1, ease: 'expo.out' });
    });
  }

  section.classList.add('is-live');
  apply(1);
  steps.forEach((step, i) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 62%',
      end: 'bottom 62%',
      onToggle: (self) => { if (self.isActive) apply(i + 1); },
    });
  });
}
