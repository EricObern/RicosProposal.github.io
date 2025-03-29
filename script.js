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

        return header ? (isMobile ? mobileHeaderHeight : header.offsetHeight) : (isMobile ? mobileHeaderHeight : desktopHeaderHeight);
    };


    // --- Hamburger Menu ---
    const setupHamburgerMenu = () => {
        const hamburgerButton = document.getElementById('hamburger-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuCloseButton = document.getElementById('mobile-menu-close-button'); // Get close button
        const body = document.body;

        if (!hamburgerButton || !mobileMenu || !mobileMenuCloseButton || !body) {
             console.error("Hamburger menu critical elements not found.");
             if(hamburgerButton) hamburgerButton.disabled = true;
             return;
        }

        const closeMobileMenu = () => {
            // Only run if menu is actually open
             if (mobileMenu.classList.contains('open')) {
                hamburgerButton.setAttribute('aria-expanded', 'false');
                hamburgerButton.classList.remove('active');
                mobileMenu.classList.remove('open');
                body.classList.remove('mobile-menu-open');
                mobileMenu.setAttribute('aria-hidden', 'true');
                // console.log("Mobile menu closed."); // Debugging
            }
        };

        const openMobileMenu = () => {
             if (!mobileMenu.classList.contains('open')) {
                hamburgerButton.setAttribute('aria-expanded', 'true');
                hamburgerButton.classList.add('active');
                mobileMenu.classList.add('open');
                body.classList.add('mobile-menu-open');
                mobileMenu.setAttribute('aria-hidden', 'false');
                // console.log("Mobile menu opened."); // Debugging
            }
        };

        hamburgerButton.addEventListener('click', () => {
            // Toggle based on current state
            if (mobileMenu.classList.contains('open')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });

        // Add event listener for the explicit close button
        mobileMenuCloseButton.addEventListener('click', closeMobileMenu);

        // Close menu on nav link click
        mobileMenu.querySelectorAll('a.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                const targetElement = targetId && targetId.startsWith('#') && targetId.length > 1 ? document.querySelector(targetId) : null;

                // Close menu first
                closeMobileMenu();

                // Scroll after menu close animation
                 if (targetElement) {
                    e.preventDefault();
                    setTimeout(() => {
                        const headerOffset = getHeaderOffset();
                        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                        const offsetPosition = elementPosition - headerOffset - 20;

                        window.scrollTo({
                            top: Math.max(0, offsetPosition),
                            behavior: 'smooth'
                        });
                    }, 150); // Allow time for menu close
                 } else if (targetId === '#top' || targetId === '#') {
                     e.preventDefault();
                      setTimeout(() => {
                         window.scrollTo({ top: 0, behavior: 'smooth' });
                      }, 150);
                 }
                 // Allow default behavior for external links
            });
        });
    };

    // --- Smooth Scrolling (Desktop Nav & Logo Link) ---
    const setupSmoothScrolling = () => {
        document.querySelectorAll('.desktop-nav a.nav-link[href^="#"], .header-content a[href="#top"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                 const targetId = this.getAttribute('href');

                 if (targetId === '#top') {
                     e.preventDefault();
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                     if (history.pushState) { history.pushState("", document.title, window.location.pathname + window.location.search); }
                     return;
                 }

                 if (targetId && targetId.startsWith('#') && targetId.length > 1) {
                    try {
                        const targetElement = document.querySelector(targetId);
                        if (targetElement) {
                            e.preventDefault();
                            const headerOffset = getHeaderOffset();
                            const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                            const offsetPosition = elementPosition - headerOffset - 20;

                            window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' });
                            // Optional hash update
                            // setTimeout(() => { if (history.pushState) { history.pushState(null, null, targetId); } }, 800);
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

             if (!document.body.classList.contains('mobile-menu-open') && isDesktop) {
                 const scrollThreshold = 50;

                 if (currentScroll <= scrollThreshold) {
                     header.classList.remove('scroll-up', 'scroll-down');
                 } else if (currentScroll > lastScroll + 5 && !header.classList.contains('scroll-down')) {
                     header.classList.remove('scroll-up');
                     header.classList.add('scroll-down');
                 } else if (currentScroll < lastScroll - 5 && header.classList.contains('scroll-down')) {
                     header.classList.remove('scroll-down');
                     header.classList.add('scroll-up');
                 }
             } else {
                 header.classList.remove('scroll-up', 'scroll-down');
             }
             lastScroll = Math.max(0, currentScroll);
         };

         const handleResize = () => { handleScroll(); };

         window.addEventListener('scroll', utility.throttle(handleScroll, performanceConfig.throttleDelay));
         window.addEventListener('resize', utility.debounce(handleResize, performanceConfig.debounceDelay));
         handleScroll(); // Initial call
    };

    // --- Progress Bar & Active Nav Link (Desktop Nav) ---
    const setupScrollProgress = () => {
        const progressBar = document.querySelector('.progress-bar');
        const sections = Array.from(document.querySelectorAll('main > section[id]'));
        const navLinks = document.querySelectorAll('.desktop-nav ul li a.nav-link');
        if (!progressBar || sections.length === 0 || navLinks.length === 0) return;

        const updateProgressAndNav = () => {
            requestAnimationFrame(() => {
                const headerOffset = getHeaderOffset();
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                const totalScrollable = documentHeight - windowHeight;
                const scrolled = window.scrollY;
                const progress = totalScrollable > 0 ? (scrolled / totalScrollable) * 100 : 0;
                progressBar.style.width = `${Math.min(Math.max(0, progress), 100)}%`;

                let currentSectionId = '';
                const detectionPoint = scrolled + windowHeight * 0.3; // 30% from top detection

                for (let i = sections.length - 1; i >= 0; i--) {
                    const section = sections[i];
                    if (section.offsetTop <= detectionPoint) {
                        currentSectionId = section.getAttribute('id');
                        break;
                    }
                }

                if (scrolled + windowHeight >= documentHeight - 50) { // Near bottom
                     currentSectionId = sections[sections.length - 1].getAttribute('id');
                 } else if (!currentSectionId && scrolled < 50) { // Near top
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
        setTimeout(updateProgressAndNav, 50); // Initial call slightly delayed
     };

    // --- Section & Item Fade-in Animation (with Stagger) ---
    const setupSectionAnimations = () => {
        // Animate sections (like pillar panels) and items within non-panel sections
        const elementsToAnimate = document.querySelectorAll('.animate-on-scroll, .animate-item');
        if (elementsToAnimate.length === 0) return;

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    element.classList.add('visible');

                    // Apply stagger only if it's an item within a visible container
                    // (Assume panels themselves don't have internal stagger based on this logic)
                    if (element.classList.contains('animate-item') && !element.classList.contains('animate-on-scroll')) {
                        // Calculate index relative to siblings if needed, or use a fixed delay approach
                        // For now, rely on CSS transition delay if set
                        // Example: find index among sibling .animate-item elements
                        const parent = element.parentElement;
                        if(parent){
                             const siblings = Array.from(parent.querySelectorAll('.animate-item'));
                             const index = siblings.indexOf(element);
                             if(index !== -1){
                                element.style.setProperty('--animation-delay', `${index * performanceConfig.staggerDelay}ms`);
                             }
                        }
                    }
                    observer.unobserve(element); // Stop observing once visible
                }
            });
        };
        const observer = new IntersectionObserver(observerCallback, {
            threshold: performanceConfig.observerThreshold,
            rootMargin: performanceConfig.observerMargin
        });
        elementsToAnimate.forEach(el => { observer.observe(el); });
     };

     // --- Show Tooltip ---
     let tooltipTimeoutId = null;
     const showTooltip = (button, message) => {
        const tooltip = button.querySelector('.tooltip-message');
        if (!tooltip) return;

        if (tooltipTimeoutId) { clearTimeout(tooltipTimeoutId); tooltipTimeoutId = null; }

        tooltip.textContent = message;
        tooltip.classList.add('visible');

        tooltipTimeoutId = setTimeout(() => {
            tooltip.classList.remove('visible');
            tooltipTimeoutId = null;
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

                // --- Text Generation for Copy (Adjusted for new structure) ---
                let textToCopy = '';
                const sections = mainContent.querySelectorAll('main > section[id]'); // Target direct section children

                sections.forEach((section, sectionIndex) => {
                    const titleElement = section.querySelector('h1, h2');
                    const sectionIdentifier = section.querySelector('h3.section-identifier');

                    if (titleElement) { textToCopy += `${titleElement.textContent.trim()}\n=${'='.repeat(titleElement.textContent.trim().length)}\n\n`; }
                    if (sectionIdentifier) { textToCopy += `${sectionIdentifier.textContent.trim()}\n-${'-'.repeat(sectionIdentifier.textContent.trim().length)}\n\n`; }

                    const metaInfoPanel = section.querySelector('.panel-meta');
                    if (metaInfoPanel) {
                         metaInfoPanel.querySelectorAll('p').forEach(p => {
                            let text = p.innerHTML.replace(/<strong>(.*?)<\/strong>/g, '$1').replace(/<\/?span[^>]*>/g, '').replace(/:\s+/g, ': '); // Strip spans too
                            textToCopy += text.trim() + '\n';
                         });
                         textToCopy += '\n';
                    }

                    // Select content within .content div OR within .panel divs directly under the section
                    const contentBlocks = section.querySelectorAll(':scope > .content, :scope > .panel');

                     contentBlocks.forEach(block => {
                         const elements = block.querySelectorAll('p, ul > li, ol > li, dl dt, dl dd');

                         elements.forEach(el => {
                             // Skip placeholder content
                             if (el.closest('.placeholder-flowchart')) return;
                             // Skip panel titles if they are processed separately (e.g., Pillar titles)
                              if (el.tagName === 'H4' && el.parentElement.classList.contains('pillar-detail')) return;

                             let text = el.textContent?.trim();
                             if (!text) return;

                             let prefix = '';
                             let suffix = '\n\n'; // Default paragraph spacing

                             // --- Determine Prefix/Suffix based on element type and context ---

                             // List items
                             if (el.tagName === 'LI') {
                                 const listDepth = Array.from(el.ancestors).filter(a => a.matches('ul, ol')).length;
                                 prefix = '  '.repeat(listDepth); // Indentation based on depth
                                 const parentList = el.parentElement;

                                 if (parentList?.classList.contains('nested-list') || listDepth > 1) {
                                     prefix += '  - '; // Nested bullet
                                 } else {
                                     prefix += '* '; // Top-level bullet (covers styled, roadmap, pillar now)
                                 }
                                 suffix = '\n'; // Single newline for list items

                                 // Clean up Action: text if needed (should be handled by span now)
                                 text = text.replace('Action:', 'Action:').trim();
                             }
                             // Definition list (Risks)
                             else if (el.tagName === 'DT' && el.closest('.risk-list')) {
                                prefix = ''; text = text.trim(); suffix = '\n';
                             } else if (el.tagName === 'DD' && el.closest('.risk-list')) {
                                prefix = '    '; text = text.replace('Mitigation:', 'Mitigation:').trim(); suffix = '\n\n';
                             }
                             // Standard paragraph
                             else if (el.tagName === 'P') {
                                 prefix = ''; suffix = '\n\n';
                             }

                            // Strip neutral highlight span tags for copy
                            text = text.replace(/<span class="text-highlight-neutral">([\s\S]*?)<\/span>/g, '$1');

                            // Handle italic ROI line (removed tag, check if parent indicates it)
                            if (el.matches('.cost-benefit-container > ul > li:last-child') && !el.querySelector('ul')) {
                                 text = `_${text}_`; suffix = '\n\n';
                            }

                            if (text) { textToCopy += prefix + text + suffix; }
                         });
                     });


                      // Table Data
                     const table = section.querySelector('.tech-stack-table');
                     if (table) {
                         textToCopy += "\n--- Technology Stack ---\n"; // Add separator before table
                         table.querySelectorAll('tbody tr').forEach(row => {
                             const cells = row.querySelectorAll('td');
                             if (row.classList.contains('total-row')) {
                                 const labelCell = cells[0];
                                 const valueCell = cells[cells.length - 1];
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
                       textToCopy += '----------------------------------------\n\n'; // Ensure spacing before separator
                    }
                });


                try {
                    const cleanedText = textToCopy.replace(/\n{3,}/g, '\n\n').trim();
                    await navigator.clipboard.writeText(cleanedText);
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
         document.querySelectorAll('.animate-item, .pillar-panel.animate-on-scroll').forEach(el => { el.style.willChange = 'opacity, transform'; });
         document.querySelectorAll('.action-button, .panel.interactive-element, .pillar-list li.interactive-element').forEach(el => { el.style.willChange = 'transform, box-shadow'; });
         const header = document.querySelector('.header'); if (header) { header.style.willChange = 'transform, background-color'; }
         const progressBar = document.querySelector('.progress-bar'); if(progressBar) { progressBar.style.willChange = 'width'; }
         document.querySelectorAll('.timeline-dot').forEach(el => { el.style.willChange = 'transform, box-shadow'; });
         const logo = document.querySelector('.logo'); if(logo) { logo.style.willChange = 'transform'; }
         const mobileMenu = document.getElementById('mobile-menu'); if(mobileMenu) { mobileMenu.style.willChange = 'opacity'; }
         document.querySelectorAll('.hamburger-button span').forEach(el => { el.style.willChange = 'transform, opacity'; });
         document.querySelectorAll('.nav.desktop-nav ul li a::after').forEach(el => { el.style.willChange = 'width, background-color'; });
     };

     // Helper function for ancestor check (polyfill for older browsers if needed)
     if (!Element.prototype.matches) { Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector; }
     if (!Element.prototype.closest) {
         Element.prototype.closest = function(s) {
             var el = this;
             do { if (el.matches(s)) return el; el = el.parentElement || el.parentNode; } while (el !== null && el.nodeType === 1);
             return null;
         };
     }
     // Simple ancestor iteration helper for list depth
     if (!Element.prototype.ancestors) {
        Object.defineProperty(Element.prototype, 'ancestors', {
            get: function() {
                var ancestors = []; var parent = this.parentElement;
                while (parent) { ancestors.push(parent); parent = parent.parentElement; }
                return ancestors;
            }
        });
     }


    // --- Initialize Everything ---
    setupHamburgerMenu();
    setupSmoothScrolling();
    setupHeaderScrollEffect();
    setupScrollProgress();
    setupSectionAnimations();
    setupActionButtons();
    setupWillChange();

}); // End DOMContentLoaded
