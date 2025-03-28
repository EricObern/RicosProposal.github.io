
document.addEventListener('DOMContentLoaded', () => {

    // Configuration and Utilities
    const performanceConfig = {
        throttleDelay: 16, // approx 60fps
        debounceDelay: 150,
        observerThreshold: 0.1, // 10% visible
        observerMargin: '0px 0px -50px 0px', // Trigger slightly before fully in view
        staggerDelay: 70, // Slightly faster stagger (Adjust as needed)
        tooltipTimeout: 2000
    };
    const utility = {
        throttle: (func, limit) => { let inThrottle; return function(...args) { const context = this; if (!inThrottle) { func.apply(context, args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } } },
        debounce: (func, wait) => { let timeout; return function executedFunction(...args) { const context = this; const later = () => { clearTimeout(timeout); func.apply(context, args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }
    };

    // --- Helper: Calculate Header Offset ---
    const getHeaderOffset = () => {
        const header = document.querySelector('.header');
        const rootStyle = getComputedStyle(document.documentElement);
        const isMobile = window.innerWidth <= parseInt(rootStyle.getPropertyValue('--mobile-breakpoint').replace('px', ''));
        const mobileHeaderHeight = parseInt(rootStyle.getPropertyValue('--header-height-mobile').replace('px', '')) || 60;
        const desktopHeaderHeight = parseInt(rootStyle.getPropertyValue('--header-height').replace('px', '')) || 70;

        return header ? (isMobile ? mobileHeaderHeight : header.offsetHeight) : (isMobile ? mobileHeaderHeight : desktopHeaderHeight); // Fallback values
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
                const targetId = link.getAttribute('href');
                const targetElement = targetId && targetId !== '#' ? document.querySelector(targetId) : null;

                // Close menu first
                hamburgerButton.setAttribute('aria-expanded', 'false');
                hamburgerButton.classList.remove('active');
                mobileMenu.classList.remove('open');
                body.classList.remove('mobile-menu-open');
                mobileMenu.setAttribute('aria-hidden', 'true');

                // Scroll after menu close animation has time to start
                 if (targetElement) {
                    e.preventDefault();
                    setTimeout(() => {
                        const headerOffset = getHeaderOffset();
                        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset; // Use pageYOffset for absolute position
                        const offsetPosition = elementPosition - headerOffset - 20; // Buffer

                        window.scrollTo({
                            top: Math.max(0, offsetPosition),
                            behavior: 'smooth'
                        });
                    }, 100); // Increased delay slightly for smoother visual transition
                 } else if (targetId === '#top' || !targetId || targetId === '#') {
                     e.preventDefault();
                      setTimeout(() => {
                         window.scrollTo({ top: 0, behavior: 'smooth' });
                      }, 100);
                 } else {
                     console.warn(`Mobile menu scroll target not found: ${targetId}`);
                 }
            });
        });
    };

    // --- Smooth Scrolling (Desktop Nav & Logo Link) ---
    const setupSmoothScrolling = () => {
        // Select desktop nav links and the logo link specifically
        document.querySelectorAll('.desktop-nav a.nav-link[href^="#"], .header-content a[href="#top"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                 const targetId = this.getAttribute('href');

                 // Handle #top link separately
                 if (targetId === '#top') {
                     e.preventDefault();
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                     // Clear hash without jump - optional but clean
                     if (history.pushState) {
                         history.pushState("", document.title, window.location.pathname + window.location.search);
                     }
                     return;
                 }

                 // Handle other internal links
                 if (targetId && targetId.startsWith('#') && targetId.length > 1) {
                    try {
                        const targetElement = document.querySelector(targetId);
                        if (targetElement) {
                            e.preventDefault();
                            const headerOffset = getHeaderOffset();
                            const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset; // Absolute position
                            const offsetPosition = elementPosition - headerOffset - 20; // Buffer

                            window.scrollTo({
                                top: Math.max(0, offsetPosition),
                                behavior: 'smooth'
                            });
                            // Update hash in URL without jump after scrolling (optional)
                            // setTimeout(() => {
                            //     if (history.pushState) {
                            //         history.pushState(null, null, targetId);
                            //     }
                            // }, 800); // Delay to allow scroll to finish

                        } else { console.warn(`Smooth scroll target not found: ${targetId}`); }
                    } catch (error) { console.error(`Error finding smooth scroll target: ${targetId}`, error); }
                 }
            });
        });
    };

    // --- Header Scroll Effect ---
     const setupHeaderScrollEffect = () => {
         const header = document.querySelector('.header'); if (!header) return;
         let lastScroll = 0;
         const mobileBreakpoint = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mobile-breakpoint').replace('px', ''));

         const handleScroll = () => {
             const currentScroll = window.pageYOffset;
             const isDesktop = window.innerWidth > mobileBreakpoint;
             const headerHeight = header.offsetHeight; // Get current height dynamically

             // Only apply hide/show on desktop when menu is closed
             if (!document.body.classList.contains('mobile-menu-open') && isDesktop) {
                 const scrollThreshold = 50; // Start hiding slightly after scrolling down

                 if (currentScroll <= scrollThreshold) { // Show header when near top
                     header.classList.remove('scroll-up', 'scroll-down');
                     return;
                 }
                 // Determine scroll direction
                 if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) { // Scrolling Down
                     header.classList.remove('scroll-up');
                     header.classList.add('scroll-down');
                 } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) { // Scrolling Up
                     header.classList.remove('scroll-down');
                     header.classList.add('scroll-up');
                 }
             } else { // Ensure header is visible on mobile or when mobile menu is open
                 header.classList.remove('scroll-up', 'scroll-down');
             }
             lastScroll = Math.max(0, currentScroll);
         };

         // Debounce resize handler to avoid performance issues
         const debouncedHandleScroll = utility.debounce(handleScroll, 50); // Debounce slightly on resize too
         const handleResize = () => {
            // Re-evaluate header state immediately on resize based on new width
            handleScroll();
         };

         window.addEventListener('scroll', utility.throttle(handleScroll, performanceConfig.throttleDelay));
         window.addEventListener('resize', utility.debounce(handleResize, performanceConfig.debounceDelay));
         handleScroll(); // Initial call to set state
    };

    // --- Progress Bar & Active Nav Link (Desktop Nav) ---
    const setupScrollProgress = () => {
        const progressBar = document.querySelector('.progress-bar');
        const sections = document.querySelectorAll('main > section[id]'); // More specific selector
        const navLinks = document.querySelectorAll('.desktop-nav ul li a.nav-link');
        if (!progressBar || sections.length === 0 || navLinks.length === 0) return;

        const updateProgressAndNav = () => {
            requestAnimationFrame(() => { // Ensure updates happen in sync with rendering
                const headerOffset = getHeaderOffset();
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                const totalScrollable = documentHeight - windowHeight - headerOffset; // Adjust total scrollable height
                const scrolled = window.scrollY;
                const progress = totalScrollable > 0 ? (scrolled / totalScrollable) * 100 : 0;
                progressBar.style.width = `${Math.min(Math.max(0, progress), 100)}%`; // Clamp progress between 0 and 100

                let currentSectionId = '';
                // Adjust detection point: section top edge needs to pass a point slightly below the sticky header
                const detectionPoint = scrolled + headerOffset + 50; // 50px buffer below header

                sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    const sectionBottom = sectionTop + section.offsetHeight;

                    if (detectionPoint >= sectionTop && detectionPoint < sectionBottom) {
                        currentSectionId = section.getAttribute('id');
                    }
                });

                // Fallback if very close to top or bottom
                if (!currentSectionId) {
                     if (scrolled < sections[0].offsetTop - headerOffset - 50) {
                         // Before the first section, highlight the first link if scrolled near top
                          currentSectionId = scrolled < 100 ? sections[0].getAttribute('id') : '';
                     } else if (scrolled + windowHeight >= documentHeight - 100) {
                         // Near the bottom, highlight the last link
                         currentSectionId = sections[sections.length - 1].getAttribute('id');
                     }
                }


                navLinks.forEach(link => {
                    const isActive = link.getAttribute('href') === `#${currentSectionId}`;
                    link.classList.toggle('active', isActive);
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
                    section.classList.add('visible'); // Trigger section visibility for potential container animations
                    const itemsToAnimate = section.querySelectorAll('.animate-item');
                    itemsToAnimate.forEach((item, index) => {
                        // Apply stagger delay using CSS custom property
                        item.style.setProperty('--animation-delay', `${index * performanceConfig.staggerDelay}ms`);
                        // Add 'visible' class to items for animation (already done via CSS rule .section.visible .animate-item)
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
     let tooltipTimeoutId = null; // Store timeout ID globally within this scope
     const showTooltip = (button, message) => {
        const tooltip = button.querySelector('.tooltip-message');
        if (!tooltip) return;

        // Clear any existing timeout to prevent multiple tooltips or premature hiding
        if (tooltipTimeoutId) {
            clearTimeout(tooltipTimeoutId);
        }

        tooltip.textContent = message;
        tooltip.classList.add('visible'); // Make it visible

        // Set new timeout to hide the tooltip
        tooltipTimeoutId = setTimeout(() => {
            tooltip.classList.remove('visible');
            // Optional: Clear text after hiding animation (if needed, match CSS transition duration)
            // setTimeout(() => { if (tooltip) tooltip.textContent = ''; }, 300);
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

                // --- Refined Text Generation for Copy ---
                let textToCopy = '';
                const sections = mainContent.querySelectorAll('.section');

                sections.forEach((section, sectionIndex) => {
                    const titleElement = section.querySelector('h1, h2'); // Main section titles
                    const sectionIdentifier = section.querySelector('h3.section-identifier'); // Exec Summary specific

                    if (titleElement) {
                        textToCopy += `${titleElement.textContent.trim()}\n`;
                        textToCopy += '='.repeat(titleElement.textContent.trim().length) + '\n\n'; // Use '=' for main titles
                    }
                    if (sectionIdentifier) {
                        textToCopy += `${sectionIdentifier.textContent.trim()}\n`;
                         textToCopy += '-'.repeat(sectionIdentifier.textContent.trim().length) + '\n\n'; // Use '-' for sub-section titles
                    }

                    const metaInfoPanel = section.querySelector('.panel-meta');
                    if (metaInfoPanel) {
                         metaInfoPanel.querySelectorAll('p').forEach(p => {
                            // Clean up the strong tags and spacing
                            let text = p.innerHTML.replace(/<strong>(.*?)<\/strong>/g, '$1').replace(/:\s+/g, ': ');
                            textToCopy += text.trim() + '\n';
                         });
                         textToCopy += '\n';
                    }

                     // Generic content extraction (paragraphs, lists, definitions)
                    const contentElements = section.querySelectorAll(
                        // Select elements within panels or direct content divs, excluding flowchart placeholder
                        '.content > p, .panel > ul > li, .panel > ol > li, .panel > dl > div, .panel .styled-list > li, .panel .pillar-list > li, .panel .roadmap-details > li'
                    );

                     contentElements.forEach(el => {
                         if (el.closest('.placeholder-flowchart')) return; // Skip flowchart placeholder content

                         let text = el.textContent?.trim();
                         if (!text) return;

                         let prefix = '';
                         let suffix = '\n\n'; // Default paragraph spacing

                         // List item indentation and markers
                         if (el.tagName === 'LI') {
                             const listDepth = el.closest('ul, ol')?.closest('ul, ol') ? 2 : 1; // Simple depth check
                             const parentList = el.parentElement;

                             if (parentList?.classList.contains('styled-list')) {
                                 prefix = '  '.repeat(listDepth) + '* '; // Use '*' for styled lists
                                 suffix = '\n';
                             } else if (parentList?.classList.contains('pillar-list')) {
                                 prefix = '  - '; // Use '-' for pillar list
                                 suffix = '\n';
                             } else if (parentList?.classList.contains('roadmap-details')) {
                                 // Get the actual number for ordered lists
                                 const itemIndex = Array.from(parentList.children).indexOf(el) + 1;
                                 prefix = '  '.repeat(listDepth) + `${itemIndex}. `;
                                 suffix = '\n';
                             } else if (parentList?.classList.contains('nested-list') || listDepth > 1) {
                                 prefix = '  '.repeat(listDepth) + '  - '; // Indented bullet for nested lists
                                 suffix = '\n';
                             }
                             else { // Default list item
                                 prefix = '  - ';
                                 suffix = '\n';
                             }

                             // Handle 'Action:' prefixing if present
                             const strongAction = el.querySelector('strong');
                             if(strongAction && strongAction.textContent.includes('Action:')){
                                 // Text already contains it, maybe just ensure proper spacing?
                                 text = text.replace('Action:', 'Action:').trim(); // Normalize spacing
                             }
                         }
                         // Definition list formatting
                         else if (el.tagName === 'DIV' && el.closest('.risk-list')) {
                            const dt = el.querySelector('dt');
                            const dd = el.querySelector('dd');
                            if (dt && dd) {
                                text = `${dt.textContent.trim()}\n    ${dd.textContent.replace('Mitigation:', 'Mitigation:').trim()}`; // Indent mitigation
                                prefix = '';
                                suffix = '\n\n';
                            } else {
                                text = ''; // Don't add if dt/dd missing
                            }
                         }
                         // Standard paragraph
                         else if (el.tagName === 'P') {
                             prefix = '';
                             suffix = '\n\n';
                         }
                          // Special case for italicized ROI note
                          if(el.tagName === 'I' || (el.tagName === 'LI' && el.children.length === 1 && el.children[0].tagName === 'I')){
                              text = `_${text}_`; // Markdown style italic
                              suffix = '\n\n';
                          }

                         if (text) { textToCopy += prefix + text + suffix; }
                     });

                      // Table Data
                     const table = section.querySelector('.tech-stack-table');
                     if (table) {
                         textToCopy += "--- Technology Stack ---\n";
                         table.querySelectorAll('tbody tr').forEach(row => {
                             const cells = row.querySelectorAll('td');
                             if (row.classList.contains('total-row')) {
                                 if (cells.length >= 2) textToCopy += `${cells[0].textContent.trim()} ${cells[1].textContent.trim()}\n`;
                             } else if (cells.length >= 4) {
                                 const tool = cells[0].textContent.trim();
                                 const role = cells[1].textContent.trim();
                                 const cost = cells[3].textContent.trim();
                                 textToCopy += `  • ${tool} (${role}): ${cost}\n`;
                             }
                         });
                         textToCopy += "\n";
                     }

                    // Add section separator unless it's the last section
                    if (sectionIndex < sections.length - 1) {
                       textToCopy += '\n----------------------------------------\n\n';
                    }
                });


                try {
                    // Final cleanup of excessive newlines
                    const cleanedText = textToCopy.replace(/\n{3,}/g, '\n\n').trim();
                    await navigator.clipboard.writeText(cleanedText);
                    showTooltip(copyButton, 'Copied!');
                    copyButton.classList.add('success');
                    // Use tooltip timeout duration for removing class
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

    // --- Performance Hints (will-change) - Re-evaluated ---
    const setupWillChange = () => {
         // Apply strategically to elements undergoing frequent transform/opacity changes
         document.querySelectorAll('.animate-item').forEach(el => { el.style.willChange = 'opacity, transform'; });
         document.querySelectorAll('.action-button, .panel.interactive-element, .pillar-list li.interactive-element').forEach(el => { el.style.willChange = 'transform, box-shadow'; });
         const header = document.querySelector('.header'); if (header) { header.style.willChange = 'transform, background-color'; }
         const progressBar = document.querySelector('.progress-bar'); if(progressBar) { progressBar.style.willChange = 'width'; }
         document.querySelectorAll('.timeline-dot').forEach(el => { el.style.willChange = 'transform, box-shadow'; });
         const logo = document.querySelector('.logo'); if(logo) { logo.style.willChange = 'transform, filter'; }
     };

    // --- Initialize Everything ---
    setupHamburgerMenu();
    setupSmoothScrolling();
    setupHeaderScrollEffect();
    setupScrollProgress();
    setupSectionAnimations();
    setupActionButtons();
    setupWillChange(); // Apply performance hints

}); // End DOMContentLoaded
