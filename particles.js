// Скрипт для создания анимации частиц на всех страницах
document.addEventListener('DOMContentLoaded', function() {
    // Создаем контейнер для летающих частиц
    const flyingContainer = document.createElement('div');
    flyingContainer.className = 'flying-particles';
    document.body.appendChild(flyingContainer);

    // Создаем контейнер для дополнительных частиц
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles';
    document.body.appendChild(particlesContainer);

    // Создаем летающие частицы
    const PARTICLE_COUNT = 80;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = document.createElement('span');

        // случайная позиция по горизонтали
        const x = Math.random() * 100; // в процентах
        // задержка старта, чтобы не вылетали сразу все
        const delay = Math.random() * 10; // в секундах
        // длительность полёта (±20%)
        const duration = 8 + Math.random() * 4; // сек

        p.style.left = x + 'vw';
        p.style.animationDuration = `${duration}s, ${4 + Math.random()*2}s`;
        p.style.animationDelay = `${delay}s, ${delay}s`;

        flyingContainer.appendChild(p);
    }

    // Создаем дополнительные частицы разных размеров
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particlesContainer.appendChild(particle);
    }
}); 