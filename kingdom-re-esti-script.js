document.addEventListener('DOMContentLoaded', function() {
    
    
    const floatingNav = document.getElementById('floatingNav');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const readingProgress = document.getElementById('readingProgress');
    const navItems = document.querySelectorAll('.nav-item');

    
    let isNavOpen = false;

    
    navToggle.addEventListener('click', function() {
        isNavOpen = !isNavOpen;
        navMenu.classList.toggle('nav-menu-open', isNavOpen);
        navToggle.classList.toggle('nav-toggle-active', isNavOpen);
        
        
        const icon = navToggle.querySelector('span:first-child');
        icon.style.transform = isNavOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    
    document.addEventListener('click', function(event) {
        if (!floatingNav.contains(event.target) && isNavOpen) {
            isNavOpen = false;
            navMenu.classList.remove('nav-menu-open');
            navToggle.classList.remove('nav-toggle-active');
            const icon = navToggle.querySelector('span:first-child');
            icon.style.transform = 'rotate(0deg)';
        }
    });

    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                
                isNavOpen = false;
                navMenu.classList.remove('nav-menu-open');
                navToggle.classList.remove('nav-toggle-active');
                const icon = navToggle.querySelector('span:first-child');
                icon.style.transform = 'rotate(0deg)';
                
                
                targetElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start',
                    inline: 'nearest'
                });
                
                
                targetElement.classList.add('section-highlight');
                setTimeout(() => {
                    targetElement.classList.remove('section-highlight');
                }, 2000);
            }
        });
    });

    
    let ticking = false;
    
    function updateOnScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / scrollHeight) * 100;
        
        
        readingProgress.style.width = scrollPercent + '%';
        
        
        updateActiveNavItem();
        
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateOnScroll);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick);

    
    function updateActiveNavItem() {
        const sections = document.querySelectorAll('.center-title[id], .main-title[id]');
        let activeSection = null;
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
                activeSection = section.id;
            }
        });
        
        
        navItems.forEach(item => {
            const targetId = item.getAttribute('data-target');
            if (targetId === activeSection) {
                item.classList.add('nav-item-active');
            } else {
                item.classList.remove('nav-item-active');
            }
        });
    }

    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-visible');
            }
        });
    }, observerOptions);

    
    const rulesBoxes = document.querySelectorAll('.rules-box');
    rulesBoxes.forEach(box => {
        box.classList.add('fade-in');
        observer.observe(box);
    });

    
    function createSearchFunction() {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '🔍 Поиск по уставу...';
        searchInput.className = 'search-input';
        searchInput.id = 'searchInput';
        
        
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.appendChild(searchInput);
        navMenu.insertBefore(searchContainer, navMenu.firstChild);
        
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.toLowerCase().trim();
            
            searchTimeout = setTimeout(() => {
                if (query.length > 2) {
                    highlightSearchResults(query);
                } else {
                    clearSearchHighlights();
                }
            }, 300);
        });
    }

    
    function highlightSearchResults(query) {
        clearSearchHighlights();
        
        const textNodes = getTextNodes(document.querySelector('.container'));
        let foundCount = 0;
        
        textNodes.forEach(node => {
            const text = node.textContent;
            const lowerText = text.toLowerCase();
            
            if (lowerText.includes(query)) {
                const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
                const highlightedText = text.replace(regex, '<mark class="search-highlight">$1</mark>');
                
                const wrapper = document.createElement('span');
                wrapper.innerHTML = highlightedText;
                node.parentNode.replaceChild(wrapper, node);
                foundCount++;
            }
        });
        
        
        showSearchResults(foundCount);
    }

    
    function clearSearchHighlights() {
        const highlights = document.querySelectorAll('.search-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });
        
        const searchResults = document.querySelector('.search-results');
        if (searchResults) {
            searchResults.remove();
        }
    }

    
    function getTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim().length > 0) {
                textNodes.push(node);
            }
        }
        
        return textNodes;
    }

    
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    
    function showSearchResults(count) {
        const existingResults = document.querySelector('.search-results');
        if (existingResults) {
            existingResults.remove();
        }
        
        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'search-results';
        resultsDiv.textContent = `Найдено совпадений: ${count}`;
        
        const searchContainer = document.querySelector('.search-container');
        searchContainer.appendChild(resultsDiv);
    }

    
    createSearchFunction();

    
    document.addEventListener('keydown', function(event) {
        
        if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
            event.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                if (!isNavOpen) {
                    navToggle.click();
                }
                setTimeout(() => {
                    searchInput.focus();
                }, 100);
            }
        }
        
        
        if (event.key === 'Escape' && isNavOpen) {
            navToggle.click();
        }
        
        
        if (event.key === 'ArrowDown' && event.ctrlKey) {
            event.preventDefault();
            navigateToNextSection();
        }
        
        if (event.key === 'ArrowUp' && event.ctrlKey) {
            event.preventDefault();
            navigateToPrevSection();
        }
    });

    
    function navigateToNextSection() {
        const sections = Array.from(document.querySelectorAll('.center-title[id], .main-title[id]'));
        const currentSection = sections.find(section => {
            const rect = section.getBoundingClientRect();
            return rect.top <= 100 && rect.bottom >= 100;
        });
        
        if (currentSection) {
            const currentIndex = sections.indexOf(currentSection);
            const nextSection = sections[currentIndex + 1];
            if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    function navigateToPrevSection() {
        const sections = Array.from(document.querySelectorAll('.center-title[id], .main-title[id]'));
        const currentSection = sections.find(section => {
            const rect = section.getBoundingClientRect();
            return rect.top <= 100 && rect.bottom >= 100;
        });
        
        if (currentSection) {
            const currentIndex = sections.indexOf(currentSection);
            const prevSection = sections[currentIndex - 1];
            if (prevSection) {
                prevSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    
    updateOnScroll();
    
    console.log('🏰 Устав Королевства Ре-Эсти загружен!');
    console.log('💡 Горячие клавиши:');
    console.log('   Ctrl+F - Поиск по тексту');
    console.log('   Escape - Закрыть меню');
    console.log('   Ctrl+↑/↓ - Навигация по разделам');
}); 
