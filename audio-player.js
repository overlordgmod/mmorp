// Глобальная переменная для отслеживания текущего плеера
let currentAudioPlayer = null;

// Статический метод для остановки всех аудио элементов (больше не используется)
// function stopAllAudio() {
//     const allAudio = document.querySelectorAll('audio');
//     allAudio.forEach(audio => {
//         audio.pause();
//         audio.currentTime = 0;
//     });
// }

class AudioPlayer {
    constructor() {
        console.log('Initializing AudioPlayer');
        
        // Проверяем, не создан ли уже экземпляр
        if (currentAudioPlayer && currentAudioPlayer !== this) {
            console.log('Audio player already exists, stopping previous instance');
            currentAudioPlayer.stopAndDestroy();
        }
        
        // Удаляем существующие элементы плеера, если они есть
        const existingPlayers = document.querySelectorAll('.audio-player');
        existingPlayers.forEach(player => player.remove());
        
        this.audio = new Audio('https://overlord-mmorp.onrender.com/phonmusic.mp3');
        this.audio.loop = true;
        
        // Состояние плеера из localStorage
        this.isPlaying = localStorage.getItem('isPlaying') === 'true' || false;
        this.currentTime = parseFloat(localStorage.getItem('currentTime')) || 0;
        this.volume = parseFloat(localStorage.getItem('volume')) || 0.1;
        this.previousVolume = parseFloat(localStorage.getItem('previousVolume')) || this.volume;
        
        // Флаг для отслеживания автовоспроизведения
        this.autoPlayAttempted = false;
        this.volumeRestoreTimeout = null;
        
        // Проверяем загрузку аудио
        this.audio.addEventListener('error', (e) => {
            console.error('Error loading audio:', e);
        });
        
        this.audio.addEventListener('loadeddata', () => {
            console.log('Audio loaded successfully');
        });
        
        this.createPlayer();
        this.setupEventListeners();
        this.restoreState();
        
        // Сохраняем состояние при уходе со страницы
        this.setupPageUnloadHandler();
        
        // Устанавливаем текущий плеер
        currentAudioPlayer = this;
    }

