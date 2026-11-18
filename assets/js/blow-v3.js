/* Blow V3 — product-first: live engraving studio in the hero, in-page film, gallery lightbox, cart */
(function () {
  'use strict';
  var root = document.getElementById('eh3');
  if (!root) return;
  var $ = function (s, c) { return (c || root).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); };
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* content (static preview only) */
  var C = window.EH_CONTENT || {};
  if (window.EH_CONTENT) $$('[data-k]').forEach(function (el) { var k = el.getAttribute('data-k'); if (C[k] != null) el.innerHTML = C[k]; });
  var t = function (k, fb) { var el = $('[data-k="' + k + '"]'); return el ? el.textContent.trim() : (C[k] || fb || ''); };
  root.classList.add('js');

  /* fade-up */
  var rv = $$('.v3-rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('is-in'); });

  /* toast */
  var toastEl = document.getElementById('v3Toast'), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3200);
  }
  window.EH_toast = toast;

  /* ---------- studio (hero) ---------- */
  var form = document.getElementById('v3Form');
  var prod = document.getElementById('v3Prod');
  var input = document.getElementById('v3Text');
  var count = document.getElementById('v3Count');
  var finName = document.getElementById('v3FinName');
  var err = document.getElementById('v3Err');
  var eng = prod ? $('[data-eng]', prod) : null;
  var MAX = input ? parseInt(input.getAttribute('maxlength'), 10) || 20 : 20;
  function chars(s) { return Array.from ? Array.from(s).length : s.length; }
  function clip(s) { return Array.from ? Array.from(s).slice(0, MAX).join('') : s.slice(0, MAX); }
  function fit() {
    if (!eng) return;
    var face = eng.parentElement, size = 4.2, g = 0;
    eng.style.setProperty('--es', size + 'cqw');
    while (eng.scrollWidth > face.clientWidth * .94 && size > 1 && g++ < 60) { size -= .12; eng.style.setProperty('--es', size + 'cqw'); }
  }
  function current() {
    var f = form.querySelector('input[name="properties[Font]"]:checked');
    var fin = form.querySelector('input[name="properties[Finish]"]:checked');
    return {
      text: input.value.trim(),
      font: f ? f.getAttribute('data-font') : 'script',
      fontValue: f ? f.value : '',
      finish: fin ? fin.getAttribute('data-finish') : 'silver',
      finishValue: fin ? fin.value : '',
      finishLabel: fin ? fin.getAttribute('data-label') : ''
    };
  }
  var lastShown = null;
  function render() {
    if (!form || !eng) return;
    var s = current();
    var shown = s.text || input.getAttribute('data-default') || '';
    eng.textContent = shown;
    eng.className = 'v3-eng f-' + s.font;
    prod.setAttribute('data-finish', s.finish);
    $$('[data-finish-img]', prod).forEach(function (img) {
      var on = img.getAttribute('data-finish-img') === s.finish;
      if (on && img.loading === 'lazy') img.loading = 'eager';
      img.classList.toggle('is-on', on);
    });
    if (finName) { var lab = $('[data-k="finish_' + s.finish + '"]'); finName.textContent = lab ? lab.textContent : s.finishLabel; }
    var n = chars(input.value);
    count.textContent = n + '/' + MAX;
    count.classList.toggle('is-max', n >= MAX);
    if (err && s.text) err.hidden = true;
    fit();
    if (document.fonts && document.fonts.load) document.fonts.load('40px ' + getComputedStyle(eng).fontFamily, shown).then(fit, fit);
    lastShown = shown;
  }
  if (form && input && prod) {
    input.addEventListener('input', function () { if (chars(input.value) > MAX) input.value = clip(input.value); render(); });
    $$('[data-symbol]', form).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = input.value, add = (v && !/\s$/.test(v) ? ' ' : '') + b.getAttribute('data-symbol');
        if (chars(v + add) <= MAX) input.value = v + add;
        input.focus(); render();
      });
    });
    $$('input[type=radio]', form).forEach(function (r) {
      r.addEventListener('change', function () {
        if (!reduce) { eng.classList.add('is-swap'); setTimeout(function () { eng.classList.remove('is-swap'); }, 160); }
        render();
      });
    });
    window.addEventListener('resize', fit);
    if (window.ResizeObserver) new ResizeObserver(fit).observe(prod);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
    render();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = current();
      if (!s.text) {
        if (err) err.hidden = false;
        var box = $('.v3-inbox'); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
        if ((window.scrollY || 0) > 200) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        input.focus({ preventScroll: true });
        return;
      }
      var props = { 'Engraving Text': s.text, 'Font': s.fontValue, 'Finish': s.finishValue };
      window.EH_LAST_CART = props;
      if (form.getAttribute('data-shopify') === '1') {
        var map = {}; try { map = JSON.parse(form.getAttribute('data-variants') || '{}'); } catch (x) { /* ignore */ }
        var idIn = form.querySelector('input[name="id"]');
        if (idIn && map[s.finish]) idIn.value = map[s.finish];
        var btn = document.getElementById('v3Add'); if (btn) btn.disabled = true;
        var body = { items: [{ id: Number(idIn.value), quantity: 1, properties: props }] };
        window.EH_LAST_POST = body;
        fetch((window.Shopify && Shopify.routes ? Shopify.routes.root : '/') + 'cart/add.js', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body)
        }).then(function (r) { if (!r.ok) throw r; return r.json(); })
          .then(function () { toast(t('added', 'נוסף לסל ✓')); setTimeout(function () { location.href = form.getAttribute('data-cart-url') || '/cart'; }, 700); })
          .catch(function () { form.submit(); })
          .then(function () { if (btn) btn.disabled = false; });
      } else {
        toast(t('added', 'נוסף לסל ✓') + ' — ' + s.text);
        try { console.info('[preview] line item properties', props); } catch (x) { /* ignore */ }
      }
    });
  }
  window.EH_render = render;

  /* ---------- film: muted autoplay in view, one play button, play/pause + mute ---------- */
  var player = document.getElementById('v3Player');
  var vid = document.getElementById('v3Video');
  if (player && vid) {
    window.EH_video = vid;
    var userPaused = false;
    var sync = function () {
      player.classList.toggle('is-playing', !vid.paused);
      player.classList.toggle('is-unmuted', !vid.muted);
      if (!vid.paused) player.classList.add('is-started');
    };
    var play = function () { var p = vid.play(); if (p && p.catch) p.catch(sync); };
    ['play', 'pause', 'volumechange', 'playing'].forEach(function (ev) { vid.addEventListener(ev, sync); });
    document.getElementById('v3Play').addEventListener('click', function () { userPaused = false; if (!player.classList.contains('is-started')) vid.muted = false; play(); });
    document.getElementById('v3Toggle').addEventListener('click', function () { if (vid.paused) { userPaused = false; play(); } else { userPaused = true; vid.pause(); } });
    document.getElementById('v3Mute').addEventListener('click', function () { vid.muted = !vid.muted; if (vid.paused) { userPaused = false; play(); } });
    vid.addEventListener('click', function () { if (vid.paused) { userPaused = false; play(); } else { userPaused = true; vid.pause(); } });
    var auto = root.getAttribute('data-autoplay') !== 'false';
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && e.intersectionRatio >= .5) { if (auto && !userPaused && vid.paused) { if (!player.classList.contains('is-started')) vid.muted = true; play(); } }
          else if (!vid.paused) vid.pause();
        });
      }, { threshold: [0, .5] }).observe(player);
    }
    sync();
  }

  /* ---------- gallery lightbox ---------- */
  var lb = document.getElementById('v3Lb');
  var tiles = $$('.v3-tile');
  var idx = 0;
  function openLb(i) {
    idx = (i + tiles.length) % tiles.length;
    var img = lb.querySelector('img'), tl = tiles[idx];
    img.src = tl.getAttribute('data-full'); img.alt = tl.getAttribute('data-cap') || '';
    lb.hidden = false; document.documentElement.style.overflow = 'hidden';
  }
  function closeLb() { lb.hidden = true; document.documentElement.style.overflow = ''; }
  if (lb && tiles.length) {
    tiles.forEach(function (tl, i) { tl.addEventListener('click', function () { openLb(i); }); });
    lb.querySelector('.v3-lb__x').addEventListener('click', closeLb);
    lb.querySelector('.v3-lb__prev').addEventListener('click', function (e) { e.stopPropagation(); openLb(idx - 1); });
    lb.querySelector('.v3-lb__next').addEventListener('click', function (e) { e.stopPropagation(); openLb(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') openLb(idx + 1);
      if (e.key === 'ArrowRight') openLb(idx - 1);
    });
    var x0 = 0;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) openLb(idx + (dx > 0 ? 1 : -1)); });
  }

  /* FAQ: one open at a time */
  $$('.v3-q').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) $$('.v3-q').forEach(function (o) { if (o !== d) o.open = false; }); });
  });

  /* final CTA → back to the studio */
  $$('[data-to-studio]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      setTimeout(function () { if (input) input.focus({ preventScroll: true }); }, reduce ? 0 : 600);
    });
  });
})();
