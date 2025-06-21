// Load Font Awesome
const fontAwesome = document.createElement('link');
fontAwesome.rel = 'stylesheet';
fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
document.head.appendChild(fontAwesome);

// Function to detect mobile devices
function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Load audio player only if not a mobile device
if (!isMobileDevice()) {
    const audioPlayerScript = document.createElement('script');
    audioPlayerScript.src = 'https://overlord-mmorp.onrender.com/audio-player.js';
    audioPlayerScript.onload = () => {
        console.log('Audio player script loaded successfully');
        new AudioPlayer(); // Initialize the player after the script loads
    };
    audioPlayerScript.onerror = (error) => {
        console.error('Error loading audio player script:', error);
    };
    document.body.appendChild(audioPlayerScript);
} else {
    console.log('Mobile device detected, audio player not loaded.');
}

// Common functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing common functionality');
    
    // Add "To Top" button functionality
    const toTopButtons = document.querySelectorAll('.to-top');
    toTopButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Add fade-in animation to navigation
    const nav = document.querySelector('.nav');
    if (nav) {
        nav.classList.add('fade-in');
    }
}); 
