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

        // Return offsetHeight if available and on desktop, otherwise use CSS variable values
        return header ? (isMobile ? mobileHeaderHeight : header.offsetHeight) : (isMobile ? mobileHeaderHeight : desktopHeaderHeight);
    };


    // --- Hamburger Menu ---
    const setupHamburgerMenu = () => {
        const hamburgerButton = document.getElementById('hamburger-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const body = document.body;

        // Ensure elements exist
        if (!hamburgerButton || !mobileMenu || !body) {
             console.error("Hamburger menu critical elements not found. Menu cannot function.");
             // Optionally disable the button if elements are missing
             if(hamburgerButton) hamburgerButton.disabled = true;
             return;
        }

        hamburgerButton.addEventListener('click', () => {
            // Check current state BEFORE toggling
            const isExpanded = hamburgerButton.getAttribute('aria-expanded') === 'true';

            // Toggle ARIA attribute
            hamburgerButton.setAttribute('aria-expanded', String(!isExpanded));
            // Toggle button visual state
            hamburgerButton.classList.toggle('active');
            // Toggle menu overlay visibility class
            mobileMenu.classList.toggle('open');
            // Toggle body class to prevent scrolling when menu is open
            body.classList.toggle('mobile-menu-open');
            // Toggle ARIA hidden state on menu
            mobileMenu.setAttribute('aria-hidden', String(isExpanded)); // Should be hidden if it *was* expanded

             // Debugging logs (Remove in production)
             // console.log(`Menu toggled. Is open: ${mobileMenu.classList.contains('open')}`);
        });

        // Close menu on link click and scroll
        mobileMenu.querySelectorAll('a.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                // Check if targetId exists and is an internal link
                const targetElement = targetId && targetId.startsWith('#') && targetId.length > 1 ? document.querySelector(targetId) : null;

                // --- Close menu FIRST regardless of link type ---
                // Only proceed if the menu is actually open
                 if (mobileMenu.classList.contains('open')) {
                    hamburgerButton.setAttribute('aria-expanded', 'false');
                    hamburgerButton.classList.remove('active');
                    mobileMenu.classList.remove('open');
                    body.classList.remove('mobile-menu-open');
                    mobileMenu.setAttribute('aria-hidden', 'true');
                } else {
                     // If the menu wasn't open, still allow default link behavior or scrolling if applicable
                     // This prevents breaking normal link clicks if somehow triggered externally
                     // We might still prevent default later if it's a scroll target
                }
                // --- End Menu Closing ---

                // Scroll after menu close animation has time to start
                 if (targetElement) {
                    e.preventDefault(); // Prevent default jump
                    setTimeout(() => {
                        const headerOffset = getHeaderOffset();
                        // Ensure targetElement is still valid (though it should be)
                        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset; // Use pageYOffset for absolute position
                        const offsetPosition = elementPosition - headerOffset - 20; // Buffer

                        window.scrollTo({
                            top: Math.max(0, offsetPosition),
                            behavior: 'smooth'
                        });
                    }, 150); // Slightly longer delay to ensure menu close animation completes
                 } else if (targetId === '#top' || targetId === '#') {
                     // Handle scroll to top link specifically
                     e.preventDefault(); // Prevent adding '#' to URL
                      setTimeout(() => {
                         window.scrollTo({ top: 0, behavior: 'smooth' });
                      }, 150);
                 }
                 // Let external links or non-hash links behave normally (no preventDefault if targetElement is null and not #top/#)
                 else {
                     // console.warn(`Mobile menu scroll target not found or is external link: ${targetId}`);
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
                            // Optional: Update hash in URL without jump after scrolling
                            // setTimeout(() => {
                            //     if (history.pushState) {
                            //         history.pushState(null, null, targetId);
                            //     }
                            // }, 800);

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
             // Get current height dynamically in case of resize/other changes
             const headerHeight = header.offsetHeight;

             // Only apply hide/show on desktop when menu is closed
             if (!document.body.classList.contains('mobile-menu-open') && isDesktop) {
                 const scrollThreshold = 50; // Start hiding slightly after scrolling down

                 if (currentScroll <= scrollThreshold) { // Show header when near top
                     header.classList.remove('scroll-up', 'scroll-down');
                 } else if (currentScroll > lastScroll + 5 && !header.classList.contains('scroll-down')) { // Scrolling Down (added buffer)
                     header.classList.remove('scroll-up');
                     header.classList.add('scroll-down');
                 } else if (currentScroll < lastScroll - 5 && header.classList.contains('scroll-down')) { // Scrolling Up (added buffer)
                     header.classList.remove('scroll-down');
                     header.classList.add('scroll-up');
                 }
             } else { // Ensure header is visible on mobile or when mobile menu is open
                 header.classList.remove('scroll-up', 'scroll-down');
             }
             // Update lastScroll, ensuring it's not negative
             lastScroll = Math.max(0, currentScroll);
         };

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
        const sections = Array.from(document.querySelectorAll('main > section[id]')); // Use Array.from for easier methods
        const navLinks = document.querySelectorAll('.desktop-nav ul li a.nav-link');
        if (!progressBar || sections.length === 0 || navLinks.length === 0) return;

        const updateProgressAndNav = () => {
            requestAnimationFrame(() => { // Ensure updates happen in sync with rendering
                const headerOffset = getHeaderOffset();
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                 // Consider document height relative to viewport height
                const totalScrollable = documentHeight - windowHeight;
                const scrolled = window.scrollY;
                // Ensure progress doesn't exceed 100% if documentHeight is small
                const progress = totalScrollable > 0 ? (scrolled / totalScrollable) * 100 : 0;
                progressBar.style.width = `${Math.min(Math.max(0, progress), 100)}%`; // Clamp progress 0-100

                let currentSectionId = '';
                // Adjust detection point: a bit higher up the screen (e.g., 30% from top)
                const detectionPoint = scrolled + windowHeight * 0.3; // Adjust fraction as needed

                // Find the current section based on detection point
                for (let i = sections.length - 1; i >= 0; i--) {
                    const section = sections[i];
                     // Section top needs to be above the detection point
                    // Use offsetTop which is relative to the offsetParent, usually the body
                    if (section.offsetTop <= detectionPoint) {
                        currentSectionId = section.getAttribute('id');
                        break; // Found the topmost section that fits criteria
                    }
                }

                // If near the very bottom, force highlight last section
                 if (scrolled + windowHeight >= documentHeight - 50) {
                     currentSectionId = sections[sections.length - 1].getAttribute('id');
                 }
                 // If scrolled right to the top, potentially highlight the first section
                 else if (scrolled < sections[0].offsetTop / 2) { // Check if less than half way to the first section
                      currentSectionId = sections[0].getAttribute('id');
                 }


                navLinks.forEach(link => {
                    const isActive = link.getAttribute('href') === `#${currentSectionId}`;
                    link.classList.toggle('active', isActive);
                });
            });
        };

        window.addEventListener('scroll', utility.throttle(updateProgressAndNav, performanceConfig.throttleDelay));
        window.addEventListener('resize', utility.debounce(updateProgressAndNav, performanceConfig.debounceDelay));
        // Initial call with slight delay to ensure layout is stable
        setTimeout(updateProgressAndNav, 50);
     };

    // --- Section & Item Fade-in Animation (with Stagger) ---
    const setupSectionAnimations = () => {
        const sections = document.querySelectorAll('.animate-on-scroll'); if (sections.length === 0) return;
        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = entry.target;
                    section.classList.add('visible'); // Trigger section visibility
                    const itemsToAnimate = section.querySelectorAll('.animate-item');
                    itemsToAnimate.forEach((item, index) => {
                        item.style.setProperty('--animation-delay', `${index * performanceConfig.staggerDelay}ms`);
                        // The animation itself is handled by CSS: .section.visible .animate-item
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
            tooltipTimeoutId = null; // Reset ID
        }

        tooltip.textContent = message;
        tooltip.classList.add('visible'); // Make it visible

        // Set new timeout to hide the tooltip
        tooltipTimeoutId = setTimeout(() => {
            tooltip.classList.remove('visible');
             tooltipTimeoutId = null; // Reset ID after timeout runs
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
                            let text = p.innerHTML.replace(/<strong>(.*?)<\/strong>/g, '$1').replace(/:\s+/g, ': ');
                            textToCopy += text.trim() + '\n';
                         });
                         textToCopy += '\n';
                    }

                     // Generic content extraction (paragraphs, lists, definitions)
                    const contentElements = section.querySelectorAll(
                        '.content > p, .panel > ul > li, .panel > ol > li, .panel dl dt, .panel dl dd, .panel .styled-list > li, .panel .pillar-list > li, .panel .roadmap-details > li'
                        // Including dt and dd directly for risks section
                    );

                     contentElements.forEach(el => {
                         if (el.closest('.placeholder-flowchart')) return; // Skip flowchart placeholder content

                         let text = el.textContent?.trim();
                         if (!text) return;

                         let prefix = '';
                         let suffix = '\n\n'; // Default paragraph spacing

                         // List item indentation and markers
                         if (el.tagName === 'LI') {
                             const listDepth = el.closest('ul, ol')?.closest('ul, ol') ? (el.closest('ul, ol')?.closest('ul, ol')?.closest('ul, ol') ? 3 : 2) : 1; // Basic depth check up to 3 levels
                             const parentList = el.parentElement;

                             prefix = '  '.repeat(listDepth); // Base indentation

                             if (parentList?.classList.contains('styled-list') || parentList?.classList.contains('roadmap-details') || parentList?.classList.contains('pillar-list')) {
                                 prefix += '* '; // Use '*' for custom bullet lists
                                 suffix = '\n';
                             } else if (parentList?.classList.contains('nested-list') || listDepth > 1) {
                                 prefix += '  - '; // Indented bullet for nested lists
                                 suffix = '\n';
                             }
                             else { // Default list item if directly under .panel or .content
                                 prefix = '* ';
                                 suffix = '\n';
                             }

                             // Handle 'Action:' prefixing if present
                             const strongAction = el.querySelector('strong');
                             if(strongAction && strongAction.textContent.includes('Action:')){
                                 text = text.replace('Action:', 'Action:').trim(); // Normalize spacing
                             }
                         }
                         // Definition list formatting
                         else if (el.tagName === 'DT' && el.closest('.risk-list')) {
                            prefix = '';
                            text = text.trim(); // Ensure dt text is clean
                            suffix = '\n'; // Newline after dt
                         }
                          else if (el.tagName === 'DD' && el.closest('.risk-list')) {
                            prefix = '    '; // Indent dd
                            text = text.replace('Mitigation:', 'Mitigation:').trim(); // Normalize spacing
                            suffix = '\n\n'; // Space after dd
                         }
                         // Standard paragraph
                         else if (el.tagName === 'P') {
                             prefix = '';
                             suffix = '\n\n';
                         }
                          // Special case for italicized ROI note (ensure it's only the italic text)
                          if(el.tagName === 'I' || (el.tagName === 'LI' && el.children.length === 1 && el.children[0].tagName === 'I')){
                              // Get only the italic text if it's the sole content
                              if (el.textContent === el.innerText) {
                                 text = `_${text}_`; // Markdown style italic
                                 suffix = '\n\n';
                              }
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
                                 // Find the correct cells for total (might change based on structure)
                                 const labelCell = cells[0]; // Assuming first cell holds label text
                                 const valueCell = cells[cells.length - 1]; // Assuming last cell holds value
                                 if (labelCell && valueCell) {
                                    textToCopy += `${labelCell.textContent.replace(/[:\s]+$/,'').trim()}: ${valueCell.textContent.trim()}\n`;
                                 }

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
         const logo = document.querySelector('.logo'); if(logo) { logo.style.willChange = 'transform'; } // Removed filter from will-change
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
