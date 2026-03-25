/**
 * Siam Street — Thai Restaurant
 * main.js: Navigation, menu tabs, smooth scroll, form validation,
 *          scroll-reveal, back-to-top, and footer year.
 */

'use strict';

/* ── Utilities ────────────────────────────────────────────── */

/**
 * Safely query a DOM element, throw if required and not found.
 * @param {string} selector
 * @param {boolean} required
 * @returns {Element|null}
 */
function $(selector, required = false) {
  const el = document.querySelector(selector);
  if (required && !el) console.warn(`Element not found: ${selector}`);
  return el;
}

/** Query all matching elements as an array. */
function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}

/* ── Footer year ──────────────────────────────────────────── */
(function setFooterYear() {
  const el = $('#footer-year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ── Sticky header ────────────────────────────────────────── */
(function initStickyHeader() {
  const header = $('#site-header');
  if (!header) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 20);
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();

/* ── Mobile navigation toggle ─────────────────────────────── */
(function initMobileNav() {
  const toggle = $('#nav-toggle');
  const menu   = $('#nav-menu');
  if (!toggle || !menu) return;

  function openMenu() {
    menu.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close when a nav link is clicked (smooth-scroll to section)
  $$('.nav-link', menu).forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
  });

  // Close when clicking outside the nav
  document.addEventListener('click', e => {
    if (
      menu.classList.contains('open') &&
      !menu.contains(e.target) &&
      !toggle.contains(e.target)
    ) closeMenu();
  });
})();

/* ── Menu category tabs ───────────────────────────────────── */
(function initMenuTabs() {
  const tabs   = $$('.menu-tab');
  const panels = $$('.menu-panel');
  if (!tabs.length) return;

  function activateTab(tab) {
    const category = tab.dataset.category;

    // Update tab states
    tabs.forEach(t => {
      const active = t === tab;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', String(active));
    });

    // Show matching panel, hide others
    panels.forEach(panel => {
      const show = panel.id === `tab-${category}`;
      panel.classList.toggle('active', show);
      if (show) {
        // Stagger-animate cards on entry
        const cards = $$('.menu-card', panel);
        cards.forEach((card, i) => {
          card.style.opacity = '0';
          card.style.transform = 'translateY(16px)';
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              card.style.transition = `opacity 0.35s ease ${i * 60}ms, transform 0.35s ease ${i * 60}ms`;
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
          });
        });
      }
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab));

    // Keyboard: arrow key navigation between tabs
    tab.addEventListener('keydown', e => {
      const idx = tabs.indexOf(tab);
      let next = -1;
      if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
      if (e.key === 'ArrowLeft')  next = (idx - 1 + tabs.length) % tabs.length;
      if (next !== -1) {
        tabs[next].focus();
        activateTab(tabs[next]);
      }
    });
  });

  // Animate initial visible cards
  activateTab(tabs[0]);
})();

/* ── Smooth scroll for anchor links ──────────────────────────
   CSS scroll-behavior:smooth is already set but JS handles
   nav-height offset for fixed header.
──────────────────────────────────────────────────────────── */
(function initSmoothScroll() {
  const navHeight = () => {
    const h = $('#site-header');
    return h ? h.offsetHeight : 72;
  };

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    const top = target.getBoundingClientRect().top + window.scrollY - navHeight();
    window.scrollTo({ top, behavior: 'smooth' });

    // Update URL without triggering scroll
    history.pushState(null, '', `#${targetId}`);

    // Move focus to section for accessibility
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
})();

/* ── Scroll-reveal (Intersection Observer) ────────────────── */
(function initScrollReveal() {
  // Elements to animate
  const targets = [
    '.menu-card',
    '.about-value',
    '.gallery-item',
    '.contact-item',
    '.hours-row',
    '.section-header',
    '.hero-content',
  ];

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(sel => {
    $$(sel).forEach((el, i) => {
      el.classList.add('reveal');
      // Stagger sibling elements
      el.style.transitionDelay = `${Math.min(i * 60, 400)}ms`;
      observer.observe(el);
    });
  });
})();

