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
// Supports: data-speed (translateY), data-rotate (deg), data-scale (scale delta)
const parallaxEls = [...document.querySelectorAll('[data-speed], [data-rotate], [data-scale]')];
let parallaxTicking = false;

function applyParallax() {
  const vh = window.innerHeight;
  parallaxEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const progress = (center - vh / 2) / vh;        // −0.5 → +0.5 range while in view
    const speed  = parseFloat(el.dataset.speed  || 0);
    const rot    = parseFloat(el.dataset.rotate || 0);
    const scaleD = parseFloat(el.dataset.scale  || 0);
    const ty = -progress * speed * vh;
    const rz = -progress * rot;                     // deg
    const sc = 1 + (-progress * scaleD);            // base 1, +/- scaleD
    el.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0) rotate(${rz.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
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

// --- Testimonials marquee: duplicate for seamless loop ---
(function initMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;
  const items = [...track.children].map(el => el.cloneNode(true));
  items.forEach(el => track.appendChild(el));
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

// --- Build gallery from manifest (limit + See more) ---
const GALLERY_INITIAL = 10;
async function buildGallery() {
  const grid = document.getElementById('galleryGrid');
  const moreBtn = document.getElementById('galleryMoreBtn');
  if (!grid) return;
  try {
    const res = await fetch('images/manifest.json');
    const manifest = await res.json();
    const shuffled = [...manifest].sort(() => Math.random() - 0.5);

    const html = shuffled.map((p, i) => `
      <figure class="gallery-item ${i >= GALLERY_INITIAL ? 'is-collapsed' : ''}" data-full="images/photos/${p.baseName}.jpg">
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
      el.addEventListener('click', () => openLightbox(el.dataset.full));
    });

    if (shuffled.length <= GALLERY_INITIAL) {
      moreBtn?.classList.add('is-hidden');
    } else if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        grid.querySelectorAll('.gallery-item.is-collapsed')
            .forEach(el => el.classList.remove('is-collapsed'));
        moreBtn.classList.add('is-hidden');
      });
    }
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
