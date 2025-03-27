// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Copy to clipboard functionality
const copyButton = document.getElementById('copy-button');
copyButton.addEventListener('click', async () => {
    try {
        // Get all content sections
        const content = document.querySelector('.main-content').innerText;
        
        // Create a temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = content;
        document.body.appendChild(textarea);
        
        // Select and copy the text
        textarea.select();
        await document.execCommand('copy');
        
        // Remove the temporary textarea
        document.body.removeChild(textarea);
        
        // Show success feedback
        copyButton.textContent = 'Copied!';
        copyButton.style.backgroundColor = '#28a745';
        
        // Reset button after 2 seconds
        setTimeout(() => {
            copyButton.textContent = 'Copy for Print';
            copyButton.style.backgroundColor = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        copyButton.textContent = 'Failed to copy';
        copyButton.style.backgroundColor = '#dc3545';
        
        // Reset button after 2 seconds
        setTimeout(() => {
            copyButton.textContent = 'Copy for Print';
            copyButton.style.backgroundColor = '';
        }, 2000);
    }
});

// Intersection Observer for fade-in animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1
});

// Add fade-in animation to sections
document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
}); 