/* ── Back to top button ───────────────────────────────────── */
(function initBackToTop() {
  const btn = $('#back-to-top');
  if (!btn) return;

  let ticking = false;

  function update() {
    const show = window.scrollY > 400;
    if (show) {
      btn.removeAttribute('hidden');
    } else {
      btn.setAttribute('hidden', '');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ── Reservation form validation ──────────────────────────── */
(function initReservationForm() {
  const form = $('#reservation-form');
  if (!form) return;

  const successMsg = $('#form-success');

  // Validation rules per field
  const rules = {
    'res-name': {
      validate: v => v.trim().length >= 2,
      message: 'Please enter your full name (at least 2 characters).',
    },
    'res-email': {
      validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message: 'Please enter a valid email address.',
    },
    'res-date': {
      validate: v => {
        if (!v) return false;
        const selected = new Date(v);
        const today    = new Date();
        today.setHours(0, 0, 0, 0);
        return selected >= today;
      },
      message: 'Please select a date today or in the future.',
    },
    'res-time': {
      validate: v => v !== '',
      message: 'Please select a reservation time.',
    },
    'res-guests': {
      validate: v => v !== '',
      message: 'Please select the number of guests.',
    },
  };

  /** Show error for a field. */
  function showError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}-error`);
    if (input) input.classList.add('error');
    if (error) error.textContent = message;
  }

  /** Clear error for a field. */
  function clearError(fieldId) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}-error`);
    if (input) input.classList.remove('error');
    if (error) error.textContent = '';
  }

  /** Validate a single field. Returns true if valid. */
  function validateField(fieldId) {
    const rule  = rules[fieldId];
    const input = document.getElementById(fieldId);
    if (!rule || !input) return true;

    if (!rule.validate(input.value)) {
      showError(fieldId, rule.message);
      return false;
    }
    clearError(fieldId);
    return true;
  }

  // Live validation on blur
  Object.keys(rules).forEach(fieldId => {
    const input = document.getElementById(fieldId);
    if (!input) return;
    input.addEventListener('blur', () => validateField(fieldId));
    input.addEventListener('input', () => {
      // Clear error as user types after first submit attempt
      if (input.classList.contains('error')) validateField(fieldId);
    });
  });

  // Set minimum date to today
  const dateInput = document.getElementById('res-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  // Form submit
  form.addEventListener('submit', e => {
    e.preventDefault();

    const allValid = Object.keys(rules).map(validateField).every(Boolean);
    if (!allValid) {
      // Focus first invalid field
      const firstError = form.querySelector('.error');
      if (firstError) firstError.focus();
      return;
    }

    // Simulate async submission
    const submitBtn = form.querySelector('.btn-submit');
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    setTimeout(() => {
      // Reset form and show success
      form.reset();
      submitBtn.textContent = 'Confirm Reservation';
      submitBtn.disabled = false;

      if (successMsg) {
        successMsg.removeAttribute('hidden');
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Auto-hide after 8 seconds
        setTimeout(() => successMsg.setAttribute('hidden', ''), 8000);
      }
    }, 1200);
  });
})();

/* ── Gallery: keyboard navigation & hover labels ──────────── */
(function initGallery() {
  const items = $$('.gallery-item');
  items.forEach(item => {
    const placeholder = item.querySelector('.gallery-placeholder');
    if (!placeholder) return;

    // Make focusable
    placeholder.setAttribute('tabindex', '0');
    placeholder.setAttribute('role', 'button');

    placeholder.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        placeholder.click();
      }
    });
  });
})();

