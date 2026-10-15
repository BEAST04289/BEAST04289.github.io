// A small interactive terminal. Content mirrors the rest of the page; links are real.

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;

const COMMANDS = {
  help: {
    about: 'list commands',
    run: () => [
      '<span class="acc">available commands</span>',
      ...Object.entries(COMMANDS).filter(([, c]) => c.about).map(([k, c]) => `  <span class="vio">${k.padEnd(12)}</span><span class="dim">${c.about}</span>`),
      '<span class="dim">tip: ↑/↓ for history, tab to autocomplete</span>',
    ],
  },
  whoami: {
    about: 'the short version',
    run: () => [
      '<span class="acc">Shaurya Upadhyay</span> — AI engineer in the making · CS @ Manipal University Jaipur',
      'B.Tech CSE · CGPA 8.12/10 · class of 2029 · Pune / Jaipur, India',
      'I build AI agents, RAG systems and the backend that ships them. <span class="p">Open to AI/ML, SWE &amp; SDE roles.</span>',
    ],
  },
  projects: {
    about: 'six builds with results',
    run: () => [
      `<span class="gold">Sarthi Kalyan</span>  multi-agent RAG assistant, 750+ schemes · Top 100/1,400+ XPRIZE · ${link('https://github.com/BEAST04289/SchemeBot', 'repo')}`,
      `<span class="gold">iWebify</span>        9-stage LLM app compiler with targeted repair · ${link('https://github.com/BEAST04289/iWEBIFY', 'repo')}`,
      `<span class="gold">Sentinel</span>       RAG agent for SEC filings · rank 14/2,200+ IIT Madras · ${link('https://github.com/BEAST04289/Sentinel', 'repo')}`,
      `<span class="gold">SHIELD</span>         anti-scam AI on AWS · 8 min → 4.2 s · ${link('https://github.com/BEAST04289/AWS_AI-FOR-BHARAT', 'repo')}`,
      `<span class="gold">CaseVera</span>       AI investigation agent · Top 25 Hacker House Goa · ${link('https://github.com/BEAST04289/CaseVera', 'repo')}`,
      `<span class="gold">DugTrio</span>        verifiable sentiment agent · $5,000 Solana grant · ${link('https://github.com/BEAST04289/DugTrio', 'repo')}`,
    ],
  },
  awards: {
    about: 'ranks, grants, recognition',
    run: () => [
      '<span class="gold">#1 / 28,017</span>      live-proctored data analytics assessment (top 0.004%)',
      '<span class="gold">Top 25</span>           TigerGraph × Hacker House Goa 2026',
      '<span class="gold">Top 100 / 1,400+</span> XPRIZE Build with Gemini 2026 (top 7%)',
      '<span class="gold">#14 / 2,200+</span>     IIT Madras Synaptix Frontier AI Hackathon (top 1%)',
      '<span class="gold">$5,000</span>           Solana Foundation security audit subsidy',
      '<span class="gold">2 merged PRs</span>     OWASP OpenCRE (#837, #993)',
      '<span class="gold">Top 10 / 232</span>     100x School × Superteam India ($450)',
      '<span class="gold">#65 / 2,055</span>      OpenCode\'25 · plus CraftNCode National Finalist, WikiTech Top 100, MUJ Excellence Award',
    ],
  },
  stack: {
    about: 'languages, AI, data, cloud',
    run: () => [
      '<span class="acc">languages</span>  Python · Java · C++ · C · SQL · JavaScript · TypeScript · Bash',
      '<span class="acc">ai/ml</span>      LangGraph · RAG · agent evaluation · Gemini · Bedrock · Hugging Face · ChromaDB · FAISS · Qdrant',
      '<span class="acc">graph/data</span> TigerGraph · GSQL · PostgreSQL · SQLite · BigQuery · Pandas · NumPy · Plotly',
      '<span class="acc">backend</span>    FastAPI · Pydantic · REST · React · Next.js · AWS · GCP · Docker · Linux · CI/CD',
    ],
  },
  experience: {
    about: 'where I have worked',
    run: () => [
      '<span class="acc">Data Analyst Intern</span> · Bluestock Fintech · Jul – Sep 2026 — #1 of 28,017; 40-fund analytics platform',
      '<span class="acc">Open Source</span> · OWASP OpenCRE · Mar – Jul 2026 — 2 merged PRs (crash fix, CodeQL open redirect)',
      '<span class="acc">Cohort member</span> · Wikimedia WikiTech · Jan 2026 – present — top 100 nationally',
    ],
  },
  contact: {
    about: 'how to reach me',
    run: () => [
      `email     ${link('mailto:shaurya04289@gmail.com', 'shaurya04289@gmail.com')}`,
      `linkedin  ${link('https://www.linkedin.com/in/shaurya--upadhyay/', 'in/shaurya--upadhyay')}`,
      `github    ${link('https://github.com/BEAST04289', 'github.com/BEAST04289')}`,
      `telegram  ${link('https://t.me/BEAST04289', 't.me/BEAST04289')}`,
    ],
  },
  github: { about: 'open GitHub', run: (ctx) => ctx.open('https://github.com/BEAST04289', 'opening github.com/BEAST04289 …') },
  linkedin: { about: 'open LinkedIn', run: (ctx) => ctx.open('https://www.linkedin.com/in/shaurya--upadhyay/', 'opening LinkedIn …') },
  email: { about: 'write me an email', run: (ctx) => ctx.open('mailto:shaurya04289@gmail.com', 'opening your mail app …') },
  ls: { run: () => ['<span class="vio">projects/</span>  <span class="vio">awards/</span>  <span class="vio">stack/</span>  contact.txt  README.md'] },
  cat: { run: (ctx, args) => (args[0]?.toLowerCase() === 'readme.md' ? COMMANDS.whoami.run(ctx) : args[0]?.startsWith('contact') ? COMMANDS.contact.run(ctx) : [`cat: ${esc(args[0] || '')}: no such file`]) },
  date: { run: () => [new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' }) + ' IST'] },
  echo: { run: (ctx, args) => [esc(args.join(' '))] },
  clear: { about: 'clear the screen', run: (ctx) => { ctx.clear(); return []; } },
  sudo: {
    run: (ctx, args) => {
      if (args.join(' ').toLowerCase().startsWith('hire')) {
        return [
          '[sudo] password for recruiter: ••••••••',
          '<span class="p">✓ access granted</span>',
          'compiling offer… linking résumé… <span class="gold">done</span>',
          `next step → ${link('mailto:shaurya04289@gmail.com?subject=Opportunity%20for%20Shaurya', 'send the email')} 🎉`,
        ];
      }
      return ['nice try. this incident will be reported to /dev/null'];
    },
  },
  exit: { run: () => ['there is no exit. try <span class="acc">contact</span> instead.'] },
};

export function initTerminal({ gsap, reduced = false } = {}) {
  const body = document.getElementById('term-body');
  const form = document.getElementById('term-form');
  const input = document.getElementById('term-input');
  if (!body || !form || !input) return;
  const history = [];
  let hIdx = 0;

  const print = (lines) => {
    lines.forEach((html, i) => {
      const ln = document.createElement('div');
      ln.className = 'ln';
      ln.innerHTML = html;
      body.appendChild(ln);
      if (gsap && !reduced) gsap.from(ln, { opacity: 0, y: 6, duration: 0.35, delay: i * 0.035, ease: 'power2.out' });
    });
    body.scrollTop = body.scrollHeight;
  };
  const ctx = {
    clear: () => { body.innerHTML = ''; },
    open: (url, msg) => { window.open(url, url.startsWith('mailto:') ? '_self' : '_blank', 'noopener'); return [`<span class="dim">${msg}</span>`]; },
  };

  function run(raw) {
    const line = raw.trim();
    print([`<span class="p">shaurya@portfolio:~$</span> <span class="cmd">${esc(line)}</span>`]);
    if (!line) return;
    history.push(line);
    hIdx = history.length;
    const [name, ...args] = line.split(/\s+/);
    const cmd = COMMANDS[name.toLowerCase()];
    print(cmd ? cmd.run(ctx, args) : [`command not found: ${esc(name)} — try <span class="acc">help</span>`]);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run(input.value);
    input.value = '';
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault();
      hIdx = Math.max(0, hIdx - 1);
      input.value = history[hIdx];
    } else if (e.key === 'ArrowDown' && history.length) {
      e.preventDefault();
      hIdx = Math.min(history.length, hIdx + 1);
      input.value = history[hIdx] || '';
    } else if (e.key === 'Tab') {
      const hit = Object.keys(COMMANDS).filter((k) => k.startsWith(input.value.trim().toLowerCase()));
      if (input.value && hit.length) {
        e.preventDefault();
        input.value = hit.length === 1 ? hit[0] + ' ' : input.value;
        if (hit.length > 1) print([`<span class="dim">${hit.join('  ')}</span>`]);
      }
    }
  });
  body.addEventListener('click', () => { if (!getSelection().toString()) input.focus({ preventScroll: true }); });
  document.querySelectorAll('.term__hints button').forEach((b) => b.addEventListener('click', () => run(b.dataset.cmd)));

  // Type "whoami" once, the first time the terminal scrolls into view.
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((en) => en.isIntersecting)) return;
    io.disconnect();
    if (reduced || !gsap) return run('whoami');
    const word = 'whoami';
    const o = { i: 0 };
    gsap.to(o, {
      i: word.length, duration: 0.7, ease: 'none', delay: 0.4, snap: { i: 1 },
      onUpdate: () => { input.value = word.slice(0, o.i); },
      onComplete: () => { run(word); input.value = ''; },
    });
  }, { threshold: 0.5 });
  io.observe(body);
}
