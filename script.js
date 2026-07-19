/* =====================================================================
   Coffee O'Clock — interactions (vanilla, deferred)
   Sections:
     1. Reduced-motion helper
     2. Scroll reveals (IntersectionObserver, staggered)
     3. rAF parallax (transform-only, GPU)
     4. Sticky nav state + scroll-spy
     5. Smooth in-page scroll (header offset)
     6. Mobile menu (aria, ESC, focus trap, restore)
     7. Gallery lightbox (click/keyboard, ESC/arrows, focus trap)
     8. Reviews carousel (auto-rotate, pause, dots, arrows)
     9. Contact form validation + success state
    10. Footer year
   ===================================================================== */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.getElementById("site-header");
  var HEADER_OFFSET = 76;

  /* ---------- background inert utility (hide page behind modals from AT) ---------- */
  function setBackgroundInert(on) {
    ["site-header", "main", "footer"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (on) { el.setAttribute("inert", ""); el.setAttribute("aria-hidden", "true"); }
      else { el.removeAttribute("inert"); el.removeAttribute("aria-hidden"); }
    });
  }

  /* ---------- focus-trap utility ---------- */
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function trapFocus(container, e) {
    var nodes = Array.prototype.slice.call(container.querySelectorAll(FOCUSABLE))
      .filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
    if (!nodes.length) return;
    var first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ============================================================
     2. SCROLL REVEALS
     ============================================================ */
  (function () {
    var reveals = document.querySelectorAll(".reveal");
    if (!reveals.length) return;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  })();

  /* ============================================================
     3. rAF PARALLAX
     ============================================================ */
  (function () {
    if (prefersReduced) return;
    var planes = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    if (!planes.length) return;
    var ticking = false;
    var MAX = 60; // cap drift so nothing detaches / shows seams

    function update() {
      var y = window.pageYOffset;
      planes.forEach(function (el) {
        var rate = parseFloat(el.getAttribute("data-parallax"));
        // Only the slow background planes drift; plane 1 content flows naturally.
        if (rate >= 1) return;
        var rect = el.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var dist = center - window.innerHeight / 2;
        var shift = Math.max(-MAX, Math.min(MAX, -dist * rate * 0.12));
        el.style.transform = "translate3d(0," + shift.toFixed(1) + "px,0)";
      });
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  })();

  /* ============================================================
     4. STICKY NAV STATE + SCROLL-SPY
     ============================================================ */
  (function () {
    if (!header) return;
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        header.classList.toggle("is-scrolled", window.pageYOffset > 60);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Scroll-spy
    var spyLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__link[data-spy]"));
    if (!spyLinks.length || !("IntersectionObserver" in window)) return;
    var map = {};
    spyLinks.forEach(function (l) { map[l.getAttribute("data-spy")] = l; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          spyLinks.forEach(function (l) { l.classList.remove("is-active"); });
          var active = map[entry.target.id];
          if (active) active.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
  })();

  /* ============================================================
    5. SMOOTH IN-PAGE SCROLL
    ============================================================ */

  document.addEventListener("click", function (e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute("href");
    if (href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();

    const header = document.getElementById("site-header");
    const offset = header ? header.offsetHeight : 0;

    const top =
      target.getBoundingClientRect().top +
      window.pageYOffset -
      offset;

    window.scrollTo({
      top,
      behavior: "smooth"
    });
  });
  /* ============================================================
     6. MOBILE MENU
     ============================================================ */
  (function () {
    var btn = document.getElementById("hamburger");
    var menu = document.getElementById("mobile-menu");

    if (!btn || !menu) return;

    function open() {
      menu.hidden = false;
      menu.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      document.body.classList.add("is-locked");
    }

    function close() {
      menu.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-locked");

      setTimeout(function () {
        menu.hidden = true;
      }, 300);
    }

    btn.addEventListener("click", function () {
      if (menu.hidden) {
        open();
      } else {
        close();
      }
    });

    menu.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (!link) return;

      var href = link.getAttribute("href");

      close();

      if (href && href.startsWith("#")) {
        e.preventDefault();

        setTimeout(function () {
          var target = document.querySelector(href);

          if (target) {
            target.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        }, 320);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        close();
      }
    });
  })();

  /*==========================================================
GALLERY LIGHTBOX
==========================================================*/

  (function () {

    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;

    const image = document.getElementById("lightbox-img");
    const caption = document.getElementById("lightbox-caption");

    const tiles = document.querySelectorAll(".tile__btn");

    let current = 0;

    function show(index) {

      current = index;

      const img = tiles[index].querySelector("img");

      image.src = img.src;
      image.alt = img.alt;

      caption.textContent =
        tiles[index].querySelector(".tile__caption").textContent;

    }

    function open(index) {

      show(index);

      lightbox.hidden = false;

      requestAnimationFrame(() => {
        lightbox.classList.add("is-open");
      });

      document.body.classList.add("is-locked");

    }

    function close() {

      lightbox.classList.remove("is-open");

      document.body.classList.remove("is-locked");

      setTimeout(() => {
        lightbox.hidden = true;
      }, 300);

    }

    function next() {

      current++;

      if (current >= tiles.length)
        current = 0;

      show(current);

    }

    function prev() {

      current--;

      if (current < 0)
        current = tiles.length - 1;

      show(current);

    }

    tiles.forEach((tile, index) => {

      tile.addEventListener("click", () => {

        open(index);

      });

    });

    lightbox.querySelector("[data-lb-close]").addEventListener("click", close);

    lightbox.querySelector("[data-lb-next]").addEventListener("click", next);

    lightbox.querySelector("[data-lb-prev]").addEventListener("click", prev);

    lightbox.addEventListener("click", (e) => {

      if (e.target === lightbox)
        close();

    });

    document.addEventListener("keydown", (e) => {

      if (lightbox.hidden) return;

      if (e.key === "Escape") close();

      if (e.key === "ArrowRight") next();

      if (e.key === "ArrowLeft") prev();

    });

  })();

  /* ============================================================
    8. REVIEWS CAROUSEL
 ============================================================ */

  (() => {

    const slider = document.querySelector(".reviews__slider");

    if (!slider) return;

    const reviews = [...slider.querySelectorAll(".review-card")];
    const dots = [...slider.querySelectorAll(".reviews__dot")];
    const prev = slider.querySelector("[data-rev-prev]");
    const next = slider.querySelector("[data-rev-next]");

    if (reviews.length <= 1) return;

    let current = 0;
    let autoSlide;

    const AUTO_DELAY = 5000;

    function showReview(index) {

      current = (index + reviews.length) % reviews.length;

      reviews.forEach((review, i) => {

        review.classList.toggle("is-active", i === current);

      });

      dots.forEach((dot, i) => {

        const active = i === current;

        dot.classList.toggle("is-active", active);

        dot.setAttribute("aria-current", active);

      });

    }

    function nextReview() {

      showReview(current + 1);

    }

    function prevReview() {

      showReview(current - 1);

    }

    function stopAutoSlide() {

      clearInterval(autoSlide);

    }

    function startAutoSlide() {

      stopAutoSlide();

      autoSlide = setInterval(nextReview, AUTO_DELAY);

    }

    next.addEventListener("click", () => {

      nextReview();

      startAutoSlide();

    });

    prev.addEventListener("click", () => {

      prevReview();

      startAutoSlide();

    });

    dots.forEach((dot, index) => {

      dot.addEventListener("click", () => {

        showReview(index);

        startAutoSlide();

      });

    });

    slider.addEventListener("mouseenter", stopAutoSlide);

    slider.addEventListener("mouseleave", startAutoSlide);

    slider.addEventListener("touchstart", stopAutoSlide, { passive: true });

    slider.addEventListener("touchend", startAutoSlide);

    document.addEventListener("keydown", e => {

      if (e.key === "ArrowLeft") {

        prevReview();

        startAutoSlide();

      }

      if (e.key === "ArrowRight") {

        nextReview();

        startAutoSlide();

      }

    });

    showReview(0);

    startAutoSlide();

  })();

  /* ============================================================
   9. CONTACT FORM
============================================================ */
  (function () {

    const form = document.getElementById("contact-form");

    if (!form) return;

    const submitBtn = form.querySelector(".contact__submit");

    const success = document.getElementById("contact-success");

    form.addEventListener("submit", async function (e) {

      e.preventDefault();

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      const formData = new FormData(form);

      try {

        const response = await fetch(form.action, {
          method: "POST",
          body: formData,
          headers: {
            "Accept": "application/json"
          }
        });

        const result = await response.json();

        if (result.success) {

          form.reset();
          submitBtn.textContent = "Reservation Sent ✓";

          form.hidden = true;

          success.hidden = false;

          success.scrollIntoView({
            behavior: "smooth"
          });

        }
        else {

          alert("Reservation could not be sent. Please try again.");

          submitBtn.disabled = false;

          submitBtn.textContent = "Book Now";

        }
        const today = new Date().toISOString().split("T")[0];
        document.getElementById("f-date").min = today;

      } catch (error) {

        alert("Something went wrong. Please try again.");

        submitBtn.disabled = false;

        submitBtn.textContent = "Book Now";

      }

    });

  })();
  /* ============================================================
     10. FOOTER YEAR
     ============================================================ */
  (function () {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  })();

})();

/* ==========================================================
   BRAND ANIMATION
========================================================== */

const brand = document.querySelector(".brand");

if (brand) {

  const observer = new IntersectionObserver(entries => {

    entries.forEach(entry => {

      if (entry.isIntersecting) {

        brand.classList.add("is-visible");

      }

    });

  }, {

    threshold: 0.35

  });

  observer.observe(brand);

}