/* ── Review panel ─────────────────────────────────────────────
   - Reviews stored in localStorage (persists across sessions)
   - Sorted: 5★ fully front (100% opacity), lower stars layered behind
   - CSV export button downloads all reviews
──────────────────────────────────────────────────────────── */
(function initReviewPanel() {
  const trigger    = $('#review-trigger');
  const panel      = $('#review-panel');
  const closeBtn   = $('#review-panel-close');
  const backdrop   = $('#review-backdrop');
  if (!trigger || !panel) return;

  const form         = $('#review-form');
  const ratingInput  = $('#review-rating');
  const starPicks    = $$('.star-pick');
  const reviewList   = $('#review-list');
  const countBadge   = $('.review-trigger-count');
  const successMsg   = $('#review-success');
  const overallScore = $('#review-overall-score');
  const overallCount = $('#review-overall-count');

  /* ─── Storage key ─── */
  const STORAGE_KEY = 'siamstreet_reviews';

  /* ─── Default reviews (pre-loaded on first visit) ─── */
  const DEFAULT_REVIEWS = [
    { author: 'Priya M.',   stars: 5, date: 'March 2025',    comment: 'The Pad Thai here is unlike anything I\'ve had outside Bangkok. The tamarind glaze is perfectly balanced — sweet, sour, just a little heat.' },
    { author: 'James K.',   stars: 5, date: 'February 2025', comment: 'That green curry changed my entire relationship with food. Rich, fragrant coconut milk with just the right amount of fire. I\'ve been back three times.' },
    { author: 'Aiko T.',    stars: 5, date: 'January 2025',  comment: 'Mango sticky rice for dessert — I dream about it still. The warm coconut cream poured table-side is a touch of magic.' },
    { author: 'Marcus B.',  stars: 5, date: 'March 2025',    comment: 'Suea Rong Hai is the best steak dish I\'ve had in the city. The dried chilli dipping sauce is just insane. Will be back.' },
    { author: 'Sofia R.',   stars: 4, date: 'February 2025', comment: 'Really enjoyed the Massaman curry — perfectly balanced spice and creaminess. Service was warm. Would love a larger dessert menu.' },
    { author: 'David C.',   stars: 3, date: 'January 2025',  comment: 'Food was good but the Pad See Ew felt a bit dry on our visit. Atmosphere is great though. Might give it another try.' },
  ];

  /* ─── Load / save ─── */
  function loadReviews() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_REVIEWS;
    } catch { return DEFAULT_REVIEWS; }
  }

  function saveReviews(reviews) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews)); } catch {}
  }

  /* ─── Layer assignment based on star rating ─── */
  function getLayer(stars) {
    if (stars === 5) return 0;
    if (stars === 4) return 1;
    if (stars === 3) return 2;
    return 3;
  }

  /* ─── XSS escape ─── */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ─── Build a single review card DOM element ─── */
  function buildCard(review) {
    const layer   = getLayer(review.stars);
    const filled  = '★'.repeat(review.stars);
    const empty   = '☆'.repeat(5 - review.stars);
    const initial = review.author.trim().charAt(0).toUpperCase();

    const card = document.createElement('article');
    card.className = 'review-card';
    card.dataset.layer = layer;
    card.setAttribute('aria-label', `Review by ${review.author}, ${review.stars} stars`);
    card.innerHTML = `
      <div class="review-card-top">
        <div class="review-avatar" aria-hidden="true">${initial}</div>
        <div>
          <strong class="review-name">${escapeHtml(review.author)}</strong>
          <span class="review-date">${escapeHtml(review.date)}</span>
        </div>
        <div class="review-stars" aria-label="${review.stars} stars">${filled}${empty}</div>
      </div>
      <p class="review-text">"${escapeHtml(review.comment)}"</p>
    `;
    return card;
  }

  /* ─── Render all reviews sorted by stars desc (5★ first = front) ─── */
  function renderReviews(reviews) {
    const sorted = [...reviews].sort((a, b) => b.stars - a.stars);
    reviewList.innerHTML = '';
    sorted.forEach(r => reviewList.appendChild(buildCard(r)));

    // Update overall score + count
    if (reviews.length && overallScore && overallCount) {
      const avg = (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1);
      overallScore.textContent = avg;
      overallCount.textContent = `Based on ${reviews.length} review${reviews.length !== 1 ? 's' : ''}`;
    }

    // Update trigger badge
    if (countBadge) {
      countBadge.textContent = reviews.length;
      countBadge.setAttribute('aria-label', `${reviews.length} reviews`);
    }
  }

  /* ─── Month/year helper ─── */
  function monthYear() {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  /* ─── CSV export ─── */
  function exportCSV(reviews) {
    const header = ['Name', 'Stars', 'Date', 'Comment'];
    const rows   = reviews
      .sort((a, b) => b.stars - a.stars)
      .map(r => [
        `"${r.author.replace(/"/g, '""')}"`,
        r.stars,
        `"${r.date}"`,
        `"${r.comment.replace(/"/g, '""')}"`
      ]);

    const csv  = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'siam-street-reviews.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ─── Initialise ─── */
  let reviews = loadReviews();
  renderReviews(reviews);

  /* ─── Panel open / close ─── */
  function openPanel() {
    panel.removeAttribute('hidden');
    backdrop.removeAttribute('hidden');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function closePanel() {
    panel.setAttribute('hidden', '');
    backdrop.setAttribute('hidden', '');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    trigger.focus();
  }

  trigger.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  backdrop.addEventListener('click', closePanel);
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hasAttribute('hidden')) closePanel();
  });

  /* ─── Star picker ─── */
  let selectedRating = 0;

  function paintStars(hovered) {
    const val = hovered || selectedRating;
    starPicks.forEach(s => s.classList.toggle('filled', Number(s.dataset.value) <= val));
  }

  starPicks.forEach(star => {
    star.addEventListener('mouseenter', () => paintStars(Number(star.dataset.value)));
    star.addEventListener('mouseleave', () => paintStars(0));
    star.addEventListener('click', () => {
      selectedRating     = Number(star.dataset.value);
      ratingInput.value  = selectedRating;
      starPicks.forEach(s => s.setAttribute('aria-checked', String(Number(s.dataset.value) === selectedRating)));
      paintStars(0);
    });
    star.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); star.click(); }
    });
  });

  /* ─── Form submit ─── */
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;

      const author     = document.getElementById('review-author');
      const comment    = document.getElementById('review-comment');
      const ratingErr  = document.getElementById('review-rating-error');
      const authorErr  = document.getElementById('review-author-error');
      const commentErr = document.getElementById('review-comment-error');

      [ratingErr, authorErr, commentErr].forEach(el => { if (el) el.textContent = ''; });
      [author, comment].forEach(el => { if (el) el.classList.remove('error'); });

      if (!selectedRating) { if (ratingErr) ratingErr.textContent = 'Please select a star rating.'; valid = false; }
      if (!author.value.trim())  { authorErr.textContent  = 'Please enter your name.';    author.classList.add('error');  valid = false; }
      if (!comment.value.trim()) { commentErr.textContent = 'Please write a comment.'; comment.classList.add('error'); valid = false; }
      if (!valid) return;

      // Add to array, save, re-render
      reviews.unshift({ author: author.value.trim(), stars: selectedRating, date: monthYear(), comment: comment.value.trim() });
      saveReviews(reviews);
      renderReviews(reviews);

      form.reset();
      selectedRating    = 0;
      ratingInput.value = '';
      paintStars(0);

      if (successMsg) {
        successMsg.removeAttribute('hidden');
        setTimeout(() => successMsg.setAttribute('hidden', ''), 4000);
      }
    });
  }
})();

