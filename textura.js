/* ─────────────────────────────────────────────
   TEXTURA-INSPIRED INTERACTION LAYER (60FPS ZERO-REFLOW ENGINE)
   Preloader · kinetic name · cursor labels · scroll-velocity marquee
   · split heading reveals · card tilt · live HUD · live IST clock
───────────────────────────────────────────── */
(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;

  // Shared pointer coordinates
  const ptr = { x: innerWidth / 2, y: innerHeight / 2 };
  window.addEventListener('mousemove', e => { ptr.x = e.clientX; ptr.y = e.clientY; }, { passive: true });

  // ── 1. SPLIT HERO NAME INTO KINETIC LETTERS ──
  const heroName = document.getElementById('hero-name');
  const heroEl = document.getElementById('hero');
  const chars = [];
  if (heroName && !reduce) {
    heroName.querySelectorAll('.line-inner').forEach((line, li) => {
      const text = line.textContent;
      line.textContent = '';
      [...text].forEach((ch, i) => {
        const outer = document.createElement('span');
        outer.className = 'char';
        const inner = document.createElement('span');
        inner.className = 'char-in';
        inner.textContent = ch;
        inner.style.animationDelay = `${0.04 + li * 0.12 + i * 0.035}s`;
        outer.appendChild(inner);
        line.appendChild(outer);
        chars.push({ el: outer, x: 0, y: 0, r: 0, baseCX: 0, baseCY: 0 });
      });
    });
    heroName.classList.add('is-split');
  }

  // ── 2. HIGH-SPEED RESPONSIVE PRELOADER (420ms) ──
  const pre = document.getElementById('preloader');
  const preCount = document.getElementById('pre-count');
  const preFill = document.getElementById('pre-bar-fill');
  const alreadyBooted = sessionStorage.getItem('portfolio_booted');

  if (pre && !reduce && !location.search.includes('nopre') && !alreadyBooted) {
    sessionStorage.setItem('portfolio_booted', '1');
    document.body.classList.add('is-loading');
    chars.forEach(c => { if (c.el.firstChild) c.el.firstChild.style.animationPlayState = 'paused'; });
    let n = 0;
    const start = performance.now();
    const tick = now => {
      const t = Math.min(1, (now - start) / 450);
      n = Math.round((1 - Math.pow(1 - t, 3)) * 100);
      preCount.textContent = String(n).padStart(3, '0');
      preFill.style.width = n + '%';
      if (t < 1) return requestAnimationFrame(tick);
      setTimeout(() => {
        pre.classList.add('done');
        document.body.classList.remove('is-loading');
        chars.forEach(c => { if (c.el.firstChild) c.el.firstChild.style.animationPlayState = 'running'; });
        setTimeout(() => pre.remove(), 600);
      }, 60);
    };
    requestAnimationFrame(tick);
  } else if (pre) {
    pre.remove();
  }

  // ── 3. ZERO-REFLOW CURSOR-REACTIVE LETTERS ──
  if (chars.length && fine) {
    const RADIUS = 160;
    let isNearHero = false;
    let charRaf = null;

    const cacheCharPositions = () => {
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      chars.forEach(c => {
        const b = c.el.getBoundingClientRect();
        c.baseCX = b.left + b.width / 2 - c.x + scrollX;
        c.baseCY = b.top + b.height / 2 - c.y + scrollY;
      });
    };

    window.addEventListener('resize', cacheCharPositions, { passive: true });
    setTimeout(cacheCharPositions, 650);

    const updateChars = () => {
      let isMoving = false;
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      chars.forEach(c => {
        if (!c.baseCX) return;
        const cx = c.baseCX - scrollX;
        const cy = c.baseCY - scrollY;
        const dx = cx - ptr.x;
        const dy = cy - ptr.y;
        const d = Math.hypot(dx, dy);
        let tx = 0, ty = 0, tr = 0;

        if (d < RADIUS) {
          const f = 1 - d / RADIUS;
          const ease = f * f;
          tx = (dx / (d || 1)) * ease * 16;
          ty = (dy / (d || 1)) * ease * 16 - ease * 8;
          tr = (dx / RADIUS) * ease * 8;
          isMoving = true;
        }

        c.el.classList.toggle('hot', d < RADIUS * 0.55);
        c.x = lerp(c.x, tx, 0.16);
        c.y = lerp(c.y, ty, 0.16);
        c.r = lerp(c.r, tr, 0.16);

        if (Math.abs(c.x) > 0.04 || Math.abs(c.y) > 0.04 || Math.abs(tx) > 0.04) {
          c.el.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0) rotate(${c.r.toFixed(1)}deg)`;
          isMoving = true;
        }
      });

      if (isNearHero || isMoving) {
        charRaf = requestAnimationFrame(updateChars);
      } else {
        charRaf = null;
      }
    };

    if (heroEl) {
      heroEl.addEventListener('mouseenter', () => {
        isNearHero = true;
        if (!chars[0]?.baseCX) cacheCharPositions();
        if (!charRaf) charRaf = requestAnimationFrame(updateChars);
      });
      heroEl.addEventListener('mouseleave', () => {
        isNearHero = false;
      });
    }
  }

  // ── 4. CONTEXTUAL CURSOR LABELS ("Drag", "View", "Mail") ──
  const label = document.getElementById('cursor-label');
  if (label && fine) {
    const bind = (sel, text) => document.querySelectorAll(sel).forEach(el => {
      el.addEventListener('mouseenter', () => {
        label.textContent = el.getAttribute('data-cursor') || text;
        document.body.classList.add('cursor-labeled');
      });
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-labeled'));
    });
    bind('[data-cursor]', 'View');
    bind('.contact-btn', 'Mail');
  }

  // ── 5. SPLIT HEADINGS INTO WORDS + REVEAL ON SCROLL ──
  document.querySelectorAll('.split-reveal').forEach(h => {
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.className = 'word';
            const i = document.createElement('span');
            i.textContent = part;
            w.appendChild(i);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.classList.contains('word')) {
          const w = document.createElement('span');
          w.className = 'word';
          const i = document.createElement('span');
          child.replaceWith(w);
          i.appendChild(child);
          w.appendChild(i);
        }
      });
    };
    walk(h);
    h.querySelectorAll('.word > span').forEach((s, i) => { s.style.transitionDelay = `${i * 0.06}s`; });

    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          h.classList.add('in-view');
          o.unobserve(h);
        }
      });
    }, { threshold: 0.25 });
    obs.observe(h);
  });

  // ── 6. VELOCITY MARQUEE, SCROLL PROGRESS & ZERO-REFLOW HUD ──
  const bar = document.getElementById('scroll-progress');
  const track = document.querySelector('.marquee-track');
  const hudX = document.getElementById('hud-x');
  const hudY = document.getElementById('hud-y');
  const hudS = document.getElementById('hud-s');
  const blocks = [...document.querySelectorAll('.project-block')];

  let lastY = scrollY, vel = 0, marqX = 0, hudTick = 0;
  if (track && !reduce) track.classList.add('velocity');

  // Cache block offsets on resize (zero layout reflows in frame loop)
  let cachedBlockGeometry = [];
  const cacheBlockGeometry = () => {
    const scrollY = window.scrollY;
    cachedBlockGeometry = blocks.map(b => {
      const rect = b.getBoundingClientRect();
      return { el: b, top: rect.top + scrollY, height: rect.height };
    });
  };
  window.addEventListener('resize', cacheBlockGeometry, { passive: true });
  setTimeout(cacheBlockGeometry, 500);

  const frame = () => {
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const p = y / max;

    if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;

    vel = lerp(vel, y - lastY, 0.12);
    lastY = y;
    if (track && !reduce) {
      marqX -= 0.6 + Math.abs(vel) * 0.35;
      const half = track.scrollWidth / 2;
      if (half > 0 && -marqX >= half) marqX += half;
      const skew = Math.max(-8, Math.min(8, vel * 0.22));
      track.style.transform = `translate3d(${marqX.toFixed(1)}px,0,0) skewX(${(-skew).toFixed(2)}deg)`;
    }

    // Pure arithmetic ghost index parallax (zero layout reflows)
    cachedBlockGeometry.forEach(item => {
      const rTop = item.top - y;
      const off = (rTop + item.height / 2 - window.innerHeight / 2) * -0.12;
      item.el.style.setProperty('--ghost-y', `${off.toFixed(1)}px`);
    });

    // Throttled HUD update (every 4th frame)
    hudTick++;
    if (hudTick % 4 === 0 && hudX) {
      hudX.textContent = String(Math.round(ptr.x)).padStart(4, '0');
      hudY.textContent = String(Math.round(ptr.y)).padStart(4, '0');
      hudS.textContent = String(Math.round(p * 100)).padStart(3, '0') + '%';
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // ── 7. PROJECT CARD 3D TILT (CACHED ON HOVER) ──
  if (fine && !reduce) {
    document.querySelectorAll('.project-visual').forEach(card => {
      const inner = card.querySelector('.project-visual-inner');
      if (!inner) return;
      let rx = 0, ry = 0, tx = 0, ty = 0, active = false, raf = null;
      let cachedRect = null;

      const step = () => {
        rx = lerp(rx, tx, 0.1);
        ry = lerp(ry, ty, 0.1);
        inner.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        if (active || Math.abs(rx) > 0.02 || Math.abs(ry) > 0.02) raf = requestAnimationFrame(step);
        else raf = null;
      };

      card.addEventListener('mouseenter', () => {
        cachedRect = card.getBoundingClientRect();
      });

      card.addEventListener('mousemove', e => {
        if (!cachedRect) cachedRect = card.getBoundingClientRect();
        tx = ((e.clientY - cachedRect.top) / cachedRect.height - 0.5) * -10;
        ty = ((e.clientX - cachedRect.left) / cachedRect.width - 0.5) * 10;
        active = true;
        if (!raf) raf = requestAnimationFrame(step);
      });

      card.addEventListener('mouseleave', () => {
        tx = 0; ty = 0; active = false;
        cachedRect = null;
        if (!raf) raf = requestAnimationFrame(step);
      });
    });
  }

  // ── 8. LIVE IST CLOCK (JAIPUR · ASIA/KOLKATA) ──
  const clockEl = document.getElementById('live-ist-clock');
  if (clockEl) {
    const updateClock = () => {
      try {
        const now = new Date();
        const istStr = now.toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        clockEl.textContent = `${istStr} IST`;
      } catch (err) {
        const now = new Date();
        clockEl.textContent = `${now.toTimeString().slice(0, 8)} IST`;
      }
    };
    updateClock();
    setInterval(updateClock, 1000);
  }
})();
