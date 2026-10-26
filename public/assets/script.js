// мобільне меню (усі сторінки)
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('mainNav');
  const toggle = document.getElementById('menuToggle');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  toggle.setAttribute('aria-controls', 'mainNav');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) setOpen(false); });
});
