/* ============================================================
   GIVEN & RECEIVED — frontend
   ============================================================ */

// --- Year in footer ---
document.getElementById('year').textContent = new Date().getFullYear();

// --- Nav scroll state ---
const nav = document.getElementById('nav');
const onScroll = () => {
  if (window.scrollY > 40) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// --- Mobile nav burger ---
const burger = document.getElementById('navBurger');
const navLinks = document.querySelector('.nav-links');
burger?.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks?.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => navLinks.classList.remove('open'))
);

// --- Native scroll (no smooth-scroll lib) ---
// Anchor links use CSS scroll-behavior: smooth from html {}


// --- Parallax on [data-speed] elements (rAF-throttled) ---
const parallaxEls = [...document.querySelectorAll('[data-speed]')];
let parallaxTicking = false;

function applyParallax() {
  const vh = window.innerHeight;
  parallaxEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const progress = (center - vh / 2) / vh;
    const speed = parseFloat(el.dataset.speed || 0);
    const ty = -progress * speed * vh;
    el.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0)`;
  });
  parallaxTicking = false;
}
function requestParallax() {
  if (!parallaxTicking) {
    requestAnimationFrame(applyParallax);
    parallaxTicking = true;
  }
}
applyParallax();
window.addEventListener('scroll', requestParallax, { passive: true });
window.addEventListener('resize', requestParallax);

// --- 3D Events Carousel ---
(function initCarousel() {
  const track = document.getElementById('carouselTrack');
  if (!track) return;
  const cards = [...track.querySelectorAll('.carousel-card')];
  const dotsEl = document.getElementById('carouselDots');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  const n = cards.length;
  let current = Math.floor(n / 2);

  // Build dots
  cards.forEach((_, i) => {
    const b = document.createElement('button');
    b.className = 'carousel-dot';
    b.setAttribute('aria-label', `Event ${i + 1}`);
    b.addEventListener('click', () => go(i));
    dotsEl.appendChild(b);
  });
  const dots = [...dotsEl.children];

  function layout() {
    cards.forEach((card, i) => {
      // signed, minimal offset (cyclic)
      let offset = i - current;
      if (offset > n / 2) offset -= n;
      if (offset < -n / 2) offset += n;

      const abs = Math.abs(offset);
      const sign = Math.sign(offset);

      if (abs > 2) {
        card.classList.add('is-hidden');
        card.style.transform = `translate(-50%, -50%) translateX(${sign * 600}px) scale(.5)`;
        card.style.zIndex = 0;
        card.classList.remove('is-center');
        return;
      }
      card.classList.remove('is-hidden');

      const x = offset * 240;                    // horizontal push
      const scale = 1 - abs * 0.14;              // shrink side cards
      const rot = offset * -14;                  // tilt
      const z = -abs * 200;                      // push back
      const opacity = abs === 0 ? 1 : (abs === 1 ? .72 : .35);

      card.style.transform =
        `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) rotateY(${rot}deg) scale(${scale})`;
      card.style.opacity = opacity;
      card.style.zIndex = 10 - abs;
      card.classList.toggle('is-center', abs === 0);
    });

    dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
  }

  function go(i) {
    current = ((i % n) + n) % n;
    layout();
  }

  prevBtn.addEventListener('click', () => go(current - 1));
  nextBtn.addEventListener('click', () => go(current + 1));

  cards.forEach((card, i) => {
    card.addEventListener('click', (e) => {
      if (card.classList.contains('is-center')) return;
      // don't hijack link clicks
      if (e.target.closest('a')) return;
      go(i);
    });
  });

  // Keyboard
  track.closest('.carousel').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(current - 1);
    if (e.key === 'ArrowRight') go(current + 1);
  });

  // Touch swipe
  let touchX = null;
  track.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  layout();
  window.addEventListener('resize', layout);
})();

// --- Reveal on view ---
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

document.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el));

// --- Build gallery from manifest ---
async function buildGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  try {
    const res = await fetch('images/manifest.json');
    const manifest = await res.json();
    // Exclude a few shots already used heavily in heroes/sections to avoid duplication feel? No — user wants all.
    const items = manifest;
    // Shuffle lightly for visual mix but keep portraits mostly together for masonry
    const shuffled = [...items].sort(() => Math.random() - 0.5);

    const html = shuffled.map((p, i) => `
      <figure class="gallery-item" data-reveal data-full="images/photos/${p.baseName}.jpg">
        <picture>
          <source type="image/webp" srcset="images/thumbs/${p.baseName}.webp" />
          <img src="images/thumbs/${p.baseName}.jpg"
               alt="Given and Received — image ${i+1}"
               loading="lazy" decoding="async" />
        </picture>
      </figure>
    `).join('');
    grid.innerHTML = html;

    grid.querySelectorAll('.gallery-item').forEach(el => {
      revealObs.observe(el);
      el.addEventListener('click', () => openLightbox(el.dataset.full));
    });
  } catch (e) {
    console.warn('Gallery manifest failed', e);
  }
}
buildGallery();

// --- Lightbox ---
const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
lightbox.innerHTML = '<img alt="" />';
document.body.appendChild(lightbox);
const lightImg = lightbox.querySelector('img');

function openLightbox(src) {
  lightImg.src = src;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => { lightImg.src = ''; }, 300);
}
lightbox.addEventListener('click', closeLightbox);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
});
