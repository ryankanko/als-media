(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- split hero title into characters ---------- */
  $$('.hero__title .split').forEach((el, li) => {
    const text = el.textContent; el.textContent = '';
    el.setAttribute('aria-hidden', 'true');
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'char'; s.textContent = ch === ' ' ? '\u00a0' : ch;
      s.style.transitionDelay = (li * 0.18 + i * 0.035) + 's';
      el.appendChild(s);
    });
  });
  $('.hero__title').setAttribute('aria-label', 'Amplify your reach.');
  $$('.hero__lede, .hero__actions, .hero .eyebrow').forEach(e => e.classList.add('fade-up'));
  requestAnimationFrame(() => setTimeout(() => document.body.classList.add('is-ready'), 120));

  /* ---------- WebGL dusk shader ---------- */
  const FRAG = `
precision highp float;
uniform vec2 r; uniform float t; uniform vec2 m; uniform float mode;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.02;a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/r; vec2 p=(gl_FragCoord.xy-.5*r)/r.y;
 float y=uv.y;
 vec3 night=vec3(.035,.04,.075), plum=vec3(.33,.08,.24), ember=vec3(.98,.5,.2);
 float hz = mode>.5 ? .06 : .28;
 vec3 col=mix(ember,plum,smoothstep(hz-.12,hz+.22,y));
 col=mix(col,night,smoothstep(hz+.12,hz+.75,y));
 // drifting cloud bands
 float c=fbm(vec2(p.x*1.6+t*.018,p.y*4.2-t*.006));
 float band=smoothstep(.45,.9,c)*smoothstep(hz+.65,hz,y)*.55;
 col=mix(col,col*1.35+vec3(.18,.06,.08),band);
 // light trails (traffic glow) along the horizon
 float trail=0.;
 for(int i=0;i<3;i++){float fi=float(i);
  float yy=hz-.05+fi*.035; float sp=.06+fi*.03;
  float x=fract(uv.x*1.3-t*sp+fi*.37);
  trail+=exp(-pow((uv.y-yy)*90.,2.))*smoothstep(.0,.6,x)*smoothstep(1.,.6,x)*.35;}
 col+=trail*vec3(1.,.55,.25);
 // cursor light
 vec2 mm=(m-.5*r)/r.y; float d=length(p-mm);
 col+=vec3(1.,.55,.3)*.16*exp(-d*d*9.);
 // vignette + dither
 col*=1.-.55*length(uv-vec2(.5,.45));
 col+=(h(gl_FragCoord.xy+t)-.5)*.025;
 gl_FragColor=vec4(col,1.);
}`;
  function shader(canvas, mode) {
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) { canvas.style.background = 'linear-gradient(to top,#c45a2a,#3a1230 40%,#0a0b12)'; return; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}'));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr); gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const U = k => gl.getUniformLocation(pr, k);
    const ur = U('r'), ut = U('t'), um = U('m'), umode = U('mode');
    let w = 0, hgt = 0, mx = 0, my = 0, tx = 0, ty = 0, visible = true;
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    const size = () => { const rc = canvas.getBoundingClientRect(); w = canvas.width = Math.round(rc.width * dpr * .6); hgt = canvas.height = Math.round(rc.height * dpr * .6); gl.viewport(0, 0, w, hgt); tx = mx = w * .7; ty = my = hgt * .45; };
    size(); addEventListener('resize', size);
    canvas.parentElement.addEventListener('pointermove', e => { const rc = canvas.getBoundingClientRect(); tx = (e.clientX - rc.left) / rc.width * w; ty = (1 - (e.clientY - rc.top) / rc.height) * hgt; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !reduce) loop(performance.now()); }).observe(canvas);
    const draw = now => { mx += (tx - mx) * .06; my += (ty - my) * .06; gl.uniform2f(ur, w, hgt); gl.uniform1f(ut, now / 1000); gl.uniform2f(um, mx, my); gl.uniform1f(umode, mode); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
    let running = false;
    function loop(now) { if (running) return; running = true; const f = n => { if (!visible) { running = false; return; } draw(n); requestAnimationFrame(f); }; requestAnimationFrame(f); }
    draw(4000);
    if (!reduce) loop();
  }
  shader($('#sky-shader'), 0);
  shader($('#contact-shader'), 1);

  /* ---------- hero parallax ---------- */
  const city = $('.hero__city img');

  /* ---------- trivision billboard (3-sided rotating slats) ---------- */
  const tv = $('#trivision'), slatsEl = $('#slats'), heroEl = $('.hero'), cityBox = $('.hero__city');
  const BB = { x: 1702 / 2400, y: 366 / 1340, w: 405 / 2400, h: 465 / 1340, iw: 2400, ih: 1340 };
  const N = 11; let faces = [], face = 0, tvOn = true;
  function placeTV(scrollShift) {
    if (!tv || innerWidth <= 700) return;
    const hr = heroEl.getBoundingClientRect(), cr = cityBox.getBoundingClientRect();
    const cw = cr.width, ch = cr.height;
    const sc = Math.max(cw / BB.iw, ch / BB.ih), w = BB.iw * sc, h = BB.ih * sc;
    const pos = getComputedStyle(city).objectPosition.split(' ').map(v => parseFloat(v) / 100);
    const ox = (cw - w) * pos[0], oy = (ch - h) * pos[1];
    const k = 1.08, cx = cw / 2, cy = ch / 2;
    const tx = p => cx + (p - cx) * k, ty = p => cy + (p - cy) * k + (scrollShift || 0) * k;
    const x0 = tx(ox + BB.x * w), y0 = ty(oy + BB.y * h), x1 = tx(ox + (BB.x + BB.w) * w), y1 = ty(oy + (BB.y + BB.h) * h);
    const left = cr.left - hr.left + x0, top = cr.top - hr.top + y0;
    Object.assign(tv.style, { left: left + 'px', top: top + 'px', width: (x1 - x0) + 'px', height: (y1 - y0) + 'px' });
    const fw = x1 - x0, fh = y1 - y0, sw2 = fw / N, d = sw2 / (2 * Math.tan(Math.PI / 6)) * 0.5 / 0.5;
    $$('.slat', slatsEl).forEach((sl, i) => {
      $$('.slat__f', sl).forEach((f, j) => {
        f.style.transform = `rotateY(${j * 120}deg) translateZ(${sw2 / (2 * Math.sqrt(3))}px)`;
        f.style.backgroundSize = `${fw}px ${fh}px`; f.style.backgroundPosition = `${-i * sw2}px 0`;
      });
    });
    tv.classList.add('is-placed');
  }
  function paintFaces() {
    const W = 810, H = 930, mk = draw => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); draw(x); return c.toDataURL('image/jpeg', .9); };
    const disp = (x, size, wgt = 600) => x.font = `${wgt} ${size}px "Clash Display", "Satoshi", sans-serif`;
    faces = [
      mk(x => { const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#b0337c'); g.addColorStop(.55, '#d9566b'); g.addColorStop(1, '#f39a4a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        x.fillStyle = '#fff'; disp(x, 150); ['your', 'brand', 'here.'].forEach((t, i) => x.fillText(t, 70, 330 + i * 160)); }),
      mk(x => { x.fillStyle = '#0d0e17'; x.fillRect(0, 0, W, H); const g = x.createRadialGradient(W * .8, H * .15, 20, W * .8, H * .15, 700); g.addColorStop(0, 'rgba(232,135,62,.55)'); g.addColorStop(1, 'rgba(232,135,62,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        x.fillStyle = '#f2ede6'; disp(x, 132); x.fillText('Amplify', 70, 470); x.fillStyle = '#e8873e'; x.fillText('your reach.', 70, 610);
        disp(x, 58); x.fillStyle = '#f2ede6'; x.fillText('al', 70, 150); x.fillStyle = '#e8873e'; x.fillText('&', 70 + x.measureText('al').width, 150); x.fillStyle = '#f2ede6'; x.fillText('s media', 70 + x.measureText('al&').width, 150);
        x.font = '500 34px "Satoshi", sans-serif'; x.fillStyle = 'rgba(242,237,230,.7)'; x.fillText('alands.media', 70, 820); }),
      mk(x => { x.fillStyle = '#e8873e'; x.fillRect(0, 0, W, H); x.fillStyle = '#140b04'; disp(x, 150); ['Seen', 'by', 'millions.'].forEach((t, i) => x.fillText(t, 70, 340 + i * 160));
        x.font = '600 34px "Satoshi", sans-serif'; x.fillText('8.1M VEHICLES A MONTH · M1 SOUTH', 70, 840); })
    ];
    slatsEl.innerHTML = '';
    for (let i = 0; i < N; i++) { const sl = document.createElement('div'); sl.className = 'slat';
      for (let j = 0; j < 3; j++) { const f = document.createElement('div'); f.className = 'slat__f'; f.style.backgroundImage = `url(${faces[j]})`; sl.appendChild(f); }
      slatsEl.appendChild(sl); }
    placeTV(0);
  }
  function turn() {
    if (!tvOn || reduce) return; face++;
    $$('.slat', slatsEl).forEach((sl, i) => { sl.style.transitionDelay = (i * 0.07) + 's'; sl.style.transform = `rotateY(${-face * 120}deg)`; });
    setTimeout(() => { tv.classList.remove('is-shine'); void tv.offsetWidth; tv.classList.add('is-shine'); }, 900 + N * 70);
  }
  if (tv) {
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      paintFaces();
      // lights warm on: flicker then steady
      const seq = [900, 1000, 1080, 1180, 1300]; seq.forEach((t, i) => setTimeout(() => tv.classList.toggle('is-lit', i % 2 === 0 || i === seq.length - 1), reduce ? 0 : t));
      setTimeout(() => tv.classList.add('is-lit'), reduce ? 0 : 1350);
      if (!reduce) setInterval(turn, 4200);
    });
    new IntersectionObserver(([e]) => tvOn = e.isIntersecting).observe(heroEl);
    addEventListener('resize', () => placeTV(scrollY * .12));
  }

  /* ---------- ASCII switch-on ---------- */
  const asc = $('#ascii'), photo = $('.switch__photo'), bar = $('#switch-bar'), sw = $('.switch');
  const actx = asc.getContext('2d'); const copyEl = $('.switch__copy');
  const RAMP = ' .,:;-=+*#%@';
  const src = new Image(); src.src = 'assets/story-highway-md.webp';
  const off = document.createElement('canvas'); const octx = off.getContext('2d', { willReadFrequently: true });
  let lastCell = 0, lum = null, cols = 0, rows = 0, aw = 0, ah = 0;
  function sample(cell) {
    const rc = asc.getBoundingClientRect(); aw = asc.width = rc.width; ah = asc.height = rc.height;
    cols = Math.ceil(aw / cell); rows = Math.ceil(ah / (cell * 1.25));
    off.width = cols; off.height = rows;
    // cover-fit
    const ir = src.width / src.height, cr = cols / (rows * 1.25);
    let sw2 = src.width, sh2 = src.height, sx = 0, sy = 0;
    if (ir > cr) { sw2 = src.height * cr; sx = (src.width - sw2) / 2; } else { sh2 = src.width / cr; sy = (src.height - sh2) / 2; }
    octx.drawImage(src, sx, sy, sw2, sh2, 0, 0, cols, rows);
    try { lum = octx.getImageData(0, 0, cols, rows).data; } catch (e) { lum = null; }
    lastCell = cell;
  }
  function renderAscii(p) {
    if (!src.complete || !src.width) return;
    const cell = Math.round(clamp(20 - p * 20, 8, 20));
    if (cell !== lastCell || asc.width !== Math.round(asc.getBoundingClientRect().width)) sample(cell);
    actx.fillStyle = '#0a0b12'; actx.fillRect(0, 0, aw, ah);
    if (!lum) return;
    actx.font = `600 ${cell}px "Satoshi", monospace`; actx.textBaseline = 'top';
    const lit = clamp((p - .15) / .45, 0, 1); // billboard "switches on"
    const flick = reduce ? 0 : (Math.sin(performance.now() / 70) > .7 ? .08 : 0);
    // keep the copy readable: dim glyphs behind the text block
    const cr0 = asc.getBoundingClientRect(), cb = copyEl.getBoundingClientRect(), padX = cell * 2, padY = cell * 2;
    const qx0 = cb.left - cr0.left - padX, qx1 = cb.right - cr0.left + padX, qy0 = cb.top - cr0.top - padY, qy1 = cb.bottom - cr0.top + padY;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4; const r = lum[i], g = lum[i + 1], b = lum[i + 2];
      const L = (r * .3 + g * .59 + b * .11) / 255;
      const ch = RAMP[Math.min(RAMP.length - 1, Math.floor(L * (RAMP.length)))];
      if (ch === ' ') continue;
      const warm = r > b + 30;
      let a = clamp(L * 1.4 + (warm ? lit * .6 : 0) - flick, .08, 1);
      const px = x * cell, py = y * cell * 1.25;
      if (px > qx0 && px < qx1 && py > qy0 && py < qy1) a *= .12;
      actx.fillStyle = warm ? `rgba(240,${140 + L * 60 | 0},70,${a})` : `rgba(200,190,210,${a * (.35 + lit * .4)})`;
      actx.fillText(ch, x * cell, y * cell * 1.25);
    }
  }
  src.onload = () => onScroll();

  /* ---------- stats counters ---------- */
  const counted = new WeakSet();
  const countIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting || counted.has(e.target)) return; counted.add(e.target);
    const el = e.target, to = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, suf = el.dataset.suffix || '';
    if (reduce) return; const t0 = performance.now();
    const step = n => { const k = clamp((n - t0) / 1600, 0, 1), v = to * (1 - Math.pow(1 - k, 4)); el.textContent = v.toFixed(dec) + suf; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: .6 });
  $$('[data-count]').forEach(e => countIO.observe(e));

  /* ---------- horizontal chapters + sky ---------- */
  const chapters = $('.chapters'), track = $('#track');
  const sky = $('.sky'), skyCards = $$('.sky__card'), skyItems = $$('#sky-list li');
  const desktop = () => innerWidth > 900;
  function progress(el) { const r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight), 0, 1); }
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = scrollY;
      if (city && !reduce) { city.style.transform = `scale(1.08) translateY(${y * .12}px)`; if (y < innerHeight) placeTV(y * .12); }
      // ascii
      const p = progress(sw);
      const r = sw.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) {
        renderAscii(p);
        photo.style.opacity = clamp((p - .55) / .3, 0, 1);
        asc.style.opacity = 1 - clamp((p - .7) / .25, 0, 1);
        bar.style.width = (p * 100) + '%';
      }
      // chapters
      if (desktop()) {
        const cp = progress(chapters);
        const max = track.scrollWidth - innerWidth;
        track.style.transform = `translate3d(${-cp * max}px,0,0)`;
        $$('.chapter__media img', track).forEach((im, i) => { im.style.transform = `scale(1.15) translateX(${(cp * 3 - i) * -4}%)`; });
        // sky
        const sp = progress(sky); const idx = Math.min(3, Math.floor(sp * 4));
        skyCards.forEach((c, i) => { c.classList.toggle('is-on', i === idx); c.classList.toggle('is-past', i < idx); });
        skyItems.forEach((li, i) => li.classList.toggle('is-on', i === idx));
      }
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { lastCell = 0; onScroll(); });
  onScroll();
  if (!reduce) setInterval(() => { const r = sw.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) renderAscii(progress(sw)); }, 140);

  /* ---------- portfolio glass carousel ---------- */
  const rail = $('#rail'), sites = window.SITES || [];
  const sel = $('#site-select');
  sites.forEach(s => {
    const b = document.createElement('button');
    b.className = 'gcard'; b.dataset.region = s.region; b.type = 'button';
    b.setAttribute('aria-label', `${s.name}, ${s.area}. ${s.type}. View details`);
    b.innerHTML = `<span class="gcard__n">${String(s.n).padStart(2, '0')}</span>
      <span><span class="gcard__type">${s.type}</span><h3>${s.name}</h3><span class="gcard__area">${s.area} · ${s.city}</span>
      <span class="gcard__stat">${(s.stats && s.stats[0]) || ''}</span></span>`;
    b.addEventListener('click', e => { if (rail.dataset.moved === '1') { e.preventDefault(); return; } openSheet(s); });
    if (fine && !reduce) {
      b.addEventListener('pointermove', e => { const rc = b.getBoundingClientRect(); const px = (e.clientX - rc.left) / rc.width, py = (e.clientY - rc.top) / rc.height;
        b.style.setProperty('--ry', ((px - .5) * 14) + 'deg'); b.style.setProperty('--rx', ((.5 - py) * 10) + 'deg'); b.style.setProperty('--s', 1.02);
        b.style.setProperty('--mx', (px * 100) + '%'); b.style.setProperty('--my', (py * 100) + '%'); });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--ry', '0deg'); b.style.setProperty('--rx', '0deg'); b.style.setProperty('--s', 1); });
    }
    rail.appendChild(b);
    const o = document.createElement('option'); o.value = s.name; o.textContent = `${s.name} (${s.area})`; sel.appendChild(o);
  });
  // drag to scroll with inertia
  let down = false, sx = 0, sl = 0, v = 0, lx = 0, raf = 0;
  rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; rail.dataset.moved = '0'; sx = lx = e.clientX; sl = rail.scrollLeft; v = 0; cancelAnimationFrame(raf); rail.classList.add('is-dragging'); });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 6) rail.dataset.moved = '1'; v = e.clientX - lx; lx = e.clientX; rail.scrollLeft = sl - dx; });
  addEventListener('pointerup', () => { if (!down) return; down = false; rail.classList.remove('is-dragging');
    const glide = () => { v *= .94; rail.scrollLeft -= v; if (Math.abs(v) > .4) raf = requestAnimationFrame(glide); }; if (!reduce) glide();
    setTimeout(() => rail.dataset.moved = '0', 50); });
  const page = () => Math.max(300, rail.clientWidth * .7);
  $('#prev').onclick = () => rail.scrollBy({ left: -page(), behavior: reduce ? 'auto' : 'smooth' });
  $('#next').onclick = () => rail.scrollBy({ left: page(), behavior: reduce ? 'auto' : 'smooth' });
  $$('.filter').forEach(f => f.onclick = () => {
    $$('.filter').forEach(x => { x.classList.toggle('is-on', x === f); x.setAttribute('aria-pressed', x === f); });
    $$('.gcard').forEach(c => c.hidden = !(f.dataset.f === 'all' || c.dataset.region === f.dataset.f));
    rail.scrollTo({ left: 0 });
  });

  /* ---------- site sheet ---------- */
  const sheet = $('#sheet');
  function openSheet(s) {
    $('#sheet-meta').textContent = `${String(s.n).padStart(2, '0')} · ${s.type} · ${s.area}, ${s.city}`;
    $('#sheet-title').textContent = s.name;
    $('#sheet-desc').textContent = s.desc || '';
    $('#sheet-stats').innerHTML = (s.stats || []).map(x => `<li>${x}</li>`).join('');
    $('#sheet-specs').innerHTML = (s.specs || []).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    $('#sheet-near').textContent = s.nearby || '';
    const map = $('#sheet-map');
    if (s.lat) { map.href = `https://www.google.com/maps?q=${s.lat},${s.lng}`; map.hidden = false; } else map.hidden = true;
    $('#sheet-enquire').onclick = () => { sheet.close(); sel.value = s.name; };
    sheet.showModal();
  }
  $('#sheet-x').onclick = () => sheet.close();
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });

  /* ---------- form prefill + mailto ---------- */
  const msg = $('#msg');
  $$('[data-bible]').forEach(a => a.addEventListener('click', () => { $('#bible').checked = true; if (!msg.value) msg.value = 'Please send me the latest Site Bible.'; }));
  $$('[data-sky]').forEach(a => a.addEventListener('click', () => { if (!msg.value) msg.value = "I'd like to plan a sky activation alongside a billboard campaign."; }));
  $('#form').addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(e.target);
    const body = `Name: ${f.get('name')}\nCompany: ${f.get('company')}\nEmail: ${f.get('email')}\nSite: ${f.get('site') || 'Any'}\nSite Bible: ${f.get('bible') ? 'Yes' : 'No'}\n\n${f.get('msg')}`;
    location.href = `mailto:ryan@alands.media?subject=${encodeURIComponent('Site enquiry - ' + (f.get('company') || f.get('name')))}&body=${encodeURIComponent(body)}`;
  });

  /* ---------- cursor + magnetic ---------- */
  if (fine && !reduce) {
    document.documentElement.classList.add('has-cursor');
    const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; dot.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; });
    (function f() { rx += (x - rx) * .16; ry += (y - ry) * .16; ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`; requestAnimationFrame(f); })();
    document.addEventListener('pointerover', e => { cur.classList.toggle('is-hover', !!e.target.closest('a,button:not(.gcard),input,select,textarea,label')); cur.classList.toggle('is-drag', !!e.target.closest('.glass-rail')); });
    $$('.magnetic').forEach(m => {
      m.addEventListener('pointermove', e => { const r = m.getBoundingClientRect(); m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
      m.addEventListener('pointerleave', () => m.style.transform = '');
    });
  }

  /* ---------- reveals ---------- */
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); } }), { threshold: .2 });
  $$('.portfolio__head, .stats, .contact__inner').forEach(e => { e.classList.add('reveal'); rio.observe(e); });
})();
