document.addEventListener('DOMContentLoaded', () => {

    const performanceConfig = { /* ... same ... */
        throttleDelay: 16, debounceDelay: 150, observerThreshold: 0.1,
        observerMargin: '0px 0px -50px 0px', staggerDelay: 100
    };
    const utility = { // Group utility functions
        throttle: (func, limit) => { /* ... same ... */
            let inThrottle; return function(...args) { const context = this; if (!inThrottle) { func.apply(context, args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } }
        },
        debounce: (func, wait) => { /* ... same ... */
            let timeout; return function executedFunction(...args) { const context = this; const later = () => { clearTimeout(timeout); func.apply(context, args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); };
        }
    };

    // --- Hamburger Menu ---
    const setupHamburgerMenu = () => {
        const hamburgerButton = document.getElementById('hamburger-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const body = document.body;

        if (!hamburgerButton || !mobileMenu) return;

        hamburgerButton.addEventListener('click', () => {
            const isExpanded = hamburgerButton.getAttribute('aria-expanded') === 'true';
            hamburgerButton.setAttribute('aria-expanded', !isExpanded);
            hamburgerButton.classList.toggle('active');
            mobileMenu.classList.toggle('open');
            body.classList.toggle('mobile-menu-open');
            mobileMenu.setAttribute('aria-hidden', isExpanded);
        });

        // Close menu when a link is clicked
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburgerButton.setAttribute('aria-expanded', 'false');
                hamburgerButton.classList.remove('active');
                mobileMenu.classList.remove('open');
                body.classList.remove('mobile-menu-open');
                mobileMenu.setAttribute('aria-hidden', 'true');
                 // Allow default anchor behavior to scroll after closing
            });
        });
    };

    // --- Smooth Scrolling (For Desktop Nav and Mobile Links) ---
    const setupSmoothScrolling = () => {
        // Target links in both desktop and mobile navs
        document.querySelectorAll('.nav a[href^="#"], .mobile-menu a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                // Don't prevent default for mobile menu links after menu is closed
                if (!this.closest('.mobile-menu')) {
                     e.preventDefault();
                }

                const targetId = this.getAttribute('href');
                try {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        const header = document.querySelector('.header');
                        const headerOffset = header ? parseFloat(getComputedStyle(header).height) : 70;
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = window.pageYOffset + elementPosition - headerOffset - 20;

                        // Scroll immediately after closing mobile menu, or smoothly for desktop
                        window.scrollTo({
                            top: Math.max(0, offsetPosition),
                            behavior: this.closest('.mobile-menu') ? 'auto' : 'smooth' // 'auto' for instant jump after mobile click
                        });
                    } else { console.warn(`Smooth scroll target not found: ${targetId}`); }
                } catch (error) { console.error(`Error finding smooth scroll target: ${targetId}`, error); }
            });
        });
    };

    // --- Header Scroll Effect (Only for Desktop) ---
    const setupHeaderScrollEffect = () => {
        const header = document.querySelector('.header');
        if (!header) return;
        let lastScroll = 0;
        let headerHeight = header.offsetHeight;

        const handleScroll = () => {
            const currentScroll = window.pageYOffset;
             // Only apply effect on wider screens
            if (window.innerWidth > 768) { // Use breakpoint value
                const scrollThreshold = headerHeight * 0.8;
                if (currentScroll <= scrollThreshold) { header.classList.remove('scroll-up', 'scroll-down'); return; }
                if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) { header.classList.remove('scroll-up'); header.classList.add('scroll-down'); }
                else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) { header.classList.remove('scroll-down'); header.classList.add('scroll-up'); }
            } else {
                 header.classList.remove('scroll-up', 'scroll-down'); // Ensure visible on mobile scroll
            }
            lastScroll = Math.max(0, currentScroll);
        };
        const handleResize = () => { headerHeight = header.offsetHeight; };

        window.addEventListener('scroll', utility.throttle(handleScroll, performanceConfig.throttleDelay));
        window.addEventListener('resize', utility.debounce(handleResize, performanceConfig.debounceDelay));
        handleResize(); // Initial setup
    };


    // --- Progress Bar & Active Nav Link (Targets Desktop Nav) ---
    const setupScrollProgress = () => {
        const progressBar = document.querySelector('.progress-bar');
        const sections = document.querySelectorAll('.section');
        // Only target desktop nav links for active state highlighting
        const navLinks = document.querySelectorAll('.desktop-nav ul li a');
        const header = document.querySelector('.header');

        if (!progressBar || sections.length === 0 || navLinks.length === 0) return;

        const updateProgressAndNav = () => {
            const headerHeight = header ? parseFloat(getComputedStyle(header).height) : 70;
            requestAnimationFrame(() => {
                // Progress Bar
                const windowHeight = window.innerHeight; const documentHeight = document.documentElement.scrollHeight;
                const totalScrollable = documentHeight - windowHeight; const scrolled = window.scrollY;
                const progress = totalScrollable > 0 ? (scrolled / totalScrollable) * 100 : 0;
                progressBar.style.width = `${Math.min(progress, 100)}%`;

                // Active Nav Link
                let currentSectionId = ''; const scrollMidPoint = scrolled + windowHeight * 0.5;
                sections.forEach(section => {
                    const sectionTop = section.offsetTop - headerHeight; const sectionBottom = sectionTop + section.offsetHeight;
                    if (scrollMidPoint >= sectionTop && scrollMidPoint < sectionBottom) { currentSectionId = section.getAttribute('id'); }
                });
                if (!currentSectionId) {
                     let minDistanceAbove = Infinity;
                     sections.forEach(section => {
                          const sectionTop = section.offsetTop - headerHeight - 50;
                          if (scrolled >= sectionTop) { const distance = scrolled - sectionTop; if (distance < minDistanceAbove) { minDistanceAbove = distance; currentSectionId = section.getAttribute('id'); } }
                     });
                }
                 if (!currentSectionId && scrolled < sections[0]?.offsetTop) { currentSectionId = sections[0]?.getAttribute('id'); }

                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentSectionId}`) { link.classList.add('active'); }
                });
            });
        };

        window.addEventListener('scroll', utility.throttle(updateProgressAndNav, performanceConfig.throttleDelay));
        window.addEventListener('resize', utility.debounce(updateProgressAndNav, performanceConfig.debounceDelay));
        updateProgressAndNav(); // Initial update
    };

    // --- Section & Item Fade-in Animation (with Stagger) ---
    const setupSectionAnimations = () => { /* ... same as before ... */
        const sections = document.querySelectorAll('.animate-on-scroll'); if (sections.length === 0) return;
        const observerCallback = (entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { const section = entry.target; section.classList.add('visible'); const itemsToAnimate = section.querySelectorAll('.animate-item'); itemsToAnimate.forEach((item, index) => { item.style.setProperty('--animation-delay', `${index * performanceConfig.staggerDelay}ms`); }); observer.unobserve(section); } }); };
        const observer = new IntersectionObserver(observerCallback, { threshold: performanceConfig.observerThreshold, rootMargin: performanceConfig.observerMargin });
        sections.forEach(section => { observer.observe(section); });
    };

    // --- Action Buttons (Copy/Print) ---
    const setupActionButtons = () => { /* ... same copy/print logic ... */
        const copyButton = document.getElementById('copy-button'); const printButton = document.getElementById('print-button');
        if (copyButton) { copyButton.addEventListener('click', async () => { /* ... copy logic ... */
            const contentElement = document.querySelector('.main-content'); if (!contentElement) return; let textToCopy = "";
            contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li').forEach(el => { let prefix = ""; let suffix = "\n\n"; const tagName = el.tagName.toLowerCase();
                if (tagName.startsWith('h')) { prefix = `\n--- ${el.textContent.trim().toUpperCase()} ---\n`; }
                else if (tagName === 'li') { let indent = ""; let current = el.parentElement; while (current && current !== contentElement) { if (current.tagName.toLowerCase() === 'ul' || current.tagName.toLowerCase() === 'ol') { indent += "  "; } current = current.parentElement; } prefix = `${indent}* `; suffix = "\n"; }
                const links = el.querySelectorAll('a[href^="http"]'); let elementText = el.textContent; links.forEach(link => { if (link.href && link.textContent) { elementText = elementText.replace(link.textContent, `${link.textContent} (${link.href})`); } }); textToCopy += prefix + elementText.trim() + suffix; });
            textToCopy = textToCopy.replace(/\n{3,}/g, '\n\n').trim(); try { await navigator.clipboard.writeText(textToCopy); copyButton.classList.add('success'); copyButton.querySelector('svg').innerHTML = '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>'; setTimeout(() => { copyButton.classList.remove('success'); copyButton.querySelector('svg').innerHTML = '<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>'; }, 2000); } catch (err) { console.error('Failed to copy text: ', err); copyButton.classList.add('error'); setTimeout(() => copyButton.classList.remove('error'), 2000); } }); }
        if (printButton) { printButton.addEventListener('click', () => { window.print(); }); }
    };

    // --- Performance Hints (will-change) ---
    const setupWillChange = () => { /* ... same ... */
        const elements = document.querySelectorAll('.animate-item, .header, .action-button'); elements.forEach(el => { el.style.willChange = 'opacity, transform'; });
    };


    // --- Initialize Everything ---
    setupHamburgerMenu(); // Add hamburger setup
    setupSmoothScrolling();
    setupHeaderScrollEffect();
    setupScrollProgress();
    setupSectionAnimations();
    setupActionButtons();
    setupWillChange();

}); // End DOMContentLoaded
