/* =========================================================================
   Anamika Yadav — Portfolio
   Interaction layer.

   Contents
     1. Utilities                6. Case-study dialog
     2. Theme                    7. Image lightbox
     3. Navigation & scroll      8. Contact form
     4. Reveal & counters        9. Misc (copy email, back to top)
     5. Work grid
   ========================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     1. Utilities
     --------------------------------------------------------------------- */
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Elements that can receive keyboard focus, for focus trapping. */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function trapFocus(container, event) {
    var nodes = $$(FOCUSABLE, container).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
    if (!nodes.length) return;
    var first = nodes[0];
    var last  = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }

  /* --- Scroll lock -------------------------------------------------------
     Multiple overlays can be open, so lock/unlock is reference counted and
     the scrollbar width is compensated to stop the page from shifting. */
  var lockCount = 0;
  function lockScroll() {
    if (lockCount++ > 0) return;
    var sbw = window.innerWidth - document.documentElement.clientWidth;
    if (sbw > 0) document.body.style.paddingRight = sbw + 'px';
    document.body.classList.add('no-scroll');
  }
  function unlockScroll() {
    if (--lockCount > 0) return;
    lockCount = 0;
    document.body.classList.remove('no-scroll');
    document.body.style.paddingRight = '';
  }

  /* --- Toasts ----------------------------------------------------------- */
  var toastStack = $('#toastStack');
  function toast(message, kind) {
    if (!toastStack) return;
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || 'success');
    el.innerHTML = '<span class="dot" aria-hidden="true"></span><span></span>';
    el.lastElementChild.textContent = message;
    toastStack.appendChild(el);
    void el.offsetWidth;
    el.classList.add('show');
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 320);
    }, 3800);
  }

  /* ---------------------------------------------------------------------
     2. Theme
     The initial theme is applied by an inline script in <head> so there is
     no flash; this only wires up the toggles.
     --------------------------------------------------------------------- */
  (function initTheme() {
    var root = document.documentElement;

    function currentTheme() {
      return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    function applyTheme(theme) {
      if (theme === 'light') root.setAttribute('data-theme', 'light');
      else root.removeAttribute('data-theme');
      try { localStorage.setItem('theme', theme); } catch (e) {}

      var label = $('.theme-toggle-label');
      if (label) label.textContent = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';

      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'light' ? '#FAF8F3' : '#0A0A0B');
    }

    function toggleTheme() {
      applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
    }

    applyTheme(currentTheme());

    [$('#themeToggle'), $('#themeToggleMobile')].forEach(function (btn) {
      if (btn) btn.addEventListener('click', toggleTheme);
    });

    // Keyboard shortcut: "t" toggles the theme (ignored while typing).
    document.addEventListener('keydown', function (e) {
      if (e.key !== 't' && e.key !== 'T') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      toggleTheme();
    });
  })();

  /* ---------------------------------------------------------------------
     3. Navigation & scroll
     --------------------------------------------------------------------- */

  /* --- Mobile menu ------------------------------------------------------ */
  var menuToggle = $('#menuToggle');
  var mobileMenu = $('#mobileMenu');
  if (menuToggle && mobileMenu) {
    var setMenu = function (open) {
      mobileMenu.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      if (open) lockScroll(); else unlockScroll();
    };
    menuToggle.addEventListener('click', function () {
      setMenu(!mobileMenu.classList.contains('open'));
    });
    $$('a', mobileMenu).forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) setMenu(false);
    });
  }

  /* --- Scroll progress bar ---------------------------------------------- */
  var progressBar = $('#scrollProgress');
  var toTopBtn = $('#toTop');

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var ratio = max > 0 ? doc.scrollTop / max : 0;
    if (progressBar) progressBar.style.transform = 'scaleX(' + ratio + ')';
    if (toTopBtn) toTopBtn.classList.toggle('show', doc.scrollTop > 700);
  }

  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () { onScroll(); scrollTicking = false; });
  }, { passive: true });
  onScroll();

  if (toTopBtn) {
    toTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* --- Scroll spy: highlight the section you are reading ---------------- */
  (function initScrollSpy() {
    var sections = $$('main section[id]');
    if (!sections.length || !('IntersectionObserver' in window)) return;

    var links = {};
    $$('nav.primary-links a, .mobile-menu a').forEach(function (a) {
      var id = (a.getAttribute('href') || '').replace('#', '');
      if (!id) return;
      (links[id] = links[id] || []).push(a);
    });

    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });

      var bestId = null, bestRatio = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > bestRatio) { bestRatio = visible[id]; bestId = id; }
      });

      Object.keys(links).forEach(function (id) {
        links[id].forEach(function (a) { a.classList.toggle('active', id === bestId); });
      });
    }, { threshold: [0, 0.15, 0.4, 0.75], rootMargin: '-84px 0px -45% 0px' });

    sections.forEach(function (s) { spy.observe(s); });
  })();

  /* ---------------------------------------------------------------------
     4. Reveal animations & stat counters
     --------------------------------------------------------------------- */
  var io;

  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    // No observer support: show everything rather than hide it.
    io = { observe: function (el) { el.classList.add('is-visible'); }, unobserve: function () {} };
    $$('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Safety net. The reveal animation starts from opacity:0, so anything the
     observer misses would stay invisible — a blank page. This sweeps any
     element that has reached the viewport and reveals it unconditionally.
     Runs on load and on every (throttled) scroll, so content can never be
     stranded by a fast scroll, a restored background tab, or a throttled
     observer callback. */
  function revealSweep() {
    var limit = window.innerHeight * 1.1;
    $$('.reveal:not(.is-visible)').forEach(function (el) {
      if (el.getBoundingClientRect().top < limit) {
        el.classList.add('is-visible');
        if (io && io.unobserve) io.unobserve(el);
      }
    });
  }

  var sweepTicking = false;
  window.addEventListener('scroll', function () {
    if (sweepTicking) return;
    sweepTicking = true;
    requestAnimationFrame(function () { revealSweep(); sweepTicking = false; });
  }, { passive: true });

  window.addEventListener('load', revealSweep);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) revealSweep();
  });
  setTimeout(revealSweep, 1200);

  /* --- Count-up numbers -------------------------------------------------- */
  (function initCounters() {
    var cells = $$('.stat-cell .num[data-count]');
    if (!cells.length) return;

    function render(el, value) {
      var suffix = el.getAttribute('data-suffix');
      el.innerHTML = suffix ? value + '<sup>' + suffix + '</sup>' : String(value);
    }

    if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

    var counterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        counterIO.unobserve(el);

        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var duration = 1100;
        var started = null;

        (function step(now) {
          if (started === null) started = now;
          var t = Math.min((now - started) / duration, 1);
          // easeOutCubic
          var eased = 1 - Math.pow(1 - t, 3);
          render(el, Math.round(target * eased));
          if (t < 1) requestAnimationFrame(step);
          else render(el, target);
        })(performance.now());
      });
    }, { threshold: 0.6 });

    cells.forEach(function (el) {
      render(el, 0);
      counterIO.observe(el);
    });
  })();

  /* --- Hero spotlight ---------------------------------------------------- */
  (function initHeroSpotlight() {
    var heroDisplay = $('#heroDisplay');
    if (!heroDisplay || prefersReducedMotion) return;

    var lineWraps = $$('.line-wrap', heroDisplay);

    function update(clientX, clientY) {
      lineWraps.forEach(function (wrap) {
        var rect = wrap.getBoundingClientRect();
        wrap.style.setProperty('--mx', (clientX - rect.left) + 'px');
        wrap.style.setProperty('--my', (clientY - rect.top) + 'px');
      });
    }
    function reset() {
      lineWraps.forEach(function (wrap) {
        wrap.style.setProperty('--mx', '-9999px');
        wrap.style.setProperty('--my', '-9999px');
      });
    }

    heroDisplay.addEventListener('mousemove', function (e) { update(e.clientX, e.clientY); });
    heroDisplay.addEventListener('mouseleave', reset);
    heroDisplay.addEventListener('touchmove', function (e) {
      var t = e.touches[0];
      if (t) update(t.clientX, t.clientY);
    }, { passive: true });
  })();

  /* --- Collapsibles ------------------------------------------------------ */
  function setupCollapsible(toggleId, collapsibleId, openLabel, closeLabel) {
    var toggle = document.getElementById(toggleId);
    var collapsible = document.getElementById(collapsibleId);
    if (!toggle || !collapsible) return;
    var label = $('span', toggle);
    toggle.addEventListener('click', function () {
      var isOpen = collapsible.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (label) label.textContent = isOpen ? closeLabel : openLabel;
      if (isOpen) $$('.reveal', collapsible).forEach(function (el) { io.observe(el); });
    });
  }
  setupCollapsible('processToggle', 'processCollapsible', 'View My Design Process', 'Hide Design Process');

  (function initSkillsToggle() {
    var toggle = $('#skillsToggle');
    var grid = $('.skills-grid');
    if (!toggle || !grid) return;
    var label = $('span', toggle);
    toggle.addEventListener('click', function () {
      var isOpen = grid.classList.toggle('details-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (label) label.textContent = isOpen ? 'Hide Full Details' : 'View Full Details';
    });
  })();

  /* ---------------------------------------------------------------------
     5. Work grid
     --------------------------------------------------------------------- */
  var projects = window.PROJECTS || [];
  var grid = $('#projectGrid');

  /** `eager` is used inside the dialog, where the cover is the hero image. */
  function coverPicture(p, eager) {
    return '<picture>' +
             '<source srcset="' + p.cover.webp + '" type="image/webp">' +
             '<img src="' + p.cover.jpg + '" alt="' + p.cover.alt + '"' +
                  ' loading="' + (eager ? 'eager' : 'lazy') + '" decoding="async"' +
                  ' style="width:100%; height:100%; object-fit:cover;">' +
           '</picture>';
  }

  if (grid && projects.length) {
    projects.forEach(function (p, i) {
      var item = document.createElement('article');
      item.className = 'work-item reveal';
      item.id = 'project-' + p.id;
      item.innerHTML =
        '<div class="work-visual" data-open role="button" tabindex="0"' +
             ' aria-label="Open the ' + p.title + ' case study">' +
          '<span class="status-pill' + (p.status === 'Internship' ? ' is-internship' : '') + '">' + p.status + '</span>' +
          coverPicture(p) +
        '</div>' +
        '<div class="work-meta">' +
          '<div class="work-idx">' +
            '<span class="n">' + String(i + 1).padStart(2, '0') + '</span>' +
            '<span class="y">' + p.year + '</span>' +
          '</div>' +
          '<div class="work-tagrow">' +
            p.tags.map(function (t) { return '<span class="work-tag">' + t + '</span>'; }).join('') +
          '</div>' +
          '<div class="work-text">' +
            '<h3 data-open>' + p.title + '</h3>' +
            '<p>' + p.summary + '</p>' +
            '<button class="work-cta" data-open>Read the case study' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
                '<path d="M7 17L17 7M7 7h10v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
              '</svg>' +
            '</button>' +
          '</div>' +
        '</div>';

      $$('[data-open]', item).forEach(function (el) {
        el.addEventListener('click', function () { openProject(p.id); });
        el.addEventListener('keydown', function (e) {
          if (el.tagName === 'DIV' && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            openProject(p.id);
          }
        });
      });

      grid.appendChild(item);
      io.observe(item);
    });
  }

  /* ---------------------------------------------------------------------
     6. Case-study dialog
     Deep-linkable via #case/<id>, focus-trapped, Esc to close.
     --------------------------------------------------------------------- */
  var backdrop  = $('#pdBackdrop');
  var pdCover   = $('#pdCover');
  var pdEyebrow = $('#pdEyebrow');
  var pdTitle   = $('#pdTitle');
  var pdRole    = $('#pdRoleLine');
  var pdTabs    = $('#pdTabs');
  var pdPanels  = $('#pdPanels');
  var pdClose   = $('#pdClose');
  var pdPrev    = $('#pdPrev');
  var pdNext    = $('#pdNext');
  var pdBehance = $('#pdBehance');

  var openIndex = -1;
  var lastFocused = null;

  function indexOfProject(id) {
    for (var i = 0; i < projects.length; i++) if (projects[i].id === id) return i;
    return -1;
  }

  /** Strips markup for use in an id: "Problem &amp; Research" -> "ProblemResearch". */
  function panelId(key) {
    return 'panel-' + key.replace(/&amp;|&[a-z]+;|\s|\W/g, '');
  }

  function selectTab(tabs, panels, index) {
    tabs.forEach(function (t, i) {
      var on = i === index;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
      t.setAttribute('tabindex', on ? '0' : '-1');
    });
    panels.forEach(function (pn, i) { pn.classList.toggle('active', i === index); });
  }

  function renderProject(p) {
    pdCover.innerHTML = coverPicture(p, true);

    pdEyebrow.innerHTML =
      p.tags.map(function (t) { return '<span class="work-tag">' + t + '</span>'; }).join('') +
      '<span>' + p.year + '</span>';

    pdTitle.textContent = p.title;
    pdRole.innerHTML = p.role;

    pdTabs.innerHTML = '';
    pdPanels.innerHTML = '';

    var keys = Object.keys(p.sections);
    var tabEls = [];
    var panelEls = [];

    keys.forEach(function (key, i) {
      var id = panelId(key);

      var tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'pd-tab' + (i === 0 ? ' active' : '');
      tab.innerHTML = key;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(i === 0));
      tab.setAttribute('aria-controls', id);
      tab.setAttribute('tabindex', i === 0 ? '0' : '-1');
      tab.addEventListener('click', function () { selectTab(tabEls, panelEls, i); });
      tab.addEventListener('keydown', function (e) {
        var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var next = (i + dir + keys.length) % keys.length;
        selectTab(tabEls, panelEls, next);
        tabEls[next].focus();
      });
      pdTabs.appendChild(tab);
      tabEls.push(tab);

      var panel = document.createElement('div');
      panel.className = 'pd-panel' + (i === 0 ? ' active' : '');
      panel.id = id;
      panel.setAttribute('role', 'tabpanel');
      panel.innerHTML = '<h4>' + key + '</h4>' + p.sections[key];
      pdPanels.appendChild(panel);
      panelEls.push(panel);
    });

    // A single section needs neither a tab bar nor a repeated heading.
    pdTabs.hidden = keys.length < 2;
    $('#projectDetail').classList.toggle('single-section', keys.length < 2);

    if (p.behance) {
      pdBehance.href = p.behance;
      pdBehance.hidden = false;
    } else {
      pdBehance.hidden = true;
    }

    pdPrev.disabled = openIndex <= 0;
    pdNext.disabled = openIndex >= projects.length - 1;
  }

  function openProject(id, options) {
    var i = indexOfProject(id);
    if (i === -1 || !backdrop) return;

    var isFirstOpen = openIndex === -1;
    openIndex = i;

    if (isFirstOpen) {
      lastFocused = document.activeElement;
      backdrop.hidden = false;
      lockScroll();
      // Force a reflow so the transition has a start value to animate from.
      // (A rAF would be throttled in a background tab and never fire.)
      void backdrop.offsetWidth;
      backdrop.classList.add('open');
    }

    renderProject(projects[i]);
    backdrop.scrollTop = 0;

    if (!options || options.updateHash !== false) {
      history.replaceState(null, '', '#case/' + projects[i].id);
    }
    if (isFirstOpen) setTimeout(function () { pdClose.focus(); }, 60);
  }

  function closeProject() {
    if (!backdrop || openIndex === -1) return;
    openIndex = -1;
    backdrop.classList.remove('open');
    unlockScroll();

    if ((location.hash || '').indexOf('#case/') === 0) {
      history.replaceState(null, '', location.pathname + location.search);
    }

    setTimeout(function () {
      backdrop.hidden = true;
      pdCover.innerHTML = '';
      pdPanels.innerHTML = '';
      pdTabs.innerHTML = '';
    }, 320);

    if (lastFocused && lastFocused.focus) lastFocused.focus();
    lastFocused = null;
  }

  function step(delta) {
    var next = openIndex + delta;
    if (next < 0 || next >= projects.length) return;
    openIndex = next;
    renderProject(projects[next]);
    history.replaceState(null, '', '#case/' + projects[next].id);
    backdrop.scrollTop = 0;
  }

  if (backdrop) {
    pdClose.addEventListener('click', closeProject);
    pdPrev.addEventListener('click', function () { step(-1); });
    pdNext.addEventListener('click', function () { step(1); });

    // Click on the backdrop (but not the card) closes.
    backdrop.addEventListener('mousedown', function (e) {
      if (e.target === backdrop) closeProject();
    });

    document.addEventListener('keydown', function (e) {
      if (openIndex === -1) return;
      if (e.key === 'Escape') { closeProject(); return; }
      if (e.key === 'Tab') { trapFocus(backdrop, e); return; }
      // Arrow keys move between projects unless a tab has focus.
      if (document.activeElement && document.activeElement.classList.contains('pd-tab')) return;
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });

    /* Deep links: /#case/<id> opens that case study, and editing the hash or
       using back/forward keeps the dialog in sync with the URL. */
    function syncFromHash(delay) {
      var m = /^#case\/(.+)$/.exec(location.hash || '');
      var id = m && m[1];

      if (!id || indexOfProject(id) === -1) {
        if (openIndex !== -1) closeProject();
        return;
      }
      if (openIndex !== -1 && projects[openIndex].id === id) return;

      if (openIndex !== -1) {
        openIndex = indexOfProject(id);
        renderProject(projects[openIndex]);
        backdrop.scrollTop = 0;
      } else {
        setTimeout(function () { openProject(id, { updateHash: false }); }, delay || 0);
      }
    }

    window.addEventListener('hashchange', function () { syncFromHash(0); });
    syncFromHash(200);
  }

  /* ---------------------------------------------------------------------
     7. Image lightbox
     --------------------------------------------------------------------- */
  (function initLightbox() {
    var box = $('#lightbox');
    if (!box) return;
    var img = $('#lightboxImg');
    var caption = $('#lightboxCaption');
    var closeBtn = $('#lightboxClose');
    var lastLightboxFocus = null;

    function open(src, alt, cap) {
      lastLightboxFocus = document.activeElement;
      img.src = src;
      img.alt = alt || '';
      caption.textContent = cap || '';
      caption.style.display = cap ? '' : 'none';
      box.hidden = false;
      lockScroll();
      void box.offsetWidth;
      box.classList.add('open');
      setTimeout(function () { closeBtn.focus(); }, 60);
    }

    function close() {
      if (box.hidden) return;
      box.classList.remove('open');
      unlockScroll();
      setTimeout(function () { box.hidden = true; img.removeAttribute('src'); }, 320);
      if (lastLightboxFocus && lastLightboxFocus.focus) lastLightboxFocus.focus();
      lastLightboxFocus = null;
    }

    $$('[data-lightbox]').forEach(function (el) {
      el.addEventListener('click', function () {
        open(el.getAttribute('data-lightbox'), el.alt, el.getAttribute('data-caption'));
      });
    });

    closeBtn.addEventListener('click', close);
    box.addEventListener('mousedown', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'Tab') trapFocus(box, e);
    });
  })();

  /* ---------------------------------------------------------------------
     8. Contact form
     Posts to /api/contact. If the API is unreachable or not configured,
     falls back to opening the visitor's mail client with the message
     pre-filled so nothing is ever lost.
     --------------------------------------------------------------------- */
  (function initContactForm() {
    var form = $('#contactForm');
    if (!form) return;

    var submit = $('#cfSubmit');
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function fieldOf(input) { return input.closest('.field'); }

    function validate(input) {
      var value = input.value.trim();
      var ok;
      if (input.name === 'email') ok = EMAIL_RE.test(value);
      else if (input.name === 'message') ok = value.length >= 10;
      else ok = value.length > 0;
      fieldOf(input).classList.toggle('invalid', !ok);
      return ok;
    }

    ['name', 'email', 'message'].forEach(function (n) {
      var input = form.elements[n];
      input.addEventListener('blur', function () { if (input.value.trim()) validate(input); });
      input.addEventListener('input', function () {
        if (fieldOf(input).classList.contains('invalid')) validate(input);
      });
    });

    function mailtoFallback(data) {
      var subject = 'Portfolio enquiry from ' + data.name;
      var body = data.message + '\n\n— ' + data.name + ' (' + data.email + ')';
      window.location.href = 'mailto:anamikaya0908@gmail.com' +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot: bots fill hidden fields, humans do not.
      if (form.elements.company.value) return;

      var fields = ['name', 'email', 'message'].map(function (n) { return form.elements[n]; });
      var valid = fields.map(validate).every(Boolean);
      if (!valid) {
        var firstBad = fields.find(function (f) { return fieldOf(f).classList.contains('invalid'); });
        if (firstBad) firstBad.focus();
        return;
      }

      var data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        message: form.elements.message.value.trim()
      };

      submit.disabled = true;
      submit.textContent = 'Sending…';

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            return { ok: res.ok, status: res.status, body: body };
          });
        })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            toast('Thanks — your message is on its way.', 'success');
            return;
          }
          // 501 = the mail provider isn't configured yet on the server.
          if (res.status === 501) {
            toast('Opening your email app instead…', 'error');
            mailtoFallback(data);
            return;
          }
          toast((res.body && res.body.error) || 'Something went wrong. Please try email.', 'error');
        })
        .catch(function () {
          toast('Network issue — opening your email app instead…', 'error');
          mailtoFallback(data);
        })
        .finally(function () {
          submit.disabled = false;
          submit.textContent = 'Send message';
        });
    });
  })();

  /* ---------------------------------------------------------------------
     9. Misc
     --------------------------------------------------------------------- */
  (function initCopyEmail() {
    var btn = $('#copyEmail');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var email = btn.getAttribute('data-email');
      var done = function () { toast('Email address copied to clipboard.', 'success'); };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done).catch(function () {
          window.location.href = 'mailto:' + email;
        });
      } else {
        window.location.href = 'mailto:' + email;
      }
    });
  })();

})();