/* ── Diet toggle — theme switch + menu filter ─────────────────
   "all"     → default orange theme, show all items
   "veg"     → green theme, show only veg items
   "non-veg" → red theme, show non-veg + egg items
──────────────────────────────────────────────────────────── */
(function initDietFilter() {
  const toggle = $('#diet-toggle');
  if (!toggle) return;

  const btns = $$('.diet-btn', toggle);

  /* ── 1. Decide card visibility ── */
  function isVisible(cardDiet, selected) {
    if (selected === 'all')     return true;
    if (selected === 'veg')     return cardDiet === 'veg';
    if (selected === 'non-veg') return cardDiet === 'non-veg' || cardDiet === 'egg';
    return true;
  }

  /* ── 2. Apply theme class to <body> ── */
  function applyTheme(selected) {
    document.body.classList.remove('theme-veg', 'theme-nonveg');
    if (selected === 'veg')     document.body.classList.add('theme-veg');
    if (selected === 'non-veg') document.body.classList.add('theme-nonveg');
  }

  /* ── 3. Filter menu cards + show/hide empty state ── */
  function applyFilter(selected) {
    $$('.menu-panel').forEach(panel => {
      const cards = $$('.menu-card[data-diet]', panel);
      let visible = 0;

      cards.forEach(card => {
        const show = isVisible(card.dataset.diet || 'non-veg', selected);
        card.classList.toggle('diet-hidden', !show);
        if (show) visible++;
      });

      const emptyEl = document.getElementById(`empty-${panel.id.replace('tab-', '')}`);
      if (emptyEl) emptyEl[visible === 0 ? 'removeAttribute' : 'setAttribute']('hidden', '');
    });
  }

  /* ── 4. Wire up buttons ── */
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const diet = btn.dataset.diet;

      btns.forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });

      applyTheme(diet);
      applyFilter(diet);
    });
  });
})();

/* ── Active nav highlight on scroll ──────────────────────────
   Highlights nav links based on which section is in view.
──────────────────────────────────────────────────────────── */
(function initActiveNavOnScroll() {
  const sections  = $$('main section[id]');
  const navLinks  = $$('.nav-link[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle(
              'nav-link--active',
              link.getAttribute('href') === `#${id}`
            );
          });
        }
      });
    },
    {
      rootMargin: `-${72}px 0px -60% 0px`,
      threshold: 0,
    }
  );

  sections.forEach(s => observer.observe(s));
})();

/* ══════════════════════════════════════════════════════════
   FOOD ORDERING SYSTEM
   ══════════════════════════════════════════════════════════ */

