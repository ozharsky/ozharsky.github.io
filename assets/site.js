/* Mossy — shared behaviour. Small on purpose: the page must read fine
   with scripting off, so nothing here is load-bearing for content. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // Scroll progress, for browsers without animation-timeline.
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

  // Tap demo: pressing the stake plays the ripple and reveals the phone,
  // which is the whole product in one gesture.
  var demo = document.querySelector('[data-tapdemo]');
  if (demo) {
    var fire = function () {
      demo.classList.remove('tapped');
      void demo.offsetWidth;          // restart the animation
      demo.classList.add('tapped');
    };
    demo.addEventListener('click', fire);
    demo.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }
    });
  }
})();
