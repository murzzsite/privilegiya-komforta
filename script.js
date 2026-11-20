const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/4RCQM87W26';
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const safe = fn => { try { fn(); } catch (e) { console.error(e); } };
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const bump = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  const pwl = (t, pts) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * (t - x0) / (x1 - x0); }
    return pts[pts.length - 1][1];
  };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };

  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  const bar = $('#bar');
  const onScrollBar = () => bar.classList.toggle('is-stuck', scrollY > 8);
  addEventListener('scroll', onScrollBar, { passive: true }); onScrollBar();

  /* заголовки в масках */
  safe(() => {
    const hs = $$('h2.mask');
    const io = ('IntersectionObserver' in window && !reduce) ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.querySelector('.ln').classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' }) : null;
    hs.forEach(h => {
      const t = h.textContent.trim(); h.setAttribute('aria-label', t);
      h.innerHTML = '<span class="ln" aria-hidden="true"><i></i></span>'; h.querySelector('i').textContent = t;
      if (io) io.observe(h); else h.querySelector('.ln').classList.add('in');
    });
  });

  /* телефон: статус дома */
  safe(() => {
    const tiles = $$('#tiles .tile'), log = $('#phLog'), clk = $('#phClock'), st = $('#phState');
    const by = k => tiles.find(t => t.dataset.k === k);
    const setTile = (k, on) => {
      const t = by(k); if (!t) return;
      t.setAttribute('aria-pressed', on ? 'true' : 'false');
      const em = $('em', t); em.textContent = on ? em.dataset.on : em.dataset.off;
    };
    tiles.forEach(t => { const em = $('em', t); const on = t.getAttribute('aria-pressed') === 'true'; em.textContent = on ? em.dataset.on : em.dataset.off; });
    const E = [
      ['light', true, '18:20', 'Закат. Уличный свет включён и приглушён.'],
      ['gate', true, '18:42', 'Калитка узнала своего по лицу.'],
      ['gate', false, '18:43', 'Калитка закрылась.'],
      ['water', true, '06:10', 'Влажность почвы низкая. Полив, зона 2.'],
      ['water', false, '06:25', 'Полив закончен, почва в норме.'],
      ['roof', true, '07:50', 'Пошёл снег. Подогрев кровли включён.'],
      ['roof', false, '09:30', 'Осадки закончились. Подогрев выключен.'],
      ['light', false, '06:15', 'Рассвет. Уличный свет выключен.']
    ];
    let i = 0, pause = 0;
    const play = () => {
      if (document.hidden || Date.now() < pause) return;
      const [k, on, tm, tx] = E[i++ % E.length];
      setTile(k, on); clk.textContent = tm; log.textContent = tm + ' ' + tx;
    };
    play();
    if (!reduce) setInterval(play, 2900);
    tiles.forEach(t => t.addEventListener('click', () => {
      const on = t.getAttribute('aria-pressed') !== 'true';
      setTile(t.dataset.k, on);
      log.textContent = 'Вы: «' + $('span', t).textContent + '» ' + (on ? 'включено.' : 'выключено.');
      pause = Date.now() + 9000;
    }));
    if (matchMedia('(pointer:fine)').matches && !reduce) {
      const ph = $('#phone');
      addEventListener('pointermove', e => {
        const x = e.clientX / innerWidth - .5, yy = e.clientY / innerHeight - .5;
        ph.style.transform = `rotate(${2.2 + x * 3}deg) translate(${x * 8}px,${yy * 8}px)`;
      }, { passive: true });
    }
  });

  /* манифест по словам и бегущая строка */
  let velocity = 0, lastY = scrollY;
  safe(() => {
    const m = $('#manifest'); if (!m) return;
    const words = m.textContent.trim().split(/\s+/);
    m.setAttribute('aria-label', m.textContent.trim());
    m.innerHTML = '';
    const spans = words.map(w => { const s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.textContent = w; m.append(s, ' '); return s; });
    const upd = () => {
      const r = m.getBoundingClientRect(), h = innerHeight;
      const p = clamp((h * .8 - r.top) / (r.height + h * .35));
      spans.forEach((s, k) => { s.style.opacity = (.16 + .84 * clamp(p * (spans.length + 3) - k)).toFixed(3); });
    };
    if (reduce) { spans.forEach(s => s.style.opacity = 1); return; }
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  });
  safe(() => {
    const tr = $('#belt'); if (!tr || reduce) return;
    let x = 0;
    const tick = () => {
      velocity += (Math.abs(scrollY - lastY) - velocity) * .12; lastY = scrollY;
      x -= .7 + Math.min(velocity, 60) * .35;
      const half = tr.scrollWidth / 2; if (-x >= half) x += half;
      tr.style.transform = `translate3d(${x}px,0,0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  /* сцена: дом за сутки и зиму */
  safe(() => {
    const sec = $('#day'), svg = $('#scene'); if (!sec || !svg) return;
    const g = id => svg.getElementById(id);
    const wins = $$('.win', svg), glass = wins.map(w => $('.glass', w)), curt = wins.map(w => $('.curt', w)), wglow = wins.map(w => $('.wg', w));
    const el = { sun: g('sun'), moon: g('moon'), clouds: g('clouds'), skyA: g('skyA'), skyB: g('skyB'), lawn: g('lawn'), hills: g('hills'), shade: g('shade'), lamps: g('lamps'), vent: g('vent'),
      floorHeat: g('floorHeat'), roofHeat: g('roofHeat'), roofSnow: g('roofSnow'), icicles: g('icicles'), drive: g('drive'), driveSnow: g('driveSnow'), driveHeat: g('driveHeat'),
      spr: g('spr'), wifi: g('wifi'), face: g('face'), scan: g('scanLine'), okDot: g('okDot'), okTick: g('okTick'), cams: g('cams'), gbr: g('gbr'), snow: g('snow'), flame: g('flame'),
      smoke: g('smoke'), ws: g('wsDot'), gl: g('gateL'), gr: g('gateR'), plaque: g('plaque') };

    // генерируемые детали
    const wave = (x0, x1, yy, amp, len) => { let d = `M${x0} ${yy} q${len / 4} ${-amp} ${len / 2} 0`; for (let x = x0 + len / 2; x < x1; x += len / 2) d += ` t${len / 2} 0`; return d; };
    el.floorHeat.setAttribute('d', wave(262, 640, 384, 6, 30) + ' ' + wave(262, 640, 392, 6, 30).replace('M262 392', 'M262 392'));
    el.floorHeat.classList.add('flow');
    [478, 488, 498].forEach(yy => { const p = mk('path', { d: wave(0, 900, yy, 5, 44), class: 'flow' }, el.driveHeat); });
    [318, 446, 574, 702].forEach((x, i) => {
      mk('path', { d: `M${x} 446 c-6-34-34-38-42-8 M${x} 446 c6-34 34-38 42-8`, class: 'flow', style: `animation-delay:${-i * .25}s` }, el.spr);
      mk('circle', { cx: x, cy: 446, r: 4, fill: '#5fb3e6', stroke: 'none' }, el.spr);
    });
    for (let x = 240; x < 670; x += 24) { const L = 10 + ((x * 7) % 14); mk('polygon', { points: `${x},229 ${x + 8},229 ${x + 4},${229 + L}` }, el.icicles); }
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 46; i++) {
      const c = mk('circle', { cx: Math.round(rnd() * 900), cy: 0, r: (1.6 + rnd() * 1.9).toFixed(1), class: 'fl', opacity: (.7 + rnd() * .3).toFixed(2) }, el.snow);
      c.style.setProperty('--dx', Math.round(-30 + rnd() * 60) + 'px'); c.style.animationDuration = (5 + rnd() * 5).toFixed(1) + 's'; c.style.animationDelay = (-rnd() * 10).toFixed(1) + 's';
    }

    const SKY = [['#a9c0dc', '#f8d9b0'], ['#8fc3ea', '#e3f2fb'], ['#6f86b8', '#f2a87a'], ['#2c3e5c', '#566d8e'], ['#b9c6d1', '#e7edf1']];
    const LAWN = ['#9db98f', '#a8cc96', '#8ea683', '#6d8466', '#eef3f6'];
    const SHADE = [.06, 0, .14, .34, .05];

    const STAGES = [
      { l: 'Утро', t: 'Шторы открылись по сценарию, тёплый пол прогрел дом, вентиляция сменила воздух и держит нужную температуру в каждой зоне.', s: [1, 4, 3, 2] },
      { l: 'День', t: 'Полив включается по влажности почвы. Wi‑Fi без швов накрывает дом и участок, на нём держатся все системы.', s: [11, 12] },
      { l: 'Закат', t: 'Уличный свет включился по закату и сам приглушился. Номер дома всегда виден. В комнатах свет идёт за присутствием.', s: [6, 5] },
      { l: 'Ночь', t: 'Калитка узнаёт лицо, камеры отличают человека от машины, охрана выведена на пульт ГБР. Спать можно спокойно.', s: [7, 8, 13] },
      { l: 'Зима', t: 'Метеостанция чувствует снег и включает подогрев кровли, дорожек и водостоков ровно по осадкам. Котёл подстраивается под погоду.', s: [10, 9, 14] }
    ];
    const NAMES = { 1: 'Электромонтаж и сантехника', 2: 'Вентиляция и зоны', 3: 'Тёплый пол', 4: 'Шторы', 5: 'Свет в доме', 6: 'Уличный свет', 7: 'Контроль доступа', 8: 'Видеонаблюдение', 9: 'Подогрев дорожек', 10: 'Подогрев кровли и водостоков', 11: 'Полив', 12: 'Wi‑Fi', 13: 'Сигнализация', 14: 'Отопление' };
    const ORDER = STAGES.flatMap(s => s.s);

    const T = $('#clockT'), Lb = $('#clockL'), X = $('#dayTxt'), chips = $('#dayChips'), cnt = $('#cnt'), ticksBox = $('#ticks'), stBtns = $$('#stages button');
    const ticks = ORDER.map(() => { const i = document.createElement('i'); ticksBox.append(i); return i; });
    let curStage = -1, pT = 0, pC = 0, visible = false;

    const setStage = (k, instant) => {
      if (k === curStage) return; curStage = k;
      const apply = () => {
        const s = STAGES[k]; Lb.textContent = s.l; X.textContent = s.t;
        chips.textContent = ''; s.s.forEach((id, n) => { const li = document.createElement('li'); li.textContent = NAMES[id]; li.style.animationDelay = (n * 70) + 'ms'; chips.append(li); });
        const n = STAGES.slice(0, k + 1).reduce((a, b) => a + b.s.length, 0);
        cnt.textContent = n; ticks.forEach((t, i) => t.classList.toggle('on', i < n));
        stBtns.forEach((b, i) => b.classList.toggle('on', i === k));
      };
      if (instant || reduce) { apply(); return; }
      X.classList.add('swap'); chips.classList.add('swap');
      setTimeout(() => { apply(); X.classList.remove('swap'); chips.classList.remove('swap'); }, 220);
    };

    const paint = (p, time) => {
      const t = p * 5, st = Math.min(4, Math.floor(t));
      setStage(st);
      // часы
      if (t < 4) { const mins = Math.round(pwl(t, [[0, 380], [.5, 400], [1.5, 780], [2.5, 1100], [3.5, 1470], [4, 1560]])) % 1440; T.textContent = String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0'); }
      else T.textContent = '07:50';
      // небо, трава, тень
      const pos = clamp(t - .5, 0, 4), i0 = Math.min(3, Math.floor(pos)), f = ss(0, 1, pos - i0);
      const k = pos - i0 >= 0 ? f : 0;
      el.skyA.setAttribute('stop-color', mix(SKY[i0][0], SKY[i0 + 1][0], k)); el.skyB.setAttribute('stop-color', mix(SKY[i0][1], SKY[i0 + 1][1], k));
      const lawn = mix(LAWN[i0], LAWN[i0 + 1], k); el.lawn.setAttribute('fill', lawn); el.hills.setAttribute('fill', mix(lawn, mix(SKY[i0][1], SKY[i0 + 1][1], k), .35));
      el.shade.setAttribute('opacity', (SHADE[i0] + (SHADE[i0 + 1] - SHADE[i0]) * k).toFixed(3));
      // светила
      const u = clamp(t / 2.9), sunO = (1 - ss(2.3, 2.9, t));
      el.sun.setAttribute('transform', `translate(${80 + u * 740} ${330 - Math.sin(Math.PI * u) * 250})`); el.sun.setAttribute('opacity', sunO.toFixed(2));
      const v = clamp((t - 2.5) / 1.6);
      el.moon.setAttribute('transform', `translate(${120 + v * 660} ${300 - Math.sin(Math.PI * v) * 190})`); el.moon.setAttribute('opacity', (ss(2.5, 2.9, t) * (1 - ss(3.7, 4.1, t))).toFixed(2));
      el.clouds.setAttribute('opacity', (.14 + .86 * ss(3.7, 4.3, t)).toFixed(2));
      // шторы и окна
      const cl = pwl(t, [[0, 1], [.1, 1], [.9, .1], [2.8, .1], [3.25, 1], [4, 1], [4.5, .1]]);
      const I = pwl(t, [[0, .5], [.4, .6], [.9, 0], [1.9, 0], [2.4, 1], [3.3, 1], [3.7, .35], [4.2, .35], [4.6, 0]]);
      curt.forEach(c => { c.style.transform = `scaleY(${cl.toFixed(3)})`; });
      glass.forEach(gl => gl.setAttribute('fill', mix('#cfe3ee', '#ffd28a', I)));
      wglow.forEach(w => w.setAttribute('opacity', (I * .85).toFixed(2)));
      // улица
      const O = pwl(t, [[0, .55], [.5, 0], [1.9, 0], [2.45, 1], [3.3, .55], [4, .55], [4.4, 0]]);
      el.lamps.setAttribute('opacity', O.toFixed(2));
      el.plaque.setAttribute('fill', O > .3 ? '#7a3f10' : '#14181b');
      // тёплый пол, вентиляция
      const FH = Math.max(bump(t, -.1, 0, .9, 1.3), ss(4.1, 4.6, t));
      el.floorHeat.setAttribute('opacity', FH.toFixed(2)); el.vent.setAttribute('opacity', bump(t, -.1, 0, .9, 1.3).toFixed(2));
      // полив и wifi
      el.spr.setAttribute('opacity', bump(t, .9, 1.2, 1.9, 2.2).toFixed(2)); el.wifi.setAttribute('opacity', bump(t, .95, 1.3, 1.8, 2.15).toFixed(2));
      // доступ
      const AC = bump(t, 2.95, 3.2, 3.9, 4.1), open = ss(3.4, 3.7, t) * (1 - ss(3.9, 4.1, t)), sc = 1 - .8 * open;
      el.face.setAttribute('opacity', AC.toFixed(2));
      el.gl.setAttribute('transform', `translate(70 0) scale(${sc.toFixed(3)} 1) translate(-70 0)`); el.gr.setAttribute('transform', `translate(130 0) scale(${sc.toFixed(3)} 1) translate(-130 0)`);
      const ok = ss(3.45, 3.6, t) * (1 - ss(3.9, 4, t)); el.okDot.setAttribute('opacity', ok.toFixed(2)); el.okTick.setAttribute('opacity', ok.toFixed(2));
      el.scan.setAttribute('y1', (360 + (Math.sin(time * 3.2) + 1) * 20).toFixed(1)); el.scan.setAttribute('y2', (360 + (Math.sin(time * 3.2) + 1) * 20).toFixed(1));
      el.cams.setAttribute('opacity', bump(t, 2.95, 3.2, 3.9, 4.1).toFixed(2)); el.gbr.setAttribute('opacity', bump(t, 3.15, 3.4, 3.9, 4.1).toFixed(2));
      // зима
      const SN = ss(3.8, 4.2, t), roofSnow = SN * (1 - ss(4.3, 4.85, t)), driveSnow = SN * (1 - ss(4.35, 4.9, t));
      el.snow.setAttribute('opacity', SN.toFixed(2)); el.roofSnow.setAttribute('opacity', roofSnow.toFixed(2)); el.icicles.setAttribute('opacity', roofSnow.toFixed(2));
      el.driveSnow.setAttribute('opacity', driveSnow.toFixed(2));
      el.roofHeat.setAttribute('opacity', ss(4.2, 4.4, t).toFixed(2)); el.driveHeat.setAttribute('opacity', ss(4.3, 4.5, t).toFixed(2));
      const BO = ss(4.1, 4.35, t); el.flame.setAttribute('opacity', BO.toFixed(2)); el.smoke.setAttribute('opacity', (BO * .8).toFixed(2));
      el.ws.setAttribute('opacity', (SN * (.55 + .45 * Math.sin(time * 4))).toFixed(2));
    };

    const total = () => sec.offsetHeight - innerHeight;
    const readP = () => { const r = sec.getBoundingClientRect(); return clamp(-r.top / Math.max(1, total())); };
    const goStage = s => {
      const target = (s + .5) / 5;
      if (sec.classList.contains('is-static')) { pT = pC = target; paint(pC, 0); return; }
      const top = scrollY + sec.getBoundingClientRect().top + target * total();
      scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    };
    stBtns.forEach((b, i) => b.addEventListener('click', () => goStage(i)));

    if (reduce) { sec.classList.add('is-static'); pT = pC = .1; paint(pC, 0); setStage(0, true); return; }

    let last = 0;
    const loop = time => {
      const dt = Math.min(.12, (time - last) / 1000 || .016); last = time;
      if (visible) { pT = readP(); pC += (pT - pC) * (1 - Math.exp(-dt * 9)); if (Math.abs(pT - pC) < .0004) pC = pT; paint(pC, time / 1000); }
      requestAnimationFrame(loop);
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; }), { rootMargin: '200px 0px' }).observe(sec); else visible = true;
    setStage(0, true); paint(0, 0);
    requestAnimationFrame(loop);
  });

  /* шаги: линия «включается» */
  safe(() => {
    const tl = $('#tl'); if (!tl) return;
    const lis = $$('li', tl), fill = document.createElement('i'); fill.className = 'tl__fill'; tl.append(fill);
    const upd = () => {
      const r = tl.getBoundingClientRect(), h = innerHeight;
      const line = h * .6; // линия «питания» на 60% высоты экрана
      const len = clamp(line - r.top - 8, 0, r.height - 16);
      fill.style.height = len + 'px';
      lis.forEach(li => { const b = li.getBoundingClientRect(); li.classList.toggle('on', b.top + 14 < line); });
    };
    if (reduce) { fill.style.height = 'calc(100% - 16px)'; lis.forEach(l => l.classList.add('on')); return; }
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  });

  /* маска телефона и отправка формы в Worker */
  $$('input[type="tel"]').forEach(input => {
    input.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7')) v = '7' + v;
      v = v.slice(0, 11);
      let out = '+7';
      if (v.length > 1) out += ' (' + v.slice(1, 4);
      if (v.length >= 4) out += ') ' + v.slice(4, 7);
      if (v.length >= 7) out += '-' + v.slice(7, 9);
      if (v.length >= 9) out += '-' + v.slice(9, 11);
      e.target.value = out;
    });
  });
  const form = $('#leadForm');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    const payload = {};
    new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || !payload.phone || payload.phone.replace(/\D/g, '').length < 11) {
      btn.textContent = 'Укажите имя и телефон'; setTimeout(() => { btn.textContent = orig; }, 2500); return;
    }
    btn.disabled = true; btn.textContent = 'Отправляем...';
    try {
      const resp = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.textContent = 'Заявка отправлена, скоро перезвоним'; form.reset();
    } catch (err) { console.error(err); btn.textContent = 'Ошибка, попробуйте ещё раз'; }
    finally { setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3500); }
  });
})();
