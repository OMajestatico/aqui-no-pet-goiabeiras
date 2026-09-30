(() => {
  const topbar = document.getElementById('topbar');
  const menuBtn = document.getElementById('menuBtn');
  const menuOverlay = document.getElementById('menuOverlay');
  let menuOpen = false;

  const refreshIcons = () => {
    if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
  };

  const setMenu = (open) => {
    menuOpen = open;
    menuOverlay.classList.toggle('is-open', open);
    menuOverlay.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', open);

    // Deliberadamente não usamos position: fixed no body nem scrollTo ao fechar.
    // Assim, abrir e fechar o menu nunca altera a posição atual da página.
    menuBtn.innerHTML = open ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
    refreshIcons();
  };

  menuBtn.addEventListener('click', () => setMenu(!menuOpen));
  menuOverlay.querySelectorAll('[data-close-menu]').forEach(el => el.addEventListener('click', () => setMenu(false)));

  menuOverlay.querySelectorAll('[data-menu-link]').forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const selector = link.getAttribute('href');
      const target = document.querySelector(selector);
      setMenu(false);
      if (!target) return;
      window.setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 90);
    });
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuOpen) setMenu(false);
  });

  const onScroll = () => topbar.classList.toggle('is-scrolled', window.scrollY > 16);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -4% 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  const getNearestIndex = (track) => {
    const items = [...track.children];
    if (!items.length) return 0;
    const left = track.scrollLeft;
    let best = 0;
    let dist = Infinity;
    items.forEach((item, i) => {
      const d = Math.abs(item.offsetLeft - track.offsetLeft - left);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  };

  const setupDots = (track) => {
    const dots = document.querySelector(`[data-dots-for="${track.id}"]`);
    if (!dots) return;
    dots.innerHTML = '';
    [...track.children].forEach((_, i) => {
      const dot = document.createElement('span');
      if (i === 0) dot.classList.add('is-active');
      dots.appendChild(dot);
    });
    const update = () => {
      const index = getNearestIndex(track);
      [...dots.children].forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    };
    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }, { passive: true });
  };

  document.querySelectorAll('[data-carousel]').forEach(track => {
    setupDots(track);

    // Arraste no desktop. No touch, deixamos o scroll nativo cuidar do gesto,
    // preservando o scroll vertical da página quando o dedo cruza o carrossel.
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    track.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse') return;
      dragging = true;
      startX = event.clientX;
      startScroll = track.scrollLeft;
      track.setPointerCapture(event.pointerId);
      track.style.cursor = 'grabbing';
    });
    track.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      track.scrollLeft = startScroll - (event.clientX - startX);
    });
    const endDrag = () => {
      dragging = false;
      track.style.cursor = '';
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
  });

  const scrollCarousel = (id, dir) => {
    const track = document.getElementById(id);
    if (!track) return;
    const card = track.firstElementChild;
    if (!card) return;
    const gap = parseFloat(getComputedStyle(track).gap || '0');
    track.scrollBy({ left: dir * (card.getBoundingClientRect().width + gap), behavior: 'smooth' });
  };

  document.querySelectorAll('[data-carousel-prev]').forEach(btn => {
    btn.addEventListener('click', () => scrollCarousel(btn.dataset.carouselPrev, -1));
  });
  document.querySelectorAll('[data-carousel-next]').forEach(btn => {
    btn.addEventListener('click', () => scrollCarousel(btn.dataset.carouselNext, 1));
  });

  window.addEventListener('load', refreshIcons, { once: true });
  document.addEventListener('DOMContentLoaded', refreshIcons, { once: true });
})();
