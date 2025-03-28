document.addEventListener('DOMContentLoaded', () => {

    const performanceConfig = { throttleDelay: 16, debounceDelay: 150, observerThreshold: 0.1, observerMargin: '0px 0px -50px 0px', staggerDelay: 100 };
    const utility = {
        throttle: (func, limit) => { let inThrottle; return function(...args) { const context = this; if (!inThrottle) { func.apply(context, args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } } },
        debounce: (func, wait) => { let timeout; return function executedFunction(...args) { const context = this; const later = () => { clearTimeout(timeout); func.apply(context, args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }
    };

    // --- Hamburger Menu ---
    const setupHamburgerMenu = () => {
        const hamburgerButton = document.getElementById('hamburger-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const body = document.body;

        if (!hamburgerButton || !mobileMenu) { console.warn("Hamburger menu elements not found."); return; }

        hamburgerButton.addEventListener('click', () => {
            const isExpanded = hamburgerButton.getAttribute('aria-expanded') === 'true';
            hamburgerButton.setAttribute('aria-expanded', !isExpanded);
            hamburgerButton.classList.toggle('active');
            mobileMenu.classList.toggle('open');
            body.classList.toggle('mobile-menu-open'); // Toggle class on body
            mobileMenu.setAttribute('aria-hidden', String(isExpanded)); // Correct attribute update
        });

        // Close menu when a link is clicked AND handle scrolling
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                // 1. Close the menu visually
                hamburgerButton.setAttribute('aria-expanded', 'false');
                hamburgerButton.classList.remove('active');
                mobileMenu.classList.remove('open');
                body.classList.remove('mobile-menu-open'); // Remove class from body
                mobileMenu.setAttribute('aria-hidden', 'true');

                // 2. Manually handle scrolling after menu closes
                const targetId = link.getAttribute('href');
                try {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        e.preventDefault(); // Prevent instant jump only if target exists
                        const header = document.querySelector('.header');
                        // Use mobile fixed height for offset calculation on mobile
                        const headerOffset = header ? parseFloat(getComputedStyle(header).height) : 60;
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = window.pageYOffset + elementPosition - headerOffset - 20; // 20px buffer

                        // Use a small timeout to allow menu closing animation before scrolling
                        setTimeout(() => {
                            window.scrollTo({
                                top: Math.max(0, offsetPosition),
                                behavior: 'smooth' // Use smooth scroll after menu closes
                            });
                        }, 50); // Shorter delay might feel more responsive
                    } else { console.warn(`Mobile menu scroll target not found: ${targetId}`); }
                } catch (error) { console.error(`Error finding mobile menu scroll target: ${targetId}`, error); }
            });
        });
    };

    // --- Smooth Scrolling (Desktop Nav ONLY) ---
    const setupSmoothScrolling = () => {
        document.querySelectorAll('.desktop-nav a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                 e.preventDefault();
                 const targetId = this.getAttribute('href');
                 try { /* ... (same as previous version) ... */
                    const targetElement = document.querySelector(targetId); if (targetElement) { const header = document.querySelector('.header'); const headerOffset = header ? parseFloat(getComputedStyle(header).height) : 70; const elementPosition = targetElement.getBoundingClientRect().top; const offsetPosition = window.pageYOffset + elementPosition - headerOffset - 20; window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' }); } else { console.warn(`Smooth scroll target not found: ${targetId}`); } } catch (error) { console.error(`Error finding smooth scroll target: ${targetId}`, error); }
            });
        });
    };

    // --- Header Scroll Effect ---
     const setupHeaderScrollEffect = () => {
         const header = document.querySelector('.header'); if (!header) return; let lastScroll = 0; let headerHeight = header.offsetHeight;
         const handleScroll = () => { const currentScroll = window.pageYOffset;
            // Apply effect ONLY if mobile menu is NOT open AND screen is wider than mobile breakpoint
            if (!document.body.classList.contains('mobile-menu-open') && window.innerWidth > 768) {
                const scrollThreshold = headerHeight * 0.8; if (currentScroll <= scrollThreshold) { header.classList.remove('scroll-up', 'scroll-down'); return; } if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) { header.classList.remove('scroll-up'); header.classList.add('scroll-down'); } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) { header.classList.remove('scroll-down'); header.classList.add('scroll-up'); }
            } else { header.classList.remove('scroll-up', 'scroll-down'); } // Ensure visible on mobile or when menu open
            lastScroll = Math.max(0, currentScroll); };
         const handleResize = () => { headerHeight = header.offsetHeight; };
         window.addEventListener('scroll', utility.throttle(handleScroll, performanceConfig.throttleDelay)); window.addEventListener('resize', utility.debounce(handleResize, performanceConfig.debounceDelay)); handleResize();
    };

    // --- Progress Bar & Active Nav Link (Desktop Nav) ---
    const setupScrollProgress = () => { /* ... (same logic targeting .desktop-nav) ... */
        const progressBar = document.querySelector('.progress-bar'); const sections = document.querySelectorAll('.section'); const navLinks = document.querySelectorAll('.desktop-nav ul li a'); const header = document.querySelector('.header'); if (!progressBar || sections.length === 0 || navLinks.length === 0) return;
        const updateProgressAndNav = () => { const headerHeight = header ? parseFloat(getComputedStyle(header).height) : 70; requestAnimationFrame(() => { const windowHeight = window.innerHeight; const documentHeight = document.documentElement.scrollHeight; const totalScrollable = documentHeight - windowHeight; const scrolled = window.scrollY; const progress = totalScrollable > 0 ? (scrolled / totalScrollable) * 100 : 0; progressBar.style.width = `${Math.min(progress, 100)}%`; let currentSectionId = ''; const scrollMidPoint = scrolled + windowHeight * 0.5; sections.forEach(section => { const sectionTop = section.offsetTop - headerHeight; const sectionBottom = sectionTop + section.offsetHeight; if (scrollMidPoint >= sectionTop && scrollMidPoint < sectionBottom) { currentSectionId = section.getAttribute('id'); } }); if (!currentSectionId) { let minDistanceAbove = Infinity; sections.forEach(section => { const sectionTop = section.offsetTop - headerHeight - 50; if (scrolled >= sectionTop) { const distance = scrolled - sectionTop; if (distance < minDistanceAbove) { minDistanceAbove = distance; currentSectionId = section.getAttribute('id'); } } }); } if (!currentSectionId && scrolled < sections[0]?.offsetTop) { currentSectionId = sections[0]?.getAttribute('id'); } navLinks.forEach(link => { link.classList.remove('active'); if (link.getAttribute('href') === `#${currentSectionId}`) { link.classList.add('active'); } }); }); };
        window.addEventListener('scroll', utility.throttle(updateProgressAndNav, performanceConfig.throttleDelay)); window.addEventListener('resize', utility.debounce(updateProgressAndNav, performanceConfig.debounceDelay)); updateProgressAndNav();
     };

    // --- Section & Item Fade-in Animation (with Stagger) ---
    const setupSectionAnimations = () => { /* ... same ... */
        const sections = document.querySelectorAll('.animate-on-scroll'); if (sections.length === 0) return; const observerCallback = (entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { const section = entry.target; section.classList.add('visible'); const itemsToAnimate = section.querySelectorAll('.animate-item'); itemsToAnimate.forEach((item, index) => { item.style.setProperty('--animation-delay', `${index * performanceConfig.staggerDelay}ms`); }); observer.unobserve(section); } }); }; const observer = new IntersectionObserver(observerCallback, { threshold: performanceConfig.observerThreshold, rootMargin: performanceConfig.observerMargin }); sections.forEach(section => { observer.observe(section); });
     };

    // --- Action Buttons (Copy/Print) ---
    const setupActionButtons = () => { /* ... same copy/print logic ... */
        const copyButton = document.getElementById('copy-button'); const printButton = document.getElementById('print-button'); if (copyButton) { copyButton.addEventListener('click', async () => { /* ... copy logic ... */ }); } if (printButton) { printButton.addEventListener('click', () => { window.print(); }); }
     };

    // --- Performance Hints (will-change) ---
    const setupWillChange = () => { /* ... same ... */
         const elements = document.querySelectorAll('.animate-item, .header, .action-button'); elements.forEach(el => { el.style.willChange = 'opacity, transform'; });
     };

    // --- Initialize Everything ---
    setupHamburgerMenu();
    setupSmoothScrolling();
    setupHeaderScrollEffect();
    setupScrollProgress();
    setupSectionAnimations();
    setupActionButtons();
    setupWillChange();

}); // End DOMContentLoaded
