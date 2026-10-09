/* Motion layer for the product page.
   Lenis (smooth scroll) + GSAP/ScrollTrigger (reveals, hero intro, parallax, progress)
   + Vanta NET (hero background) + vanilla ports of React Bits effects
   (SpotlightCard, ShinyText, Magnet, BlurText-style hero entrance).
   Everything degrades gracefully: if a library fails to load or the visitor
   prefers reduced motion, the page falls back to the plain CSS behaviour. */
(function(){
  'use strict';
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;

  // Unhide the hero intro targets no matter what happens below.
  var lateLoad = root.classList.contains('motion-ready'); // safety timeout already fired
  function ready(){ root.classList.add('motion-ready'); }
  if(reduced || !gsap || !ST){ ready(); return; }

  gsap.registerPlugin(ST);
  ST.config({ignoreMobileResize:true});
  root.classList.add('gsap-on');

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if(window.Lenis){
    lenis = new window.Lenis({
      duration:1.1,
      easing:function(t){ return Math.min(1, 1.001 - Math.pow(2, -10*t)); },
      wheelMultiplier:1
    });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function(t){ lenis.raf(t*1000); });
    gsap.ticker.lagSmoothing(0);

    var header = document.getElementById('siteHeader');
    document.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if(!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var id = a.getAttribute('href');
      var target = null;
      if(id !== '#'){ try{ target = document.querySelector(id); }catch(_){ return; } }
      if(id !== '#' && !target) return;
      e.preventDefault();
      lenis.scrollTo(target || 0, {offset: target ? -((header ? header.offsetHeight : 0) + 8) : 0, duration:1.3});
      if(target && history.pushState){ try{ history.pushState(null, '', id); }catch(_){} }
    });
  }

  /* ---------- Scroll progress bar ---------- */
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  gsap.to(bar, {scaleX:1, ease:'none', scrollTrigger:{trigger:root, start:'top top', end:'bottom bottom', scrub:0.3}});

  /* ---------- Hero entrance (BlurText-style) ---------- */
  var hero = document.querySelector('.hero');
  if(hero && !lateLoad){
    var h = function(s){ return hero.querySelector(s); };
    var clear = 'opacity,visibility,transform,filter';
    var tl = gsap.timeline({defaults:{ease:'expo.out'}});
    tl.from(h('.trust-pill'), {autoAlpha:0, y:14, duration:.7, clearProps:clear})
      .from(h('h1'), {autoAlpha:0, y:34, filter:'blur(14px)', duration:1.1, clearProps:clear}, '-=.45')
      .from(h('.wrap > p'), {autoAlpha:0, y:22, duration:.9, clearProps:clear}, '-=.7')
      .from(h('.cta-row'), {autoAlpha:0, y:18, duration:.8, clearProps:clear}, '-=.65');
  }
  ready();
  if(hero){
    // Hero parallax: background layers drift slower than content.
    var heroST = {trigger:hero, start:'top top', end:'bottom top', scrub:true};
    gsap.to(hero.querySelector('.hero-network'), {yPercent:-14, ease:'none', scrollTrigger:heroST});
    gsap.to(hero.querySelector('.wrap'), {y:-36, autoAlpha:.25, ease:'none', scrollTrigger:heroST});
  }

  /* ---------- Scroll reveals (replaces the CSS-only reveal) ---------- */
  function done(el){
    gsap.set(el, {clearProps:'opacity,visibility,transform'});
    el.classList.add('gdone');
  }
  var reveals = gsap.utils.toArray('.reveal').filter(function(el){ return el !== hero; });
  gsap.set(reveals, {autoAlpha:0, y:34});
  ST.batch(reveals, {
    start:'top 90%', once:true, interval:.08, batchMax:4,
    onEnter:function(batch){
      gsap.to(batch, {autoAlpha:1, y:0, duration:.95, ease:'power3.out', stagger:.09, overwrite:true,
        onComplete:function(){ batch.forEach(function(el){ done(el); el.classList.add('in'); }); }});
    }
  });

  document.querySelectorAll('.reveal-stagger').forEach(function(box){
    var items = box.querySelectorAll('.r-item');
    gsap.set(items, {autoAlpha:0, y:26});
    ST.create({trigger:box, start:'top 88%', once:true, onEnter:function(){
      gsap.to(items, {autoAlpha:1, y:0, duration:.8, ease:'power3.out', stagger:.1, overwrite:true,
        onComplete:function(){ items.forEach(done); box.classList.add('in'); }});
    }});
  });

  /* ---------- React Bits ports ---------- */
  // ShinyText
  var pill = document.querySelector('.trust-pill');
  if(pill) pill.classList.add('shiny');

  // SpotlightCard: cursor-following glow
  if(finePointer){
    document.querySelectorAll('.card, .price').forEach(function(el){
      el.classList.add('spot');
      el.addEventListener('pointermove', function(e){
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, {passive:true});
    });

    // Magnet: primary hero buttons lean toward the cursor
    document.querySelectorAll('.hero .cta-row .btn').forEach(function(btn){
      btn.classList.add('magnet');
      var pad = 36, pull = .28;
      window.addEventListener('pointermove', function(e){
        var r = btn.getBoundingClientRect();
        var near = e.clientX > r.left - pad && e.clientX < r.right + pad &&
                   e.clientY > r.top - pad && e.clientY < r.bottom + pad;
        btn.style.translate = near
          ? ((e.clientX - (r.left + r.width/2)) * pull) + 'px ' + ((e.clientY - (r.top + r.height/2)) * pull) + 'px'
          : '';
      }, {passive:true});
      document.documentElement.addEventListener('pointerleave', function(){ btn.style.translate = ''; });
    });
  }

  /* ---------- Vanta NET hero background (desktop, lazy) ---------- */
  var conn = navigator.connection || {};
  var canGL = (function(){
    try{ var c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); }
    catch(_){ return false; }
  })();
  if(hero && canGL && !conn.saveData && window.matchMedia('(min-width:761px)').matches){
    var box = document.createElement('div');
    box.className = 'hero-vanta';
    box.setAttribute('aria-hidden', 'true');
    hero.insertBefore(box, hero.firstChild);

    var effect = null, inView = true, loaded = false, loading = false, stopTimer = 0, wasRetro = root.classList.contains('retro-mode');
    var wanted = function(){ return inView && !document.hidden && !root.classList.contains('retro-mode'); };
    var sync = function(){
      clearTimeout(stopTimer);
      if(wanted() && loaded && !effect){
        effect = window.VANTA.NET({
          el:box, mouseControls:true, touchControls:false, gyroControls:false,
          color:0x4c93e8, backgroundColor:0x080d18, backgroundAlpha:0,
          points:9, maxDistance:22, spacing:17, showDots:true
        });
        box.classList.add('on'); root.classList.add('vanta-on');
      } else if(!wanted() && effect){
        // Debounce so quick scrolls past the hero don't churn WebGL contexts.
        stopTimer = setTimeout(function(){
          if(wanted() || !effect) return;
          effect.destroy(); effect = null;
          box.classList.remove('on'); root.classList.remove('vanta-on');
        }, 1500);
      }
    };
    var load = function(src, cb){
      var s = document.createElement('script');
      s.src = src; s.onload = cb; s.onerror = function(){ loading = false; };
      document.head.appendChild(s);
    };
    var boot = function(){
      if(loading || loaded) return;
      loading = true;
      load('vendor/three.min.js', function(){
        load('vendor/vanta.net.min.js', function(){ loaded = true; loading = false; sync(); });
      });
    };
    new MutationObserver(function(){
      var r = root.classList.contains('retro-mode');
      if(r !== wasRetro){ wasRetro = r; sync(); }
    }).observe(root, {attributes:true, attributeFilter:['class']});
    document.addEventListener('visibilitychange', sync);
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ inView = es[0].isIntersecting; sync(); }).observe(hero);
    }
    var kick = function(){ (window.requestIdleCallback || function(f){ setTimeout(f, 400); })(boot, {timeout:2000}); };
    if(document.readyState === 'complete') kick(); else window.addEventListener('load', kick);
  }

  /* ---------- Keep triggers aligned when layout changes ---------- */
  window.addEventListener('load', function(){ ST.refresh(); });
  var lang = document.getElementById('langSelect');
  if(lang) lang.addEventListener('change', function(){ setTimeout(function(){ ST.refresh(); }, 150); });
})();
