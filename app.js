// ============================================================
// AL&S Media — App Scripts
// ============================================================

(function() {
  'use strict';

  // ---- Header scroll behavior ----
  const header = document.getElementById('header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const current = window.scrollY;

    // Show/hide on scroll direction
    if (current > 80) {
      header.classList.add('header--scrolled');
      if (current > lastScroll && current > 300) {
        header.classList.add('header--hidden');
      } else {
        header.classList.remove('header--hidden');
      }
    } else {
      header.classList.remove('header--scrolled');
      header.classList.remove('header--hidden');
    }

    lastScroll = current;
  }, { passive: true });


  // ---- Mobile nav toggle ----
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  menuToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    menuToggle.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close mobile nav on link click
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });


  // ---- Scroll reveal ----
  const revealElements = document.querySelectorAll(
    '.section-label, .section-title, .about__body, .about__visual, ' +
    '.service-card, .work__item, .coverage__region, ' +
    '.contact__text, .contact__form, .stats__item'
  );

  revealElements.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => observer.observe(el));


  // ---- Stat counter animation ----
  const statNumbers = document.querySelectorAll('.stats__number[data-target]');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);

        // Don't animate year-like numbers
        if (target >= 2000) {
          el.textContent = target;
          counterObserver.unobserve(el);
          return;
        }

        let current = 0;
        const duration = 1500;
        const step = target / (duration / 16);

        const tick = () => {
          current += step;
          if (current >= target) {
            el.textContent = target;
          } else {
            el.textContent = Math.floor(current);
            requestAnimationFrame(tick);
          }
        };
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => counterObserver.observe(el));


  // ---- Smooth scroll for anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });


  // ---- Contact form handler ----
  const form = document.getElementById('contact-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#name').value;
    const company = form.querySelector('#company').value;
    const email = form.querySelector('#email').value;
    const message = form.querySelector('#message').value;

    const subject = encodeURIComponent('Website Enquiry from ' + name);
    const body = encodeURIComponent(
      'Name: ' + name + '\n' +
      'Company: ' + company + '\n' +
      'Email: ' + email + '\n\n' +
      message
    );

    window.open('mailto:ryan@alands.media?subject=' + subject + '&body=' + body, '_blank');
  });

})();