/* ── 1. Inject "Add to Order" buttons into menu cards ─────── */
document.addEventListener('DOMContentLoaded', function injectOrderButtons() {
  $$('.menu-card-body').forEach(function(body) {
    const nameEl  = body.querySelector('.menu-card-name');
    const priceEl = body.querySelector('.menu-card-price');
    // Emoji lives in the card image area, one level up from body
    const card    = body.closest('.menu-card');
    const emojiEl = card ? card.querySelector('.menu-card-emoji') : null;

    if (!nameEl || !priceEl) return;

    const name  = nameEl.textContent.trim();
    const price = parseFloat(priceEl.textContent.replace('$', '').trim()) || 0;
    const emoji = emojiEl ? emojiEl.textContent.trim() : '🍽️';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'add-to-order-btn';
    btn.textContent = '+ Add to Order';
    btn.setAttribute('aria-label', `Add ${name} to order`);

    btn.addEventListener('click', function() {
      cartAddItem({ name, emoji, price });
    });

    body.appendChild(btn);
  });
});

/* ── 2. Cart State ────────────────────────────────────────── */
var cartItems = []; // [{name, emoji, price, qty}]

function cartAddItem(item) {
  var existing = cartItems.find(function(i) { return i.name === item.name; });
  if (existing) {
    existing.qty += 1;
  } else {
    cartItems.push({ name: item.name, emoji: item.emoji, price: item.price, qty: 1 });
  }
  cartSync();
  cartDrawerOpen();
}

function cartRemoveItem(name) {
  cartItems = cartItems.filter(function(i) { return i.name !== name; });
  cartSync();
}

function cartChangeQty(name, delta) {
  var item = cartItems.find(function(i) { return i.name === name; });
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cartRemoveItem(name);
    return;
  }
  cartSync();
}

function cartGetTotal() {
  return cartItems.reduce(function(sum, i) { return sum + i.price * i.qty; }, 0);
}

function cartGetCount() {
  return cartItems.reduce(function(sum, i) { return sum + i.qty; }, 0);
}

/* ── 3. Cart Sync — update FAB badge + drawer contents ─────── */
function cartSync() {
  var fab   = document.getElementById('cart-fab');
  var badge = document.getElementById('cart-fab-badge');
  var count = cartGetCount();

  if (fab) {
    if (count > 0) {
      fab.removeAttribute('hidden');
    } else {
      fab.setAttribute('hidden', '');
    }
  }
  if (badge) badge.textContent = count;

  cartRenderItems();
  cartUpdateSubtotal();
}

function cartRenderItems() {
  var body = document.getElementById('cart-drawer-body');
  if (!body) return;
  body.innerHTML = '';

  if (cartItems.length === 0) {
    var msg = document.createElement('p');
    msg.className = 'cart-empty-msg';
    msg.textContent = 'Your cart is empty. Add some dishes!';
    body.appendChild(msg);
    return;
  }

  cartItems.forEach(function(item) {
    var row = document.createElement('div');
    row.className = 'cart-item';

    var emojiSpan = document.createElement('span');
    emojiSpan.className = 'cart-item-emoji';
    emojiSpan.setAttribute('aria-hidden', 'true');
    emojiSpan.textContent = item.emoji;

    var info = document.createElement('div');
    info.className = 'cart-item-info';
    var nameDiv = document.createElement('div');
    nameDiv.className = 'cart-item-name';
    nameDiv.textContent = item.name;
    var priceDiv = document.createElement('div');
    priceDiv.className = 'cart-item-price';
    priceDiv.textContent = '$' + (item.price * item.qty).toFixed(2);
    info.appendChild(nameDiv);
    info.appendChild(priceDiv);

    var controls = document.createElement('div');
    controls.className = 'cart-item-controls';

    var minusBtn = document.createElement('button');
    minusBtn.className = 'cart-qty-btn';
    minusBtn.textContent = '−';
    minusBtn.setAttribute('aria-label', 'Decrease quantity of ' + item.name);
    minusBtn.addEventListener('click', (function(n) {
      return function() { cartChangeQty(n, -1); };
    })(item.name));

    var qtySpan = document.createElement('span');
    qtySpan.className = 'cart-item-qty';
    qtySpan.textContent = item.qty;

    var plusBtn = document.createElement('button');
    plusBtn.className = 'cart-qty-btn';
    plusBtn.textContent = '+';
    plusBtn.setAttribute('aria-label', 'Increase quantity of ' + item.name);
    plusBtn.addEventListener('click', (function(n) {
      return function() { cartChangeQty(n, 1); };
    })(item.name));

    var removeBtn = document.createElement('button');
    removeBtn.className = 'cart-remove-btn';
    removeBtn.textContent = '✕';
    removeBtn.setAttribute('aria-label', 'Remove ' + item.name + ' from cart');
    removeBtn.addEventListener('click', (function(n) {
      return function() { cartRemoveItem(n); };
    })(item.name));

    controls.appendChild(minusBtn);
    controls.appendChild(qtySpan);
    controls.appendChild(plusBtn);
    controls.appendChild(removeBtn);

    row.appendChild(emojiSpan);
    row.appendChild(info);
    row.appendChild(controls);
    body.appendChild(row);
  });
}