    // Новый метод для остановки и уничтожения плеера
    stopAndDestroy() {
        console.log('Stopping and destroying previous audio player');
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio.load();
        }
        if (this.volumeRestoreTimeout) {
            clearTimeout(this.volumeRestoreTimeout);
        }
        if (this.playerElement) {
            this.playerElement.remove();
        }
    }

    createPlayer() {
        console.log('Creating audio player UI');
        const player = document.createElement('div');
        player.className = 'audio-player';
        player.innerHTML = `
            <div class="player-controls">
                <button class="play-pause">
                    <i class="fas ${this.isPlaying ? 'fa-pause' : 'fa-play'}"></i>
                </button>
                <button class="rewind">
                    <i class="fas fa-redo"></i>
                </button>
                <div class="progress-container">
                    <input type="range" class="progress-slider" min="0" max="100" value="0">
                </div>
                <div class="volume-control">
                    <i class="fas fa-volume-up"></i>
                    <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="${this.volume}">
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .audio-player {
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
                display: flex;
                align-items: center;
                max-width: 300px;
                width: 100%;
            }

            .player-controls {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
            }

            .play-pause, .rewind {
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
                flex-shrink: 0;
            }

            .play-pause:hover, .rewind:hover {
                background-color: rgba(158, 127, 222, 0.2);
                border-color: #bca4f0;
            }

            .progress-container {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                margin: 0 5px;
            }

            .progress-slider {
                -webkit-appearance: none;
                appearance: none;
                background-color: transparent;
                background-image: linear-gradient(#9e7fde, #9e7fde);
                background-size: 0% 100%;
                background-repeat: no-repeat;
                width: 100%;
                height: 14px;
                border-radius: 2px;
                cursor: pointer;
            }

            .progress-slider::-webkit-slider-runnable-track {
                -webkit-appearance: none;
                appearance: none;
                background: rgba(234, 218, 255, 0.3);
                height: 14px;
                border-radius: 2px;
            }

            .progress-slider::-moz-range-track {
                -moz-appearance: none;
                appearance: none;
                background: rgba(234, 218, 255, 0.3);
                height: 14px;
                border-radius: 2px;
            }

            .progress-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                background-color: #d6bfff;
                height: 14px;
                width: 14px;
                border-radius: 50%;
                border: 1px solid #4b286f;
                transition: transform 0.2s;
                position: relative;
                top: 50%;
                transform: translateY(-50%);
            }

            .progress-slider::-moz-range-thumb {
                background-color: #d6bfff;
                height: 14px;
                width: 14px;
                border-radius: 50%;
                border: 1px solid #4b286f;
                position: relative;
                top: 50%;
                transform: translateY(-50%);
            }

            .progress-slider::-webkit-slider-thumb:hover {
                transform: scale(1.1) translateY(-50%);
            }

            .volume-control {
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .volume-slider {
                -webkit-appearance: none;
                appearance: none;
                background-color: transparent;
                background-image: linear-gradient(#9e7fde, #9e7fde);
                background-size: 0% 100%;
                background-repeat: no-repeat;
                width: 60px;
                height: 14px;
                border-radius: 2px;
                cursor: pointer;
            }

            .volume-slider::-webkit-slider-runnable-track {
                -webkit-appearance: none;
                appearance: none;
                background: rgba(234, 218, 255, 0.3);
                height: 14px;
                border-radius: 2px;
            }

            .volume-slider::-moz-range-track {
                -moz-appearance: none;
                appearance: none;
                background: rgba(234, 218, 255, 0.3);
                height: 14px;
                border-radius: 2px;
            }

            .volume-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                background-color: #d6bfff;
                height: 14px;
                width: 14px;
                border-radius: 50%;
                border: 1px solid #4b286f;
                transition: transform 0.2s;
                position: relative;
                top: 50%;
                transform: translateY(-50%);
            }

            .volume-slider::-moz-range-thumb {
                background-color: #d6bfff;
                height: 14px;
                width: 14px;
                border-radius: 50%;
                border: 1px solid #4b286f;
                position: relative;
                top: 50%;
                transform: translateY(-50%);
            }

            .volume-slider::-webkit-slider-thumb:hover {
                transform: scale(1.1) translateY(-50%);
            }

            .volume-control i {
                width: 20px;
                text-align: center;
                cursor: pointer;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(player);

        this.player = player;
        this.playerElement = player;
        this.playPauseBtn = player.querySelector('.play-pause');
        this.rewindBtn = player.querySelector('.rewind');
        this.progressSlider = player.querySelector('.progress-slider');
        this.volumeSlider = player.querySelector('.volume-slider');
        this.volumeIcon = player.querySelector('.volume-control i');
        
        // Инициализация фона слайдеров
        this.updateSliderBackground(this.volumeSlider);
        
        console.log('Audio player UI created successfully');
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.rewindBtn.addEventListener('click', () => this.rewind());
        this.progressSlider.addEventListener('input', (e) => this.setProgress(e));
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e));
        
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleEnded());
        this.audio.addEventListener('loadedmetadata', () => this.updateProgress());
        
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            localStorage.setItem('isPlaying', 'true');
            this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            this.saveCurrentState();
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            localStorage.setItem('isPlaying', 'false');
            this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            this.saveCurrentState();
        });
        
        this.audio.addEventListener('timeupdate', () => {
            localStorage.setItem('currentTime', this.audio.currentTime);
            this.saveCurrentState();
        });
        
        this.volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e);
            this.saveCurrentState();
        });
        
        console.log('Event listeners set up successfully');
    }

    setupPageUnloadHandler() {
        // Сохраняем состояние при уходе со страницы
        window.addEventListener('beforeunload', () => {
            this.saveCurrentState();
            // Не останавливаем аудио!
        });
        
        // Обработчик для события pagehide (когда страница скрывается)
        window.addEventListener('pagehide', () => {
            this.saveCurrentState();
            // Не останавливаем аудио!
        });
        
        // Также сохраняем при изменении видимости страницы
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveCurrentState();
            }
        });
    }

    saveCurrentState() {
        localStorage.setItem('isPlaying', this.isPlaying.toString());
        localStorage.setItem('currentTime', this.audio.currentTime.toString());
        localStorage.setItem('volume', this.volume.toString());
        localStorage.setItem('previousVolume', this.previousVolume.toString());
        console.log('Player state saved:', {
            isPlaying: this.isPlaying,
            currentTime: this.audio.currentTime,
            volume: this.volume,
            previousVolume: this.previousVolume
        });
    }

    restoreState() {
        console.log('Restoring player state (waiting for loadedmetadata)');
        this.audio.addEventListener('loadedmetadata', () => {
            // Восстановить громкость
            this.audio.volume = this.volume;
            this.volumeSlider.value = this.volume;
            // Восстановить время
            if (!isNaN(this.currentTime) && this.currentTime > 0 && this.currentTime < this.audio.duration) {
                this.audio.currentTime = this.currentTime;
            }
            // Восстановить статус воспроизведения
            if (this.isPlaying && !this.autoPlayAttempted) {
                this.autoPlayAttempted = true;
                this.audio.play().then(() => {
                    this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                }).catch(() => {
                    this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                });
            } else {
                this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
            console.log('[restoreState] Restored:', {
                isPlaying: this.isPlaying,
                currentTime: this.audio.currentTime,
                volume: this.audio.volume
            });
        }, { once: true });
    }

    attemptAutoPlay() {
        // Обход блокировки автоплей: устанавливаем минимальную громкость
        const originalVolume = this.audio.volume;
        this.audio.volume = 0.005;
        
        this.audio.play().then(() => {
            console.log('Auto-play successful');
            this.isPlaying = true;
            localStorage.setItem('isPlaying', 'true');
            this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            
            // Восстанавливаем громкость через 3-4 секунды
            this.volumeRestoreTimeout = setTimeout(() => {
                this.audio.volume = originalVolume;
                this.volume = originalVolume;
                this.volumeSlider.value = originalVolume;
                localStorage.setItem('volume', originalVolume.toString());
                console.log('Volume restored to:', originalVolume);
            }, 3500); // 3.5 секунды
            
        }).catch((error) => {
            console.error('Auto-play failed:', error);
            this.isPlaying = false;
            localStorage.setItem('isPlaying', 'false');
            this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            this.audio.volume = originalVolume;
        });
    }

    togglePlay() {
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            // Очищаем таймаут восстановления громкости при ручном воспроизведении
            if (this.volumeRestoreTimeout) {
                clearTimeout(this.volumeRestoreTimeout);
                this.volumeRestoreTimeout = null;
            }
            
            this.audio.play().catch((error) => {
                console.error('Error playing audio:', error);
                this.isPlaying = false;
                localStorage.setItem('isPlaying', 'false');
                this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            });
        }
    }

    setProgress(e) {
        const value = e.target.value;
        const duration = this.audio.duration;
        if (!isNaN(duration)) {
            this.audio.currentTime = (value / 100) * duration;
        }
        this.updateSliderBackground(e.target);
    }

    updateProgress() {
        const { currentTime, duration } = this.audio;
        if (isNaN(duration)) return;
        
        const progressPercent = (currentTime / duration) * 100;
        this.progressSlider.value = progressPercent;
        this.updateSliderBackground(this.progressSlider);
    }

    updateSliderBackground(slider) {
        const value = slider.value;
        const min = slider.min;
        const max = slider.max;
        const percent = ((value - min) / (max - min)) * 100;
        slider.style.backgroundSize = percent + '% 100%';
    }

    setVolume(e) {
        const volume = parseFloat(e.target.value);
        this.audio.volume = volume;
        this.volume = volume;
        this.previousVolume = volume;
        localStorage.setItem('volume', volume.toString());
        localStorage.setItem('previousVolume', volume.toString());
        
        // Очищаем таймаут восстановления громкости при ручном изменении
        if (this.volumeRestoreTimeout) {
            clearTimeout(this.volumeRestoreTimeout);
            this.volumeRestoreTimeout = null;
        }
        
        this.updateSliderBackground(e.target);
        this.updateVolumeIcon();
    }

    updateVolumeIcon() {
        const volume = this.audio.volume;
        if (this.audio.muted || volume === 0) {
            this.volumeIcon.className = 'fas fa-volume-mute';
        } else if (volume < 0.5) {
            this.volumeIcon.className = 'fas fa-volume-down';
        } else {
            this.volumeIcon.className = 'fas fa-volume-up';
        }
    }

    rewind() {
        this.audio.currentTime = 0;
        this.audio.play().catch((error) => {
            console.error('Error rewinding and playing audio:', error);
        });
    }

    handleEnded() {
        this.isPlaying = false;
        localStorage.setItem('isPlaying', 'false');
        this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.audio.currentTime = 0;
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating audio player');
    
    // Проверяем, не создан ли уже плеер
    if (!currentAudioPlayer) {
        new AudioPlayer();
    } else {
        console.log('Audio player already exists, reusing existing instance');
    }
}); 
