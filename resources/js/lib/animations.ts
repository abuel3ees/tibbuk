import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Ensure elements are always visible if an animation is killed mid-flight
gsap.defaults({ overwrite: 'auto' });

export function initSmoothScroll() {
    import('lenis').then(({ default: Lenis }) => {
        const lenis = new Lenis({ duration: 1.4, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(time => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        (window as any).__lenis = lenis;
    });
}

function from(targets: gsap.TweenTarget, vars: gsap.TweenVars) {
    // Always restore CSS props when done so a kill can't leave elements hidden
    return gsap.from(targets, { ...vars, clearProps: 'all' });
}

export function animateHero(containerSel: string) {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'all' } });
    tl.from(`${containerSel} .hero__copy .pill`,      { opacity: 0, y: 24, duration: 0.7 })
      .from(`${containerSel} .hero__copy h1`,         { opacity: 0, y: 40, duration: 0.9 }, '-=0.4')
      .from(`${containerSel} .hero__copy .hero__lede`,{ opacity: 0, y: 30, duration: 0.8 }, '-=0.5')
      .from(`${containerSel} .hero__copy .hero__cta`, { opacity: 0, y: 20, duration: 0.7 }, '-=0.5')
      .from(`${containerSel} .hero__copy .hero__trust`,{ opacity: 0, y: 16, duration: 0.6 }, '-=0.4')
      .from(`${containerSel} .hero__media`,            { opacity: 0, x: 60, duration: 1.1, ease: 'power2.out' }, '-=1.0');
    return tl;
}

export function animateSectionsOnScroll() {
    // Headings
    gsap.utils.toArray<HTMLElement>('.tbk .section .eyebrow, .tbk .section .h1, .tbk .section .h2').forEach(el => {
        from(el, {
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            opacity: 0, y: 36, duration: 0.9, ease: 'power3.out',
        });
    });

    // Product card grids — stagger rows, don't set opacity on cards above fold
    gsap.utils.toArray<HTMLElement>('.tbk .section .col-grid, .tbk .featured__grid').forEach(grid => {
        const cards = Array.from(grid.querySelectorAll<HTMLElement>('.pcard'));
        if (!cards.length) return;
        // Only animate cards that are below the fold initially
        const belowFold = cards.filter(c => c.getBoundingClientRect().top > window.innerHeight);
        if (!belowFold.length) return;
        from(belowFold, {
            scrollTrigger: { trigger: belowFold[0], start: 'top 88%', once: true },
            opacity: 0, y: 40, duration: 0.75, stagger: 0.07, ease: 'power2.out',
        });
    });

    // Feature blocks
    gsap.utils.toArray<HTMLElement>('.tbk .feature').forEach((el, i) => {
        from(el, {
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            opacity: 0, y: 32, duration: 0.75, delay: i * 0.04, ease: 'power2.out',
        });
    });

    // Step blocks
    gsap.utils.toArray<HTMLElement>('.tbk .step').forEach((el, i) => {
        from(el, {
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            opacity: 0, x: -40, duration: 0.8, delay: i * 0.08, ease: 'power3.out',
        });
    });

    // Category cards
    gsap.utils.toArray<HTMLElement>('.tbk .cat').forEach((el, i) => {
        from(el, {
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            opacity: 0, scale: 0.95, duration: 0.7, delay: i * 0.05, ease: 'power2.out',
        });
    });
}

export function animatePDP() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'all' } });
    tl.from('.tbk .pdp__media-main', { opacity: 0, x: -50, duration: 1.0 })
      .from('.tbk .pdp__side > *',   { opacity: 0, y: 30, duration: 0.75, stagger: 0.1 }, '-=0.6');
    return tl;
}

export function animateCollectionSidebar() {
    from('.tbk .col-sidebar', { opacity: 0, x: -30, duration: 0.8, ease: 'power3.out' });
    // Only animate cards below fold
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.tbk .col-grid .pcard'));
    const belowFold = cards.filter(c => c.getBoundingClientRect().top > window.innerHeight);
    if (belowFold.length) {
        from(belowFold, { opacity: 0, y: 40, duration: 0.7, stagger: 0.06, ease: 'power2.out', delay: 0.2 });
    }
}

export function killAllAnimations() {
    // Clear all active tweens so elements snap to their natural CSS state
    gsap.globalTimeline.clear();
    ScrollTrigger.killAll();
    // Restore any element that got stuck with inline opacity/transform
    gsap.set('*', { clearProps: 'opacity,transform,visibility' });
}