function cartUpdateSubtotal() {
  var el = document.getElementById('cart-subtotal-amount');
  if (el) el.textContent = '$' + cartGetTotal().toFixed(2);
}

/* ── 4. Cart Drawer open / close ─────────────────────────── */
function cartDrawerOpen() {
  var drawer   = document.getElementById('cart-drawer');
  var backdrop = document.getElementById('cart-backdrop');
  if (!drawer) return;
  drawer.removeAttribute('hidden');
  backdrop.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  var closeBtn = document.getElementById('cart-drawer-close');
  if (closeBtn) closeBtn.focus();
}

function cartDrawerClose() {
  var drawer   = document.getElementById('cart-drawer');
  var backdrop = document.getElementById('cart-backdrop');
  if (!drawer) return;
  drawer.setAttribute('hidden', '');
  backdrop.setAttribute('hidden', '');
  document.body.style.overflow = '';
  var fab = document.getElementById('cart-fab');
  if (fab) fab.focus();
}

document.addEventListener('DOMContentLoaded', function initCart() {
  var fab      = document.getElementById('cart-fab');
  var closeBtn = document.getElementById('cart-drawer-close');
  var backdrop = document.getElementById('cart-backdrop');
  var placeBtn = document.getElementById('cart-place-order');

  if (fab)      fab.addEventListener('click', cartDrawerOpen);
  if (closeBtn) closeBtn.addEventListener('click', cartDrawerClose);
  if (backdrop) backdrop.addEventListener('click', cartDrawerClose);

  document.addEventListener('keydown', function(e) {
    var drawer = document.getElementById('cart-drawer');
    if (e.key === 'Escape' && drawer && !drawer.hasAttribute('hidden')) {
      cartDrawerClose();
    }
  });

  if (placeBtn) {
    placeBtn.addEventListener('click', function() {
      // Validate name
      var nameInput = document.getElementById('cart-customer-name');
      var nameError = document.getElementById('cart-name-error');
      if (!nameInput || !nameInput.value.trim()) {
        if (nameError) nameError.textContent = 'Please enter your name.';
        if (nameInput) nameInput.focus();
        return;
      }
      if (nameError) nameError.textContent = '';

      if (cartItems.length === 0) return;

      // Show confirmation modal
      orderConfirmShow(nameInput.value.trim(), cartItems.slice());

      // Reset cart
      cartItems = [];
      cartSync();
      cartDrawerClose();
      if (nameInput) nameInput.value = '';
    });
  }

  // Initial render
  cartSync();
});

/* ── 5. Order Confirmation Modal ─────────────────────────── */
function orderConfirmShow(customerName, items) {
  var overlay    = document.getElementById('order-confirm-overlay');
  var numEl      = document.getElementById('order-confirm-number');
  var listEl     = document.getElementById('order-confirm-list');
  if (!overlay) return;

  // Random 4-digit order number
  var orderNum = Math.floor(1000 + Math.random() * 9000);
  if (numEl) numEl.textContent = '#' + orderNum;

  // Build item list
  if (listEl) {
    listEl.innerHTML = '';
    items.forEach(function(item) {
      var li = document.createElement('li');
      li.innerHTML = '<span aria-hidden="true">' + item.emoji + '</span> ' +
        '<span>' + item.name + ' × ' + item.qty + '</span>' +
        '<span style="margin-left:auto;color:var(--clr-accent)">' +
        '$' + (item.price * item.qty).toFixed(2) + '</span>';
      listEl.appendChild(li);
    });
  }

  overlay.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';

  var playBtn  = document.getElementById('order-play-games');
  var laterBtn = document.getElementById('order-maybe-later');

  function closeConfirm() {
    overlay.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  if (playBtn) {
    playBtn.onclick = function() {
      closeConfirm();
      gamesModalOpen();
    };
  }
  if (laterBtn) {
    laterBtn.onclick = closeConfirm;
  }

  // Escape key
  function onEsc(e) {
    if (e.key === 'Escape') {
      closeConfirm();
      document.removeEventListener('keydown', onEsc);
    }
  }
  document.addEventListener('keydown', onEsc);
}

/* ── 6. Games Modal ───────────────────────────────────────── */
function gamesModalOpen() {
  var overlay = document.getElementById('games-overlay');
  if (!overlay) return;
  overlay.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';

  // Init memory game if not yet initialised
  memoryInit();
  // Draw wheel
  spinWheelDraw();

  var closeBtn = document.getElementById('games-close');
  if (closeBtn) closeBtn.focus();
}

function gamesModalClose() {
  var overlay = document.getElementById('games-overlay');
  if (!overlay) return;
  overlay.setAttribute('hidden', '');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', function initGamesModal() {
  var closeBtn = document.getElementById('games-close');
  if (closeBtn) closeBtn.addEventListener('click', gamesModalClose);

  document.addEventListener('keydown', function(e) {
    var overlay = document.getElementById('games-overlay');
    if (e.key === 'Escape' && overlay && !overlay.hasAttribute('hidden')) {
      gamesModalClose();
    }
  });

  // Games tab switching
  $$('.games-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      $$('.games-tab').forEach(function(t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      $$('.games-panel').forEach(function(p) {
        p.classList.remove('active');
        p.setAttribute('hidden', '');
      });

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      var panelId = 'gpanel-' + tab.dataset.gtab;
      var panel = document.getElementById(panelId);
      if (panel) {
        panel.classList.add('active');
        panel.removeAttribute('hidden');
        // Draw wheel if spin tab opened
        if (tab.dataset.gtab === 'spin') spinWheelDraw();
      }
    });
  });
});

