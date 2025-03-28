document.addEventListener('DOMContentLoaded', () => {

    const performanceConfig = {
        throttleDelay: 16,
        debounceDelay: 150,
        observerThreshold: 0.1, // Trigger when 10% is visible
        observerMargin: '0px 0px -50px 0px',
        staggerDelay: 100 // ms delay between staggered items
    };

    // --- Utility Functions (Throttle, Debounce) ---
    const throttle = (func, limit) => { /* ... same as before ... */
        let inThrottle;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    };
    const debounce = (func, wait) => { /* ... same as before ... */
        let timeout;
        return function executedFunction(...args) {
            const context = this;
            const later = () => {
                clearTimeout(timeout);
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // --- Smooth Scrolling ---
    const setupSmoothScrolling = () => {
        document.querySelectorAll('.nav a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                try { // Add error handling for potentially invalid selectors
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        const header = document.querySelector('.header');
                        // Use computed height for accuracy, fallback if header is hidden/missing
                        const headerOffset = header ? parseFloat(getComputedStyle(header).height) : 70;
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 20; // Extra 20px buffer

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    } else {
                         console.warn(`Smooth scroll target not found: ${targetId}`);
                    }
                } catch (error) {
                     console.error(`Error finding smooth scroll target: ${targetId}`, error);
                }
            });
        });
    };

    // --- Header Scroll Effect ---
    const setupHeaderScrollEffect = () => {
        const header = document.querySelector('.header');
        if (!header) return;
        let lastScroll = 0;
        // Store initial header height in case it changes dynamically (though less likely now it's not fixed on mobile)
        let headerHeight = header.offsetHeight;

        const handleScroll = () => {
            // Re-calculate header height on scroll *if needed* - can be costly. Avoid if possible.
            // headerHeight = header.offsetHeight;
            const currentScroll = window.pageYOffset;

             // Use a threshold slightly less than header height if it's not fixed
            const scrollThreshold = headerHeight * 0.8;

            if (currentScroll <= scrollThreshold) {
                header.classList.remove('scroll-up', 'scroll-down');
                return;
            }

            if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
                header.classList.remove('scroll-up'); header.classList.add('scroll-down');
            } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
                header.classList.remove('scroll-down'); header.classList.add('scroll-up');
            }
            lastScroll = Math.max(0, currentScroll); // Ensure lastScroll doesn't go negative
        };
         // Recalculate header height on resize
        const handleResize = () => {
             headerHeight = header.offsetHeight;
        };


        window.addEventListener('scroll', throttle(handleScroll, performanceConfig.throttleDelay));
         window.addEventListener('resize', debounce(handleResize, performanceConfig.debounceDelay));
    };


    // --- Progress Bar & Active Nav Link ---
    const setupScrollProgress = () => {
        const progressBar = document.querySelector('.progress-bar');
        const sections = document.querySelectorAll('.section');
        const navLinks = document.querySelectorAll('.nav ul li a');
        const header = document.querySelector('.header'); // Get header element

        if (!progressBar || sections.length === 0 || navLinks.length === 0) return;

        const updateProgressAndNav = () => {
             const headerHeight = header ? parseFloat(getComputedStyle(header).height) : 70; // Use computed height

            requestAnimationFrame(() => {
                // Progress Bar
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                const totalScrollable = documentHeight - windowHeight;
                const scrolled = window.scrollY;
                const progress = totalScrollable > 0 ? (scrolled / totalScrollable) * 100 : 0;
                progressBar.style.width = `${Math.min(progress, 100)}%`;

                // Active Nav Link
                let currentSectionId = '';
                let minDistance = Infinity; // Track distance to find closest section top

                sections.forEach(section => {
                     const sectionTop = section.offsetTop - headerHeight - 50; // Offset trigger point below header
                     const distance = Math.abs(scrolled - sectionTop);

                     // Determine the section whose top is closest *above* the current scroll position
                     if (scrolled >= sectionTop && distance < minDistance) {
                         minDistance = distance;
                         currentSectionId = section.getAttribute('id');
                     }
                });

                 // If nothing found (e.g., scrolled way past last section top), highlight the last one
                 if (!currentSectionId && scrolled > sections[sections.length - 1].offsetTop) {
                     currentSectionId = sections[sections.length - 1].getAttribute('id');
                 }

                 // Or highlight the first one if scrolled near the top before first section
                 if (!currentSectionId && scrolled < sections[0].offsetTop) {
                      currentSectionId = sections[0].getAttribute('id');
                 }


                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentSectionId}`) {
                        link.classList.add('active');
                    }
                });
            });
        };

        window.addEventListener('scroll', throttle(updateProgressAndNav, performanceConfig.throttleDelay));
        window.addEventListener('resize', debounce(updateProgressAndNav, performanceConfig.debounceDelay));
        updateProgressAndNav(); // Initial update
    };


    // --- Section & Item Fade-in Animation (with Stagger) ---
    const setupSectionAnimations = () => {
        const sections = document.querySelectorAll('.animate-on-scroll'); // Target parent sections
        if (sections.length === 0) return;

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = entry.target;
                    section.classList.add('visible'); // Mark parent section as visible

                    // Find animatable items *within* the now visible section
                    const itemsToAnimate = section.querySelectorAll('.animate-item');
                    itemsToAnimate.forEach((item, index) => {
                        // Apply stagger delay using CSS custom property
                        item.style.setProperty('--animation-delay', `${index * performanceConfig.staggerDelay}ms`);
                        // The 'visible' class on the parent triggers the animation via CSS cascade
                    });

                    observer.unobserve(section); // Stop observing the parent section
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, {
            threshold: performanceConfig.observerThreshold, // Adjust threshold if needed
            rootMargin: performanceConfig.observerMargin
        });

        sections.forEach(section => {
            observer.observe(section);
        });
    };

    // --- Action Buttons (Copy/Print) ---
    const setupActionButtons = () => {
        const copyButton = document.getElementById('copy-button');
        const printButton = document.getElementById('print-button');

        // Copy Functionality - Improved formatting attempt
        if (copyButton) {
            copyButton.addEventListener('click', async () => {
                const contentElement = document.querySelector('.main-content');
                if (!contentElement) return;

                // Attempt a slightly cleaner text extraction
                let textToCopy = "";
                contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li').forEach(el => {
                    let prefix = "";
                    let suffix = "\n\n"; // Double newline after paragraphs/headings
                    const tagName = el.tagName.toLowerCase();

                    if (tagName.startsWith('h')) {
                        prefix = `\n--- ${el.textContent.trim().toUpperCase()} ---\n`;
                    } else if (tagName === 'li') {
                        // Basic indentation for lists
                        let indent = "";
                        let current = el.parentElement;
                        while (current && current !== contentElement) {
                            if (current.tagName.toLowerCase() === 'ul' || current.tagName.toLowerCase() === 'ol') {
                                indent += "  ";
                            }
                            current = current.parentElement;
                        }
                        prefix = `${indent}* `; // Asterisk for list items
                        suffix = "\n"; // Single newline after list items
                    } else { // Paragraph
                         prefix = "";
                    }
                    // Add link URLs in parentheses
                    const links = el.querySelectorAll('a[href^="http"]');
                    let elementText = el.textContent;
                    links.forEach(link => {
                         if (link.href && link.textContent) {
                             elementText = elementText.replace(link.textContent, `${link.textContent} (${link.href})`);
                         }
                    });


                    textToCopy += prefix + elementText.trim() + suffix;
                });

                // Remove extra blank lines
                textToCopy = textToCopy.replace(/\n{3,}/g, '\n\n').trim();


                try {
                    await navigator.clipboard.writeText(textToCopy);
                    copyButton.classList.add('success');
                    copyButton.querySelector('svg').innerHTML = '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>'; // Checkmark
                    setTimeout(() => {
                         copyButton.classList.remove('success');
                         copyButton.querySelector('svg').innerHTML = '<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>'; // Reset Icon
                    }, 2000);
                } catch (err) { /* ... error handling same as before ... */
                    console.error('Failed to copy text: ', err);
                    copyButton.classList.add('error');
                    setTimeout(() => copyButton.classList.remove('error'), 2000);
                }
            });
        }

        // Print Functionality
        if (printButton) {
            printButton.addEventListener('click', () => {
                window.print();
            });
        }
    };

    // --- Performance Hints (will-change) ---
    const setupWillChange = () => {
        // Apply more selectively now
        const elements = document.querySelectorAll(
            '.animate-item, .header, .action-button' // Elements that actually animate/transform
        );
        elements.forEach(el => {
            el.style.willChange = 'opacity, transform'; // Be specific
        });
    };


    // --- Initialize Everything ---
    setupSmoothScrolling();
    setupHeaderScrollEffect();
    setupScrollProgress();
    setupSectionAnimations();
    setupActionButtons();
    setupWillChange();

}); // End DOMContentLoaded
