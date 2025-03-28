document.addEventListener('DOMContentLoaded', () => {

    const performanceConfig = {
        throttleDelay: 16, // ~60fps for scroll events
        debounceDelay: 150, // For resize events
        observerThreshold: 0.1, // 10% visible
        observerMargin: '0px 0px -50px 0px' // Trigger slightly before fully in view
    };

    // --- Utility Functions ---
    const throttle = (func, limit) => {
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

    const debounce = (func, wait) => {
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
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    // Calculate offset for fixed header
                    const headerOffset = document.querySelector('.header')?.offsetHeight || 70;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Optional: Update URL hash manually after scroll
                    // setTimeout(() => {
                    //     history.pushState(null, null, targetId);
                    // }, 500); // Delay to allow scroll to roughly finish
                }
            });
        });
    };

    // --- Header Scroll Effect ---
    const setupHeaderScrollEffect = () => {
        const header = document.querySelector('.header');
        if (!header) return;
        let lastScroll = 0;

        const handleScroll = () => {
            const currentScroll = window.pageYOffset;

            if (currentScroll <= header.offsetHeight) { // Show header near top
                header.classList.remove('scroll-up', 'scroll-down');
                return;
            }

            if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
                // Scroll Down
                header.classList.remove('scroll-up');
                header.classList.add('scroll-down');
            } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
                // Scroll Up
                header.classList.remove('scroll-down');
                header.classList.add('scroll-up');
            }
            lastScroll = currentScroll;
        };

        window.addEventListener('scroll', throttle(handleScroll, performanceConfig.throttleDelay));
    };


    // --- Progress Bar & Active Nav Link ---
    const setupScrollProgress = () => {
        const progressBar = document.querySelector('.progress-bar');
        const sections = document.querySelectorAll('.section');
        const navLinks = document.querySelectorAll('.nav ul li a');
        const headerHeight = document.querySelector('.header')?.offsetHeight || 70;

        if (!progressBar || sections.length === 0 || navLinks.length === 0) return;

        const updateProgressAndNav = () => {
            requestAnimationFrame(() => {
                // Progress Bar calculation
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                // Adjust total scrollable height considering fixed header might change effective viewport
                const totalScrollable = documentHeight - windowHeight;
                const scrolled = window.scrollY;
                const progress = totalScrollable > 0 ? (scrolled / totalScrollable) * 100 : 0;
                progressBar.style.width = `${Math.min(progress, 100)}%`; // Cap at 100%

                // Active Nav Link calculation
                let currentSectionId = '';
                sections.forEach(section => {
                    const sectionTop = section.offsetTop - headerHeight - 50; // Adjust trigger point
                     // Consider section bottom as well for more accurate highlighting
                    const sectionBottom = sectionTop + section.offsetHeight;

                    if (scrolled >= sectionTop && scrolled < sectionBottom) {
                         currentSectionId = section.getAttribute('id');
                    }
                });

                 // Fallback for last section if scrolled to bottom
                 if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
                     currentSectionId = sections[sections.length - 1]?.getAttribute('id') || currentSectionId;
                 }


                navLinks.forEach(link => {
                    link.classList.remove('active');
                    // Check if link's href matches the current section ID
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


    // --- Section Fade-in Animation ---
    const setupSectionAnimations = () => {
        const sections = document.querySelectorAll('.section');
        if (sections.length === 0) return;

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // We could add more complex animations here based on data-attributes later
                    observer.unobserve(entry.target); // Animate only once
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, {
            threshold: performanceConfig.observerThreshold,
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

        // Copy Functionality
        if (copyButton) {
            copyButton.addEventListener('click', async () => {
                const contentElement = document.querySelector('.main-content');
                if (!contentElement) return;

                // Create a temporary element to hold formatted text
                const tempElement = document.createElement('div');
                tempElement.innerHTML = contentElement.innerHTML; // Copy HTML structure initially

                // Basic text formatting (improve as needed)
                tempElement.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => h.textContent = `\n${h.textContent.toUpperCase()}\n`);
                tempElement.querySelectorAll('p, li').forEach(el => el.textContent = `${el.textContent}\n`);
                // Remove elements not useful for plain text copy
                tempElement.querySelectorAll('img, .honeycomb-grid, .action-buttons, .progress-bar, .nav').forEach(el => el.remove());

                const textToCopy = tempElement.innerText; // Get formatted plain text

                try {
                    await navigator.clipboard.writeText(textToCopy);
                    copyButton.classList.add('success');
                    copyButton.querySelector('svg').innerHTML = '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>'; // Checkmark

                    setTimeout(() => {
                         copyButton.classList.remove('success');
                         copyButton.querySelector('svg').innerHTML = '<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>'; // Reset Icon
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    copyButton.classList.add('error');
                    // Optionally show an error icon/message
                    setTimeout(() => copyButton.classList.remove('error'), 2000);
                }
            });
        }

        // Print Functionality
        if (printButton) {
            printButton.addEventListener('click', () => {
                window.print(); // Use browser's print functionality, relying on @media print styles
            });
        }
    };

    // --- Performance Hints ---
    const setupWillChange = () => {
        const animatedElements = document.querySelectorAll('.section, .honeycomb-item, .timeline-item, .risk-card, .header');
        animatedElements.forEach(el => {
            // Apply judiciously - add more specific properties if needed (e.g., transform, opacity)
            el.style.willChange = 'transform, opacity';
        });
    };


    // --- Initialize Everything ---
    setupSmoothScrolling();
    setupHeaderScrollEffect();
    setupScrollProgress();
    setupSectionAnimations();
    setupActionButtons();
    setupWillChange();

    // Optional: Simple Performance Monitor Log
    // let lastTime = performance.now();
    // let frameCount = 0;
    // function perfMonitorLoop(now) {
    //     frameCount++;
    //     if (now - lastTime >= 1000) {
    //         const fps = Math.round((frameCount * 1000) / (now - lastTime));
    //         // console.log(`FPS: ${fps}`); // Uncomment to log FPS
    //         frameCount = 0;
    //         lastTime = now;
    //     }
    //     requestAnimationFrame(perfMonitorLoop);
    // }
    // requestAnimationFrame(perfMonitorLoop);

}); // End DOMContentLoaded