/* ── 7. Memory Match Game ─────────────────────────────────── */
var _memoryInitialised = false;
var _memoryFlipped     = [];
var _memoryLocked      = false;
var _memoryMoves       = 0;
var _memoryMatches     = 0;

var MEMORY_EMOJIS = ['🍜', '🍛', '🥘', '🍲', '🥟', '🍢', '🥗', '🍮'];

function memoryInit() {
  var grid = document.getElementById('memory-grid');
  var win  = document.getElementById('memory-win');
  if (!grid) return;

  // Reset state
  _memoryFlipped  = [];
  _memoryLocked   = false;
  _memoryMoves    = 0;
  _memoryMatches  = 0;
  _memoryInitialised = true;

  if (win) win.setAttribute('hidden', '');

  var movesEl   = document.getElementById('memory-moves');
  var matchesEl = document.getElementById('memory-matches');
  if (movesEl)   movesEl.textContent   = '0';
  if (matchesEl) matchesEl.textContent = '0';

  // Create shuffled deck (each emoji twice)
  var deck = MEMORY_EMOJIS.concat(MEMORY_EMOJIS);
  // Fisher-Yates shuffle
  for (var i = deck.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
  }

  grid.innerHTML = '';
  deck.forEach(function(emoji, idx) {
    var card = document.createElement('div');
    card.className = 'memory-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Card ' + (idx + 1) + ', face down');
    card.dataset.emoji = emoji;

    var inner = document.createElement('div');
    inner.className = 'memory-card-inner';

    var back = document.createElement('div');
    back.className = 'memory-card-face memory-card-back';
    back.setAttribute('aria-hidden', 'true');
    back.textContent = '✿';

    var front = document.createElement('div');
    front.className = 'memory-card-face memory-card-front';
    front.setAttribute('aria-hidden', 'true');
    front.textContent = emoji;

    inner.appendChild(back);
    inner.appendChild(front);
    card.appendChild(inner);

    card.addEventListener('click', function() { memoryFlipCard(card); });
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); memoryFlipCard(card); }
    });

    grid.appendChild(card);
  });
}

function memoryFlipCard(card) {
  if (_memoryLocked) return;
  if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

  card.classList.add('flipped');
  card.setAttribute('aria-label', 'Card showing ' + card.dataset.emoji);
  _memoryFlipped.push(card);

  if (_memoryFlipped.length < 2) return;

  // Two cards flipped
  _memoryLocked = true;
  _memoryMoves++;
  var movesEl = document.getElementById('memory-moves');
  if (movesEl) movesEl.textContent = _memoryMoves;

  var a = _memoryFlipped[0];
  var b = _memoryFlipped[1];
  _memoryFlipped = [];

  if (a.dataset.emoji === b.dataset.emoji) {
    // Match
    a.classList.add('matched');
    b.classList.add('matched');
    a.setAttribute('aria-label', 'Matched: ' + a.dataset.emoji);
    b.setAttribute('aria-label', 'Matched: ' + b.dataset.emoji);
    _memoryMatches++;
    var matchesEl = document.getElementById('memory-matches');
    if (matchesEl) matchesEl.textContent = _memoryMatches;
    _memoryLocked = false;

    if (_memoryMatches === MEMORY_EMOJIS.length) {
      // Win!
      var win    = document.getElementById('memory-win');
      var subEl  = document.getElementById('memory-win-sub');
      if (subEl) subEl.textContent = 'Completed in ' + _memoryMoves + ' moves';
      if (win)   win.removeAttribute('hidden');
    }
  } else {
    // No match — flip back after 800ms
    setTimeout(function() {
      a.classList.remove('flipped');
      b.classList.remove('flipped');
      a.setAttribute('aria-label', 'Card, face down');
      b.setAttribute('aria-label', 'Card, face down');
      _memoryLocked = false;
    }, 800);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var playAgain = document.getElementById('memory-play-again');
  if (playAgain) playAgain.addEventListener('click', memoryInit);
});

