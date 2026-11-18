(function () {
  'use strict';
  const sites = window.SITES || [];
  const $ = (s, el = document) => el.querySelector(s);

  // Header
  const header = $('#header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const toggle = $('#menu-toggle');
  const nav = $('#nav');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  // Build grid
  const grid = $('#site-grid');
  const pad = (n) => String(n).padStart(2, '0');
  grid.innerHTML = sites.map((s) => `
    <button class="row reveal" type="button" role="listitem" data-site="${s.n}" data-region="${s.region}" aria-label="View ${s.name} details">
      <span class="row__num">${pad(s.n)}</span>
      <span class="row__main"><span class="row__name">${s.name}</span><span class="row__loc">${s.city} · ${s.area}</span></span>
      <span class="row__type">${s.type}</span>
      <span class="row__stat">${s.stats[0]}</span>
      <span class="row__go" aria-hidden="true">→</span>
    </button>`).join('');

  // Filters
  const chips = document.querySelectorAll('.chip');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => { const on = c === chip; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', String(on)); });
    grid.querySelectorAll('.row').forEach((card) => { card.hidden = f !== 'all' && card.dataset.region !== f; });
  }));

  // Site select in form
  const select = $('#site');
  sites.forEach((s) => select.insertAdjacentHTML('beforeend', `<option value="${s.name}">${pad(s.n)} · ${s.name}</option>`));

  // Modal
  const modal = $('#site-modal');
  const mapUrl = (s) => s.lat != null
    ? `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.query || s.name)}`;
  const openSite = (n) => {
    const s = sites.find((x) => x.n === Number(n));
    if (!s) return;
    $('#m-loc').textContent = `Site ${pad(s.n)} · ${s.city} · ${s.area}` + (s.lat != null ? ` · ${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}` : '');
    $('#m-title').textContent = s.name;
    $('#m-desc').textContent = s.desc;
    $('#m-stats').innerHTML = s.stats.map((t) => `<li>${t}</li>`).join('');
    $('#m-specs').innerHTML = s.specs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    $('#m-near').textContent = s.nearby;
    $('#m-map').href = mapUrl(s);
    $('#m-enquire').onclick = () => { select.value = s.name; modal.close(); };
    modal.showModal();
  };
  grid.addEventListener('click', (e) => { const card = e.target.closest('.row'); if (card) openSite(card.dataset.site); });
  document.querySelectorAll('[data-open]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); openSite(el.dataset.open); }));
  $('#m-close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

  // Reveal
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.reveal, .format, .sky__card, .about > *, .contact__grid > *, .chapter__text').forEach((el) => { el.classList.add('reveal'); io.observe(el); });

  // Form → email
  const form = $('#contact-form');
  const msg = $('#form-msg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name'), email = $('#email');
    let ok = true;
    [name, email].forEach((f) => { const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value)); f.setAttribute('aria-invalid', String(bad)); if (bad) ok = false; });
    if (!ok) { msg.textContent = 'Please add your name and a valid email address.'; return; }
    const lines = [
      'Name: ' + name.value.trim(),
      'Company: ' + $('#company').value.trim(),
      'Email: ' + email.value.trim(),
      'Site of interest: ' + (select.value || 'Any'),
      'Send Site Bible: ' + ($('#bible').checked ? 'Yes' : 'No'),
      '', $('#message').value.trim()
    ];
    const subject = encodeURIComponent('Website Enquiry from ' + name.value.trim());
    window.location.href = 'mailto:ryan@alands.media?subject=' + subject + '&body=' + encodeURIComponent(lines.join('\n'));
    msg.textContent = 'Your email app should open with the enquiry ready to send. If not, email ryan@alands.media.';
  });

  const skyBtn = $('#sky-enquire');
  if (skyBtn) skyBtn.addEventListener('click', () => { const m = $('#message'); if (!m.value.trim()) m.value = 'Sky activation enquiry: '; });

  document.querySelectorAll('[data-bible]').forEach((el) => el.addEventListener('click', () => {
    $('#bible').checked = true;
    const m = $('#message');
    if (!m.value.trim()) m.value = 'Please send me the latest AL&S Media Site Bible.';
    setTimeout(() => $('#name').focus({ preventScroll: true }), 600);
  }));

  $('#year').textContent = new Date().getFullYear();
})();
