document.addEventListener('DOMContentLoaded', () => {

    const performanceConfig = { throttleDelay: 16, debounceDelay: 150, observerThreshold: 0.1, observerMargin: '0px 0px -50px 0px', staggerDelay: 100, tooltipTimeout: 2000 }; // Added tooltip timeout
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
            mobileMenu.setAttribute('aria-hidden', String(isExpanded));
        });

        // Close menu when a link is clicked AND handle scrolling
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                // 1. Close the menu visually
                hamburgerButton.setAttribute('aria-expanded', 'false');
                hamburgerButton.classList.remove('active');
                mobileMenu.classList.remove('open');
                body.classList.remove('mobile-menu-open');
                mobileMenu.setAttribute('aria-hidden', 'true');

                // 2. Manually handle scrolling after menu closes
                const targetId = link.getAttribute('href');
                try {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        e.preventDefault();
                        const header = document.querySelector('.header');
                        // Use mobile fixed height for offset calculation on mobile
                        const headerOffset = header ? parseFloat(getComputedStyle(header).height) : 60;
                        // Calculate position relative to viewport top, add current scroll, subtract header height and buffer
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = window.pageYOffset + elementPosition - headerOffset - 20; // 20px buffer

                        setTimeout(() => {
                            window.scrollTo({
                                top: Math.max(0, offsetPosition), // Ensure not scrolling to negative value
                                behavior: 'smooth'
                            });
                        }, 50);
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
                 try {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        const header = document.querySelector('.header');
                        const headerOffset = header ? parseFloat(getComputedStyle(header).height) : 70;
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = window.pageYOffset + elementPosition - headerOffset - 20;
                        window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' });
                    } else { console.warn(`Smooth scroll target not found: ${targetId}`); }
                } catch (error) { console.error(`Error finding smooth scroll target: ${targetId}`, error); }
            });
        });
    };

    // --- Header Scroll Effect ---
     const setupHeaderScrollEffect = () => {
         const header = document.querySelector('.header'); if (!header) return; let lastScroll = 0; let headerHeight = header.offsetHeight;
         const handleScroll = () => { const currentScroll = window.pageYOffset;
            // Apply effect ONLY if mobile menu is NOT open AND screen is wider than mobile breakpoint
            if (!document.body.classList.contains('mobile-menu-open') && window.innerWidth > performanceConfig.mobileBreakpoint) { // Use variable
                const scrollThreshold = headerHeight * 0.8; if (currentScroll <= scrollThreshold) { header.classList.remove('scroll-up', 'scroll-down'); return; } if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) { header.classList.remove('scroll-up'); header.classList.add('scroll-down'); } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) { header.classList.remove('scroll-down'); header.classList.add('scroll-up'); }
            } else { header.classList.remove('scroll-up', 'scroll-down'); } // Ensure visible on mobile or when menu open
            lastScroll = Math.max(0, currentScroll); };
         const handleResize = () => { headerHeight = header.offsetHeight; };
         window.addEventListener('scroll', utility.throttle(handleScroll, performanceConfig.throttleDelay)); window.addEventListener('resize', utility.debounce(handleResize, performanceConfig.debounceDelay)); handleResize();
    };

    // --- Progress Bar & Active Nav Link (Desktop Nav) ---
    const setupScrollProgress = () => {
        const progressBar = document.querySelector('.progress-bar'); const sections = document.querySelectorAll('.section'); const navLinks = document.querySelectorAll('.desktop-nav ul li a'); const header = document.querySelector('.header'); if (!progressBar || sections.length === 0 || navLinks.length === 0) return;
        const updateProgressAndNav = () => { const headerHeight = header ? parseFloat(getComputedStyle(header).height) : 70; requestAnimationFrame(() => { const windowHeight = window.innerHeight; const documentHeight = document.documentElement.scrollHeight; const totalScrollable = documentHeight - windowHeight; const scrolled = window.scrollY; const progress = totalScrollable > 0 ? (scrolled / totalScrollable) * 100 : 0; progressBar.style.width = `${Math.min(progress, 100)}%`; let currentSectionId = ''; const scrollMidPoint = scrolled + windowHeight * 0.5; sections.forEach(section => { const sectionTop = section.offsetTop - headerHeight - 30; /* Adjusted offset slightly */ const sectionBottom = sectionTop + section.offsetHeight; if (scrollMidPoint >= sectionTop && scrollMidPoint < sectionBottom) { currentSectionId = section.getAttribute('id'); } }); if (!currentSectionId) { let minDistanceAbove = Infinity; let closestSectionAbove = null; sections.forEach(section => { const sectionTop = section.offsetTop - headerHeight - 50; if (scrolled >= sectionTop) { const distance = scrolled - sectionTop; if (distance < minDistanceAbove) { minDistanceAbove = distance; closestSectionAbove = section.getAttribute('id'); } } }); currentSectionId = closestSectionAbove; } if (!currentSectionId && scrolled < sections[0]?.offsetTop) { currentSectionId = sections[0]?.getAttribute('id'); } navLinks.forEach(link => { link.classList.remove('active'); if (link.getAttribute('href') === `#${currentSectionId}`) { link.classList.add('active'); } }); }); };
        window.addEventListener('scroll', utility.throttle(updateProgressAndNav, performanceConfig.throttleDelay)); window.addEventListener('resize', utility.debounce(updateProgressAndNav, performanceConfig.debounceDelay)); updateProgressAndNav();
     };

    // --- Section & Item Fade-in Animation (with Stagger) ---
    const setupSectionAnimations = () => {
        const sections = document.querySelectorAll('.animate-on-scroll'); if (sections.length === 0) return; const observerCallback = (entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { const section = entry.target; section.classList.add('visible'); const itemsToAnimate = section.querySelectorAll('.animate-item'); itemsToAnimate.forEach((item, index) => { item.style.setProperty('--animation-delay', `${index * performanceConfig.staggerDelay}ms`); }); observer.unobserve(section); } }); }; const observer = new IntersectionObserver(observerCallback, { threshold: performanceConfig.observerThreshold, rootMargin: performanceConfig.observerMargin }); sections.forEach(section => { observer.observe(section); });
     };

     // --- Show Tooltip ---
     const showTooltip = (button, message) => {
        const tooltip = button.querySelector('.tooltip-message');
        if (!tooltip) return;
        tooltip.textContent = message;
        tooltip.classList.add('visible');
        // Hide after delay
        setTimeout(() => {
            tooltip.classList.remove('visible');
            tooltip.textContent = ''; // Clear text after hiding
        }, performanceConfig.tooltipTimeout);
    };

    // --- Action Buttons (Copy/Print) ---
    const setupActionButtons = () => {
        const copyButton = document.getElementById('copy-button');
        const printButton = document.getElementById('print-button');

        if (copyButton) {
            copyButton.addEventListener('click', async () => {
                const mainContent = document.querySelector('main.main-content');
                if (!mainContent) {
                    showTooltip(copyButton, 'Error: Content not found');
                    return;
                }

                // Attempt to generate a clean text representation
                let textToCopy = '';
                const sections = mainContent.querySelectorAll('.section');
                sections.forEach((section, secIndex) => {
                    const title = section.querySelector('h1, h2, h3.section-identifier');
                    if (title) {
                        textToCopy += `${title.textContent.trim()}\n\n`;
                    }
                    // Add paragraphs, list items, dt/dd, flowchart steps etc.
                    const contentElements = section.querySelectorAll('p, li, dt, dd, .flowchart-step span'); // Add table cells later if needed
                     contentElements.forEach(el => {
                        // Skip elements within flowchart unless it's the main span text
                        if (el.closest('.flowchart-container') && el.tagName !== 'SPAN') return;
                        if (el.tagName === 'SPAN' && !el.closest('.flowchart-step')) return; // Skip other random spans

                        let text = el.textContent?.trim();
                        if(text) {
                            // Basic list indentation approximation
                            if (el.tagName === 'LI') {
                                const level = el.closest('ul, ol') ? (el.closest('ul ul, ol ol') ? '    - ' : '  - ') : '';
                                textToCopy += level + text + '\n';
                            } else if (el.tagName === 'DT') {
                                textToCopy += text + ': '; // Keep on same line as dd
                            } else if (el.tagName === 'DD') {
                                textToCopy += text + '\n\n'; // Add extra newline after dd
                            } else if (el.tagName === 'SPAN' && el.closest('.flowchart-step')) {
                                // Add visual indicator for flowchart steps
                                const stepEl = el.closest('.flowchart-step');
                                let prefix = '[Step]';
                                if (stepEl.classList.contains('step-start')) prefix = '[Start]';
                                else if (stepEl.classList.contains('step-decision')) prefix = '[Decision]';
                                else if (stepEl.classList.contains('step-manual')) prefix = '[Manual]';
                                else if (stepEl.classList.contains('step-stop')) prefix = '[Stop]';
                                // Add logic for decision paths if needed, maybe parsing the "(Yes)"/"(No)" text
                                textToCopy += `${prefix} ${text}\n`;
                            }
                            else if (el.tagName === 'P') { // Treat paragraphs normally
                                textToCopy += text + '\n\n'; // Double newline for paragraphs
                            }
                        }
                    });
                     // Add table data (simple version)
                     const table = section.querySelector('.tech-stack-table');
                     if (table) {
                         textToCopy += "--- Tech Stack ---\n";
                         table.querySelectorAll('tbody tr').forEach(row => {
                             const cells = row.querySelectorAll('td');
                             if (cells.length >= 4) {
                                 // Use data-label for context if available (for mobile view copy)
                                 const tool = cells[0].textContent.trim();
                                 const role = cells[1].textContent.trim();
                                 const cost = cells[3].textContent.trim();
                                 textToCopy += `${tool} (${role}): ${cost}\n`;
                             } else if (row.classList.contains('total-row')) {
                                  // Handle total row specifically
                                 const totalLabel = cells[0].textContent.trim();
                                 const totalValue = cells[1].textContent.trim();
                                 textToCopy += `${totalLabel} ${totalValue}\n`;
                             }
                         });
                         textToCopy += "\n";
                     }

                    // Add separator only if content was added for the section
                    if (textToCopy.length > 0 && !textToCopy.endsWith('--------------------\n\n')) {
                        textToCopy += '--------------------\n\n';
                    }
                });


                try {
                    // Clean up excessive newlines before copying
                    await navigator.clipboard.writeText(textToCopy.replace(/\n{3,}/g, '\n\n').trim());
                    showTooltip(copyButton, 'Copied!');
                    copyButton.classList.add('success');
                    setTimeout(() => copyButton.classList.remove('success'), performanceConfig.tooltipTimeout + 100);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    showTooltip(copyButton, 'Copy Failed!');
                    copyButton.classList.add('error');
                    setTimeout(() => copyButton.classList.remove('error'), performanceConfig.tooltipTimeout + 100);
                }
            });
        }

        if (printButton) {
            printButton.addEventListener('click', () => {
                window.print();
            });
        }
     };

    // --- Performance Hints (will-change) ---
    const setupWillChange = () => {
         const elements = document.querySelectorAll('.animate-item, .header, .action-button');
         elements.forEach(el => { el.style.willChange = 'opacity, transform'; });
         // Add will-change for header background/transform during scroll
         const header = document.querySelector('.header');
         if (header) { header.style.willChange = 'transform, background-color'; }
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