/* ── 8. Spin the Wheel ────────────────────────────────────── */
var SPIN_SEGMENTS = [
  { label: 'Free Dessert',  emoji: '🍮', color: '#FF9520' },
  { label: '10% Off',       emoji: '🎉', color: '#e63946' },
  { label: 'Free Drink',    emoji: '🥤', color: '#2ec4b6' },
  { label: 'Free Side',     emoji: '🍜', color: '#e07a00' },
  { label: 'Extra Sauce',   emoji: '🌶️', color: '#8338ec' },
  { label: 'Try Again',     emoji: '🔄', color: '#3a86ff' },
];

var _spinUsed     = false;
var _spinRotation = 0; // cumulative degrees

function spinWheelDraw(extraAngle) {
  var canvas = document.getElementById('spin-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width;
  var H = canvas.height;
  var cx = W / 2;
  var cy = H / 2;
  var r  = Math.min(cx, cy) - 6;
  var n  = SPIN_SEGMENTS.length;
  var arc = (2 * Math.PI) / n;
  var startAngle = ((extraAngle || 0) * Math.PI) / 180;

  ctx.clearRect(0, 0, W, H);

  // Draw segments
  SPIN_SEGMENTS.forEach(function(seg, i) {
    var from = startAngle + i * arc;
    var to   = from + arc;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, from, to);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Emoji label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(from + arc / 2);
    ctx.textAlign = 'right';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur  = 3;
    // Text (emoji + label)
    var label = seg.emoji + ' ' + seg.label;
    ctx.fillText(label, r - 10, 5);
    ctx.restore();
  });

  // Centre circle
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
  ctx.fillStyle = '#0a0a0a';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

document.addEventListener('DOMContentLoaded', function initSpin() {
  var spinBtn    = document.getElementById('spin-btn');
  var resultBox  = document.getElementById('spin-result');
  var resultEmoji = document.getElementById('spin-result-emoji');
  var resultPrize = document.getElementById('spin-result-prize');
  var canvas     = document.getElementById('spin-canvas');

  if (!spinBtn || !canvas) return;

  spinBtn.addEventListener('click', function() {
    if (_spinUsed) return;
    _spinUsed = true;
    spinBtn.disabled = true;

    var n         = SPIN_SEGMENTS.length;
    var arcDeg    = 360 / n;

    // Pick winning segment
    var winIdx    = Math.floor(Math.random() * n);

    // We want the pointer (at top = 270°) to land in the middle of winIdx
    // Segment i occupies [i*arcDeg, (i+1)*arcDeg] in the starting position
    // Pointer is at 270° relative to canvas 0° (right).
    // Middle of winning segment from canvas 0°: winIdx * arcDeg + arcDeg/2
    // We need canvas rotation such that that angle == 270°
    var segMidFromZero = winIdx * arcDeg + arcDeg / 2;
    var targetAngle    = 270 - segMidFromZero;       // how far to rotate wheel
    // Add 3–5 full spins
    var fullSpins = (3 + Math.floor(Math.random() * 3)) * 360;
    var totalRot  = fullSpins + targetAngle - (_spinRotation % 360);

    _spinRotation += totalRot;

    // CSS transition on canvas isn't straightforward; use requestAnimationFrame
    var duration   = 4000; // ms
    var startTime  = null;
    var startRot   = _spinRotation - totalRot;
    var endRot     = _spinRotation;

    function easeOut(t) {
      // Cubic ease-out
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(ts) {
      if (!startTime) startTime = ts;
      var elapsed  = ts - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var current  = startRot + totalRot * easeOut(progress);

      spinWheelDraw(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Show result
        var seg = SPIN_SEGMENTS[winIdx];
        if (resultEmoji) resultEmoji.textContent = seg.emoji;
        if (resultPrize) resultPrize.textContent = seg.label + '!';
        if (resultBox)   resultBox.removeAttribute('hidden');
      }
    }

    requestAnimationFrame(animate);
  });
});
