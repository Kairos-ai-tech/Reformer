(function () {
  var q = new URLSearchParams(location.search);
  var raw = q.get('lang') || 'zh';
  var lang = raw === 'zh' ? 'zh' : 'en';
  var root = document.documentElement;
  if (q.get('embed') === '1') root.classList.add('embed');
  root.setAttribute('lang', lang === 'zh' ? 'zh-Hant' : 'en');

  var BACK = { zh: '../../', en: '../../en/', ja: '../../ja/', ko: '../../ko/' };
  var T = {
    zh: {
      back: '← 返回優時科技',
      badge: '示範',
      msg: '這是虛構企業的示範網站,資料皆為範例。',
      sent: '已收到(示範):這個表單不會寄出任何資料。',
    },
    en: {
      back: '← Back to Kairos.ai',
      badge: 'DEMO',
      msg: 'A demo site for a fictional company. All content is sample data.',
      sent: 'Received (demo): this form does not send any data.',
    },
  };

  function applyText() {
    root.setAttribute('lang', lang === 'zh' ? 'zh-Hant' : 'en');
    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (el.dataset.zh === undefined) el.dataset.zh = el.innerHTML;
      el.innerHTML = lang === 'zh' ? el.dataset.zh : el.getAttribute('data-en');
    });
    document.querySelectorAll('[data-en-ph]').forEach(function (el) {
      if (el.dataset.zhPh === undefined) el.dataset.zhPh = el.getAttribute('placeholder') || '';
      el.setAttribute(
        'placeholder',
        lang === 'zh' ? el.dataset.zhPh : el.getAttribute('data-en-ph'),
      );
    });
    document.querySelectorAll('[data-en-label]').forEach(function (el) {
      if (el.dataset.zhLabel === undefined)
        el.dataset.zhLabel = el.getAttribute('aria-label') || '';
      el.setAttribute(
        'aria-label',
        lang === 'zh' ? el.dataset.zhLabel : el.getAttribute('data-en-label'),
      );
    });
    var bar = document.querySelector('.demo-bar');
    if (bar) {
      bar.querySelector('.back').textContent = T[lang].back;
      bar.querySelector('.back').setAttribute('href', BACK[raw] || BACK.zh);
      bar.querySelector('.badge').textContent = T[lang].badge;
      bar.querySelector('.msg').textContent = T[lang].msg;
      bar.querySelectorAll('.lang button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.l === lang));
      });
    }
    var cur = document.querySelector('[data-page].on');
    setTitle(cur);
    document.dispatchEvent(new CustomEvent('demolang', { detail: lang }));
  }
  function setTitle(pg) {
    var base = document.documentElement.getAttribute('data-site-' + lang) || '';
    var t = pg && (lang === 'zh' ? pg.dataset.title : pg.dataset.titleEn);
    document.title = (t ? t + ' | ' : '') + base;
  }

  function buildBar() {
    var bar = document.createElement('div');
    bar.className = 'demo-bar';
    bar.innerHTML =
      '<a class="back" href="#"></a><span class="badge"></span><span class="msg"></span><span class="lang"><button type="button" data-l="zh">中文</button><button type="button" data-l="en">EN</button></span>';
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add('has-bar');
    bar.querySelectorAll('.lang button').forEach(function (b) {
      b.addEventListener('click', function () {
        lang = b.dataset.l;
        var u = new URL(location.href);
        u.searchParams.set('lang', lang);
        history.replaceState(null, '', u);
        applyText();
      });
    });
  }

  var io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          function (es) {
            es.forEach(function (e) {
              if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target);
              }
            });
          },
          { threshold: 0.12 },
        )
      : null;
  function observe(scope) {
    scope.querySelectorAll('.rv:not(.in)').forEach(function (el) {
      io ? io.observe(el) : el.classList.add('in');
    });
    scope.querySelectorAll('[data-count]').forEach(function (el) {
      if (el.dataset.done) return;
      var to = +el.dataset.count,
        dec = +(el.dataset.dec || 0),
        t0 = null,
        sfx = el.dataset.sfx || '';
      var seen = function () {
        el.dataset.done = '1';
        if (matchMedia('(prefers-reduced-motion:reduce)').matches) {
          el.textContent = to.toFixed(dec) + sfx;
          return;
        }
        var step = function (t) {
          if (t0 === null) t0 = t;
          var p = Math.min(1, (t - t0) / 1400),
            v = to * (1 - Math.pow(1 - p, 3));
          el.textContent = v.toFixed(dec) + sfx;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };
      if (io) {
        var o = new IntersectionObserver(
          function (es) {
            if (es[0].isIntersecting) {
              o.disconnect();
              seen();
            }
          },
          { threshold: 0.4 },
        );
        o.observe(el);
      } else seen();
    });
  }

  function route() {
    var pages = document.querySelectorAll('[data-page]');
    var name = location.hash.replace(/^#\/?/, '') || pages[0].dataset.page;
    var found = false;
    pages.forEach(function (p) {
      if (p.dataset.page === name) found = true;
    });
    if (!found) name = pages[0].dataset.page;
    var cur = null;
    pages.forEach(function (p) {
      var on = p.dataset.page === name;
      p.classList.toggle('on', on);
      if (on) cur = p;
    });
    document.querySelectorAll('[data-go]').forEach(function (a) {
      var on = a.dataset.go === name;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.body.classList.remove('menu-open');
    window.scrollTo(0, 0);
    setTitle(cur);
    observe(cur);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-go]');
    if (!a) return;
    e.preventDefault();
    var h = '#/' + a.dataset.go;
    if (location.hash === h) route();
    else location.hash = h;
  });
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('form[data-demo]');
    if (!f) return;
    e.preventDefault();
    var s = f.querySelector('.form-status');
    if (s) s.textContent = T[lang].sent;
  });
  window.addEventListener('hashchange', route);

  function boot() {
    buildBar();
    applyText();
    route();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.DemoLang = function () {
    return lang;
  };
})();
