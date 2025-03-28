document.addEventListener('DOMContentLoaded', () => {

    // Configuration and Utilities
    const performanceConfig = {
        throttleDelay: 16, // approx 60fps
        debounceDelay: 150,
        observerThreshold: 0.1, // 10% visible
        observerMargin: '0px 0px -50px 0px', // Trigger slightly before fully in view
        staggerDelay: 80, // Slightly faster stagger
        tooltipTimeout: 2000
    };
    const utility = {
        throttle: (func, limit) => { let inThrottle; return function(...args) { const context = this; if (!inThrottle) { func.apply(context, args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } } },
        debounce: (func, wait) => { let timeout; return function executedFunction(...args) { const context = this; const later = () => { clearTimeout(timeout); func.apply(context, args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }
    };

    // --- Helper: Calculate Header Offset ---
    const getHeaderOffset = () => {
        const header = document.querySelector('.header');
        // Use fixed height for mobile calculation, offsetHeight otherwise
        const isMobile = window.innerWidth <= parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mobile-breakpoint').replace('px', ''));
        return header ? (isMobile ? 60 : header.offsetHeight) : (isMobile ? 60 : 70); // Fallback values
    };

    // --- Hamburger Menu ---
    const setupHamburgerMenu = () => {
        const hamburgerButton = document.getElementById('hamburger-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const body = document.body;

        if (!hamburgerButton || !mobileMenu) { console.warn("Hamburger menu elements not found."); return; }

        hamburgerButton.addEventListener('click', () => {
            const isExpanded = hamburgerButton.getAttribute('aria-expanded') === 'true';
            hamburgerButton.setAttribute('aria-expanded', String(!isExpanded));
            hamburgerButton.classList.toggle('active');
            mobileMenu.classList.toggle('open');
            body.classList.toggle('mobile-menu-open');
            mobileMenu.setAttribute('aria-hidden', String(isExpanded));
        });

        // Close menu on link click and scroll
        mobileMenu.querySelectorAll('a.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                hamburgerButton.setAttribute('aria-expanded', 'false');
                hamburgerButton.classList.remove('active');
                mobileMenu.classList.remove('open');
                body.classList.remove('mobile-menu-open');
                mobileMenu.setAttribute('aria-hidden', 'true');

                const targetId = link.getAttribute('href');
                try {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        e.preventDefault();
                        const headerOffset = getHeaderOffset();
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = window.pageYOffset + elementPosition - headerOffset - 20; // Buffer

                        setTimeout(() => {
                            window.scrollTo({
                                top: Math.max(0, offsetPosition),
                                behavior: 'smooth'
                            });
                        }, 50); // Allow menu close animation
                    } else { console.warn(`Mobile menu scroll target not found: ${targetId}`); }
                } catch (error) { console.error(`Error finding mobile menu scroll target: ${targetId}`, error); }
            });
        });
    };

    // --- Smooth Scrolling (Desktop Nav & Logo Link) ---
    const setupSmoothScrolling = () => {
        // Select desktop nav links and the logo link
        document.querySelectorAll('.desktop-nav a.nav-link[href^="#"], a[href="#top"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                 e.preventDefault();
                 const targetId = this.getAttribute('href');
                 try {
                    // Handle #top link separately
                    if (targetId === '#top') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        // Optionally clear hash, but maybe not needed as it's #top
                        // history.pushState("", document.title, window.location.pathname + window.location.search);
                        return;
                    }

                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        const headerOffset = getHeaderOffset();
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = window.pageYOffset + elementPosition - headerOffset - 20; // Buffer
                        window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' });
                        // Update hash in URL without jump for better navigation feel
                        // if (history.pushState) {
                        //     history.pushState(null, null, targetId);
                        // } else {
                        //     location.hash = targetId; // Fallback
                        // }
                    } else { console.warn(`Smooth scroll target not found: ${targetId}`); }
                } catch (error) { console.error(`Error finding smooth scroll target: ${targetId}`, error); }
            });
        });
    };

    // --- Header Scroll Effect ---
     const setupHeaderScrollEffect = () => {
         const header = document.querySelector('.header'); if (!header) return;
         let lastScroll = 0;
         let headerHeight = header.offsetHeight; // Initial height
         const mobileBreakpoint = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mobile-breakpoint').replace('px', ''));

         const handleScroll = () => {
             const currentScroll = window.pageYOffset;
             // Check screen width dynamically inside handler
             const isDesktop = window.innerWidth > mobileBreakpoint;

             if (!document.body.classList.contains('mobile-menu-open') && isDesktop) {
                 const scrollThreshold = headerHeight * 0.5; // Trigger earlier
                 if (currentScroll <= scrollThreshold) {
                     header.classList.remove('scroll-up', 'scroll-down');
                     return;
                 }
                 if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
                     header.classList.remove('scroll-up');
                     header.classList.add('scroll-down');
                 } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
                     header.classList.remove('scroll-down');
                     header.classList.add('scroll-up');
                 }
             } else { // Ensure visible on mobile or when menu open
                 header.classList.remove('scroll-up', 'scroll-down');
             }
             lastScroll = Math.max(0, currentScroll);
         };

         const handleResize = () => {
             headerHeight = header.offsetHeight; // Update height on resize
             // Re-evaluate header state immediately on resize
             handleScroll();
         };

         window.addEventListener('scroll', utility.throttle(handleScroll, performanceConfig.throttleDelay));
         window.addEventListener('resize', utility.debounce(handleResize, performanceConfig.debounceDelay));
         handleResize(); // Initial call
    };

    // --- Progress Bar & Active Nav Link (Desktop Nav) ---
    const setupScrollProgress = () => {
        const progressBar = document.querySelector('.progress-bar');
        const sections = document.querySelectorAll('.section');
        const navLinks = document.querySelectorAll('.desktop-nav ul li a.nav-link');
        if (!progressBar || sections.length === 0 || navLinks.length === 0) return;

        const updateProgressAndNav = () => {
            const headerOffset = getHeaderOffset();
            requestAnimationFrame(() => {
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                const totalScrollable = documentHeight - windowHeight;
                const scrolled = window.scrollY;
                const progress = totalScrollable > 0 ? (scrolled / totalScrollable) * 100 : 0;
                progressBar.style.width = `${Math.min(progress, 100)}%`;

                let currentSectionId = '';
                const scrollMidPoint = scrolled + windowHeight * 0.4; // Adjusted detection point

                sections.forEach(section => {
                    // Add header offset and a small buffer for earlier activation
                    const sectionTop = section.offsetTop - headerOffset - 50;
                    const sectionBottom = sectionTop + section.offsetHeight;
                    if (scrollMidPoint >= sectionTop && scrollMidPoint < sectionBottom) {
                        currentSectionId = section.getAttribute('id');
                    }
                });

                // Fallback if no section is detected in the middle (e.g., at the very top/bottom)
                if (!currentSectionId) {
                    let minDistance = Infinity;
                    sections.forEach(section => {
                        const distance = Math.abs((section.offsetTop - headerOffset) - scrolled);
                        if (distance < minDistance) {
                            minDistance = distance;
                            currentSectionId = section.getAttribute('id');
                        }
                    });
                }

                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentSectionId}`) {
                        link.classList.add('active');
                    }
                });
            });
        };

        window.addEventListener('scroll', utility.throttle(updateProgressAndNav, performanceConfig.throttleDelay));
        window.addEventListener('resize', utility.debounce(updateProgressAndNav, performanceConfig.debounceDelay));
        updateProgressAndNav(); // Initial call
     };

    // --- Section & Item Fade-in Animation (with Stagger) ---
    const setupSectionAnimations = () => {
        const sections = document.querySelectorAll('.animate-on-scroll'); if (sections.length === 0) return;
        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = entry.target;
                    section.classList.add('visible');
                    const itemsToAnimate = section.querySelectorAll('.animate-item');
                    itemsToAnimate.forEach((item, index) => {
                        // Apply stagger delay directly
                        item.style.setProperty('--animation-delay', `${index * performanceConfig.staggerDelay}ms`);
                    });
                    observer.unobserve(section); // Stop observing once visible
                }
            });
        };
        const observer = new IntersectionObserver(observerCallback, {
            threshold: performanceConfig.observerThreshold,
            rootMargin: performanceConfig.observerMargin
        });
        sections.forEach(section => { observer.observe(section); });
     };

     // --- Show Tooltip ---
     let tooltipTimeoutId = null; // Store timeout ID
     const showTooltip = (button, message) => {
        const tooltip = button.querySelector('.tooltip-message');
        if (!tooltip) return;

        // Clear any existing timeout
        if (tooltipTimeoutId) {
            clearTimeout(tooltipTimeoutId);
        }

        tooltip.textContent = message;
        tooltip.classList.add('visible');

        // Set new timeout to hide
        tooltipTimeoutId = setTimeout(() => {
            tooltip.classList.remove('visible');
            // Optionally clear text after animation finishes if needed
            // setTimeout(() => tooltip.textContent = '', 300); // Match CSS transition
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
                    copyButton.classList.add('error');
                    setTimeout(() => copyButton.classList.remove('error'), performanceConfig.tooltipTimeout + 100);
                    return;
                }

                // Generate Text Representation
                let textToCopy = '';
                const sections = mainContent.querySelectorAll('.section');
                sections.forEach((section) => {
                    const titleElement = section.querySelector('h1, h2, h3.section-identifier');
                    if (titleElement) {
                        textToCopy += `${titleElement.textContent.trim()}\n`;
                        textToCopy += '-'.repeat(titleElement.textContent.trim().length) + '\n\n'; // Underline
                    }

                    const metaInfo = section.querySelector('.meta-info');
                    if (metaInfo) {
                         metaInfo.querySelectorAll('p').forEach(p => {
                            textToCopy += p.textContent.replace(/:\s+/g, ': ').trim() + '\n';
                         });
                         textToCopy += '\n';
                    }

                    const contentElements = section.querySelectorAll(
                        '.content > p, .content ul > li, .content ol > li, .content dl > div, .flowchart-step span, .timeline-content h3, .timeline-content li'
                    );

                    contentElements.forEach(el => {
                        // Skip elements within flowchart unless it's the main span text
                        if (el.closest('.flowchart-container') && el.tagName !== 'SPAN') return;
                        if (el.tagName === 'SPAN' && !el.closest('.flowchart-step')) return;

                        let text = el.textContent?.trim();
                        if (!text) return; // Skip empty elements

                        let prefix = '';
                        let suffix = '\n\n'; // Default suffix

                        // Determine hierarchy/type for prefixing/indentation
                        if (el.closest('.pillar-list > li')) { prefix = '  • '; suffix = '\n'; }
                        else if (el.closest('.styled-list > li')) { prefix = '  - '; suffix = '\n'; }
                        else if (el.closest('.nested-list > li')) { prefix = '    ▪ '; suffix = '\n'; }
                        else if (el.tagName === 'DT') { prefix = '  '; text += ': '; suffix = ''; } // Keep dt and dd together
                        else if (el.tagName === 'DD') { prefix = '    '; suffix = '\n\n'; } // Indent dd and add space after
                        else if (el.closest('.timeline-content')) {
                            if (el.tagName === 'H3') { prefix = '\n## '; suffix = '\n'; }
                            else if (el.tagName === 'LI') { prefix = '    - '; suffix = '\n'; }
                        }
                         else if (el.tagName === 'SPAN' && el.closest('.flowchart-step')) {
                            const stepEl = el.closest('.flowchart-step');
                            if (stepEl.classList.contains('step-start')) prefix = '[START] ';
                            else if (stepEl.classList.contains('step-decision')) prefix = '[DECISION] ';
                            else if (stepEl.classList.contains('step-manual')) prefix = '[MANUAL] ';
                            else if (stepEl.classList.contains('step-stop')) prefix = '[STOP] ';
                            else prefix = '[AUTO] ';
                            suffix = '\n'; // Single newline for flowchart steps
                        }
                        else if (el.tagName === 'P' && el.closest('.conclusion-box')) { suffix = '\n\n'; } // Paragraphs in conclusion
                        else if (el.tagName === 'P') { suffix = '\n\n'; } // Standard paragraph

                        // Special handling for specific lists like channels
                        if (el.closest('.channel-list > li')) { prefix = '    #'; suffix = '\n'; text = text.replace(/^#/, ''); } // Remove existing #

                        textToCopy += prefix + text + suffix;
                    });

                     // Table Data
                     const table = section.querySelector('.tech-stack-table');
                     if (table) {
                         textToCopy += "--- Tech Stack ---\n";
                         table.querySelectorAll('tbody tr').forEach(row => {
                             const cells = row.querySelectorAll('td');
                             if (row.classList.contains('total-row')) {
                                 if (cells.length >= 2) textToCopy += `${cells[0].textContent.trim()} ${cells[1].textContent.trim()}\n`;
                             } else if (cells.length >= 4) {
                                 textToCopy += `  • ${cells[0].textContent.trim()} (${cells[1].textContent.trim()}): ${cells[3].textContent.trim()}\n`;
                             }
                         });
                         textToCopy += "\n";
                     }

                    // Add section separator if content was added
                    if (!textToCopy.endsWith('\n\n') && !textToCopy.endsWith('\n') && sections.length > 1) {
                         textToCopy += '\n';
                    }
                     if (sections.length > 1) {
                         textToCopy += '----------------------------------------\n\n';
                     }
                });

                try {
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
         // Apply strategically
         document.querySelectorAll('.animate-item').forEach(el => { el.style.willChange = 'opacity, transform'; });
         document.querySelectorAll('.action-button, .logo, .interactive-element').forEach(el => { el.style.willChange = 'transform'; }); // Only transform
         const header = document.querySelector('.header'); if (header) { header.style.willChange = 'transform, background-color'; }
         const progressBar = document.querySelector('.progress-bar'); if(progressBar) { progressBar.style.willChange = 'width'; }
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
