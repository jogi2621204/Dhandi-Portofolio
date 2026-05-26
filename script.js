/* =============================================
   DANDY KURNIAWAN — Portfolio
   Nav scroll effect + mobile menu + project slider
   All 3D and scroll animation in botanical-journey.js
   ============================================= */

/* ── Nav scroll effect ── */
const nav = document.getElementById('global-nav');

window.addEventListener('scroll', () =>
{
    nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── Mobile menu ── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () =>
{
    mobileMenu.classList.toggle('open');
});

mobileMenu.querySelectorAll('a').forEach((link) =>
{
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* ── Project Slider ── */
(function ()
{
    const track      = document.getElementById('projTrack');
    const dotsRow    = document.getElementById('sliderDots');
    const btnPrev    = document.getElementById('sliderPrev');
    const btnNext    = document.getElementById('sliderNext');
    const filterBtns = document.querySelectorAll('.sf-btn');

    if (!track) { return; }

    let allSlides    = Array.from(track.querySelectorAll('.proj-slide'));
    let visible      = [];
    let currentIndex = 0;
    let slideWidth   = 0;
    const gap        = 14;

    /* Build dot buttons using safe DOM methods only */
    function buildDots()
    {
        dotsRow.replaceChildren();
        visible.forEach((_, i) =>
        {
            const d = document.createElement('button');
            d.className = i === currentIndex ? 'slider-dot is-active' : 'slider-dot';
            d.setAttribute('aria-label', 'Slide ' + (i + 1));
            d.addEventListener('click', () => goTo(i));
            dotsRow.appendChild(d);
        });
    }

    /* Sync dot highlight state */
    function syncDots()
    {
        dotsRow.querySelectorAll('.slider-dot').forEach((d, i) =>
        {
            d.classList.toggle('is-active', i === currentIndex);
        });
    }

    /* Measure one visible slide width (including gap) */
    function measureSlide()
    {
        if (visible.length === 0) { return; }
        slideWidth = visible[0].getBoundingClientRect().width + gap;
    }

    /* Navigate to a specific index */
    function goTo(index)
    {
        currentIndex = Math.max(0, Math.min(index, visible.length - 1));
        measureSlide();
        track.style.transform = 'translateX(-' + (currentIndex * slideWidth) + 'px)';
        syncDots();
    }

    /* Apply category filter, reset position */
    function applyFilter(cat)
    {
        allSlides.forEach((s) =>
        {
            const match = cat === 'all' || s.dataset.cat === cat;
            s.classList.toggle('is-hidden', !match);
        });

        visible      = allSlides.filter((s) => !s.classList.contains('is-hidden'));
        currentIndex = 0;

        /* Reset without transition, then re-enable */
        track.style.transition = 'none';
        track.style.transform  = 'translateX(0)';
        track.offsetHeight;    /* force layout */
        track.style.transition = '';

        buildDots();
        measureSlide();
    }

    /* Filter tab clicks */
    filterBtns.forEach((btn) =>
    {
        btn.addEventListener('click', () =>
        {
            filterBtns.forEach((b) => b.classList.remove('sf-btn--active'));
            btn.classList.add('sf-btn--active');
            applyFilter(btn.dataset.filter || 'all');
        });
    });

    /* Prev / Next arrow buttons */
    btnPrev.addEventListener('click', () => goTo(currentIndex - 1));
    btnNext.addEventListener('click', () => goTo(currentIndex + 1));

    /* Keyboard navigation (only when portfolio panel is visible) */
    document.addEventListener('keydown', (e) =>
    {
        const panel = document.getElementById('ch-portfolio');
        if (!panel || !panel.classList.contains('ch-panel--visible')) { return; }
        if (e.key === 'ArrowLeft')  { goTo(currentIndex - 1); }
        if (e.key === 'ArrowRight') { goTo(currentIndex + 1); }
    });

    /* Touch / swipe support */
    let touchStartX = 0;

    track.addEventListener('touchstart', (e) =>
    {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', (e) =>
    {
        const delta = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(delta) > 40) { goTo(currentIndex + (delta > 0 ? 1 : -1)); }
    }, { passive: true });

    /* Re-measure on window resize */
    window.addEventListener('resize', () => goTo(currentIndex), { passive: true });

    /* Init with all slides visible */
    applyFilter('all');
}());
