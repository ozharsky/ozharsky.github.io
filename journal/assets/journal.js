/* Illustrated Journal — site behaviour.
   Everything here is an enhancement: the page reads and works with scripting
   off, so nothing meaningful starts hidden or empty. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Reveal on scroll ───────────────────────────────────────────────── */
  // Only arm the reveal styles once we know we can un-arm them again.
  if (!reduced && 'IntersectionObserver' in window) {
    root.classList.add('js');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal, .stagger').forEach(function (el) {
      io.observe(el);
    });
  }

  /* ── Scroll progress, for browsers without animation-timeline ───────── */
  var bar = document.querySelector('.progress');
  if (bar && !reduced && !CSS.supports('animation-timeline', 'scroll()')) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var max = document.body.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Hero demo: an entry, and what the phone makes of it ────────────── */
  var demo = document.querySelector('[data-demo]');
  if (demo) (function () {
    var entries;
    try { entries = JSON.parse(document.getElementById('demo-entries').textContent); }
    catch (e) { return; }

    var elTitle = demo.querySelector('.demo-title');
    var elBody  = demo.querySelector('.demo-body');
    var elMood  = demo.querySelector('.demo-mood');
    var elDate  = demo.querySelector('.demo-date');
    var elArt   = demo.querySelector('.demo-art');
    var elImg   = demo.querySelector('.demo-art img');
    var elStyle = demo.querySelector('.demo-pending .s');
    var dots    = demo.parentNode.querySelectorAll('.demo-dots i');

    var i = -1, typer = null, timer = null;

    // Illustrations are dropped in later as img/art/01.png … 08.png. Probe for
    // one rather than assuming: a missing file leaves the app's own empty state
    // in place instead of a broken image.
    function showArt(entry) {
      elArt.classList.remove('has-art');
      elImg.classList.remove('shown');
      elImg.removeAttribute('src');
      var probe = new Image();
      probe.onload = function () {
        if (entries[i] !== entry) return;   // moved on while loading
        elImg.src = probe.src;
        elImg.classList.add('shown');
        elArt.classList.add('has-art');
      };
      probe.src = entry.art;
    }

    function type(text, done) {
      clearInterval(typer);
      if (reduced) { elBody.textContent = text; done(); return; }
      var n = 0;
      elBody.textContent = '';
      demo.classList.add('typing');
      typer = setInterval(function () {
        // A few characters per tick — one at a time is too slow to finish
        // before anyone's patience does.
        n = Math.min(n + 3, text.length);
        elBody.textContent = text.slice(0, n);
        if (n >= text.length) {
          clearInterval(typer);
          demo.classList.remove('typing');
          done();
        }
      }, 24);
    }

    function show(n) {
      i = (n + entries.length) % entries.length;
      var e = entries[i];

      demo.style.setProperty('--m', e.color);
      elArt.style.setProperty('--m', e.color);
      elTitle.textContent = e.title;
      elMood.textContent = e.mood;
      elDate.textContent = e.date;
      elStyle.textContent = e.style;
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });

      elArt.classList.remove('has-art');
      elImg.classList.remove('shown');

      type(e.body, function () {
        demo.classList.add('working');
        setTimeout(function () {
          demo.classList.remove('working');
          showArt(e);
        }, reduced ? 0 : 900);
      });
    }

    function advance(step) {
      clearTimeout(timer);
      show(i + step);
      timer = setTimeout(function () { advance(1); }, 9000);
    }

    demo.addEventListener('click', function () { advance(1); });
    demo.addEventListener('keydown', function (ev) {
      // role="button" has to answer Enter and Space; the arrows are a bonus.
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'ArrowRight') {
        ev.preventDefault(); advance(1);
      }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); advance(-1); }
    });

    // Don't type to an empty room.
    var running = true;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { clearTimeout(timer); clearInterval(typer); running = false; }
      else if (!running) { running = true; advance(1); }
    });

    advance(1);
  })();

  /* ── Style swatches ─────────────────────────────────────────────────── */
  var swatches = document.querySelectorAll('[data-style]');
  if (swatches.length) {
    var out = document.querySelector('[data-style-out]');
    var setStyle = function (btn) {
      swatches.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      out.querySelector('.h').textContent = btn.dataset.style;
      out.querySelector('p').textContent = btn.dataset.copy;
    };
    swatches.forEach(function (b) {
      b.addEventListener('click', function () { setStyle(b); });
    });
  }

  /* ── Mood year ──────────────────────────────────────────────────────── */
  var year = document.querySelector('[data-year]');
  if (year) (function () {
    var out = document.querySelector('[data-year-out]');
    var moods = [
      ['Grateful', '#D98324'], ['Happy', '#E0A500'], ['Reflective', '#7A5AD8'],
      ['Calm', '#2E8B9E'], ['Excited', '#D6437B'], ['Neutral', '#7B8190']
    ];
    var start = new Date();
    start.setDate(start.getDate() - 363);
    var frag = document.createDocumentFragment();

    for (var d = 0; d < 364; d++) {
      var day = new Date(start);
      day.setDate(start.getDate() + d);
      var cell = document.createElement('i');
      // A fixed pseudo-random pattern: the same year every visit, so this reads
      // as one person's year rather than noise that reshuffles on reload.
      var h = (d * 2654435761) % 4294967296;
      var filled = (h % 100) > 26;
      if (filled) {
        var m = moods[h % moods.length];
        cell.dataset.m = m[0];
        cell.style.setProperty('--dm', m[1]);
        cell.dataset.label = day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' — ' + m[0];
      } else {
        cell.dataset.label = day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' — nothing written';
      }
      frag.appendChild(cell);
    }
    year.appendChild(frag);

    year.addEventListener('pointerover', function (ev) {
      if (ev.target.tagName === 'I') out.textContent = ev.target.dataset.label;
    });
    year.addEventListener('pointerleave', function () {
      out.textContent = 'An example year. Hover a day.';
    });
  })();

})();
