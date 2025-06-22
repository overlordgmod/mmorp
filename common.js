// Load Font Awesome
const fontAwesome = document.createElement('link');
fontAwesome.rel = 'stylesheet';
fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
document.head.appendChild(fontAwesome);

// Function to detect mobile devices
function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

class AudioPlayer {
    constructor(audioSrc) {
        this.audio = new Audio(audioSrc);
        this.audio.loop = true;
        this.audio.volume = 0.1;

        this.createPlayer();
        this.setupEventListeners();
        this.updateSliderBackground(this.volumeSlider);
    }

    createPlayer() {
        const playerContainer = document.createElement('div');
        playerContainer.className = 'new-audio-player';

        playerContainer.innerHTML = `
            <div class="controls">
                <button class="play-pause-btn"><i class="fas fa-play"></i></button>
                <button class="restart-btn"><i class="fas fa-redo"></i></button>
                <input type="range" class="progress-slider" min="0" max="100" value="0">
                <div class="volume-container">
                    <i class="fas fa-volume-up"></i>
                    <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="0.1">
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .new-audio-player {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background-color: rgba(75, 47, 115, 0.85);
                backdrop-filter: blur(8px);
                padding: 8px;
                border-radius: 8px;
                z-index: 1001;
                box-shadow: 0 2px 10px rgba(0,0,0,0.5);
                color: #eadaff;
                border: 1px solid rgba(158, 127, 222, 0.4);
            }
            .new-audio-player .controls {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .new-audio-player button {
                background: none;
                border: 1px solid #9e7fde;
                color: #eadaff;
                cursor: pointer;
                font-size: 14px;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s, border-color 0.2s;
            }
            .new-audio-player button:hover {
                background-color: rgba(158, 127, 222, 0.2);
                border-color: #bca4f0;
            }
            .new-audio-player .progress-slider,
            .new-audio-player .volume-slider {
                -webkit-appearance: none;
                appearance: none;
                background-color: transparent;
                background-image: linear-gradient(#9e7fde, #9e7fde);
                background-size: 0% 100%;
                background-repeat: no-repeat;
            }
            .new-audio-player .progress-slider { width: 150px; }
            .new-audio-player .volume-slider { width: 60px; }

            .new-audio-player .progress-slider::-webkit-slider-runnable-track,
            .new-audio-player .volume-slider::-webkit-slider-runnable-track {
                -webkit-appearance: none;
                appearance: none;
                background: rgba(234, 218, 255, 0.3);
                height: 4px;
                border-radius: 2px;
            }
            .new-audio-player .progress-slider::-moz-range-track,
            .new-audio-player .volume-slider::-moz-range-track {
                -moz-appearance: none;
                appearance: none;
                background: rgba(234, 218, 255, 0.3);
                height: 4px;
                border-radius: 2px;
            }

            .new-audio-player .progress-slider::-webkit-slider-thumb,
            .new-audio-player .volume-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                margin-top: -5px;
                background-color: #d6bfff;
                height: 14px;
                width: 14px;
                border-radius: 50%;
                border: 1px solid #4b286f;
                transition: transform 0.2s;
            }
            .new-audio-player .progress-slider::-moz-range-thumb,
            .new-audio-player .volume-slider::-moz-range-thumb {
                background-color: #d6bfff;
                height: 14px;
                width: 14px;
                border-radius: 50%;
                border: 1px solid #4b286f;
            }
            .new-audio-player .progress-slider::-webkit-slider-thumb:hover,
            .new-audio-player .volume-slider::-webkit-slider-thumb:hover {
                transform: scale(1.1);
            }

            .new-audio-player .volume-container {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .new-audio-player .volume-container i {
                width: 20px;
                text-align: center;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(playerContainer);

        this.playPauseBtn = playerContainer.querySelector('.play-pause-btn');
        this.restartBtn = playerContainer.querySelector('.restart-btn');
        this.progressSlider = playerContainer.querySelector('.progress-slider');
        this.volumeSlider = playerContainer.querySelector('.volume-slider');
        this.volumeIcon = playerContainer.querySelector('.volume-container i');
    }

    setupEventListeners() {
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.restartBtn.addEventListener('click', () => this.restart());
        
        this.volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value);
            this.updateSliderBackground(e.target);
        });
        this.volumeIcon.addEventListener('click', () => this.toggleMute());

        this.progressSlider.addEventListener('input', (e) => {
            this.seek(e.target.value);
            this.updateSliderBackground(e.target);
        });
        
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('volumechange', () => this.updateVolumeIcon());
    }

    togglePlay() {
        if (this.audio.paused) {
            this.audio.play();
            this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            this.audio.pause();
            this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    restart() {
        this.audio.currentTime = 0;
        if (this.audio.paused) {
           this.togglePlay();
        }
    }

    setVolume(volume) {
        this.audio.volume = volume;
    }

    toggleMute() {
        this.audio.muted = !this.audio.muted;
        if (this.audio.muted) {
            this.preMuteVolume = this.audio.volume;
            this.volumeSlider.value = 0;
        } else {
             this.volumeSlider.value = this.preMuteVolume || 0.1;
        }
        this.setVolume(this.volumeSlider.value);
        this.updateSliderBackground(this.volumeSlider);
    }

    updateVolumeIcon() {
        const volume = this.audio.volume;
        const icon = this.volumeIcon;
        if (this.audio.muted || volume === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (volume < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }
    
    seek(value) {
        const duration = this.audio.duration;
        if (isFinite(duration)) {
            this.audio.currentTime = (value / 100) * duration;
        }
    }

    updateProgress() {
        const duration = this.audio.duration;
        if (isFinite(duration)) {
            const progress = (this.audio.currentTime / duration) * 100;
            this.progressSlider.value = progress;
            this.updateSliderBackground(this.progressSlider);
        }
    }

    updateSliderBackground(slider) {
        const percentage = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        slider.style.backgroundSize = `${percentage}% 100%`;
    }
}

// Common functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing common functionality');
    
    if (!isMobileDevice()) {
      new AudioPlayer('https://overlord-mmorp.onrender.com/phonmusic.mp3');
    }
    
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
