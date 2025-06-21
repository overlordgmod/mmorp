let ws = null;
let isWebSocketReady = false;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 3000;
let reconnectTimeout = null;
let heartbeatInterval = null;
const HEARTBEAT_INTERVAL = 30000; // 30 секунд

// Функция для закрытия WebSocket соединения
function closeWebSocket() {
    if (ws) {
        ws.close();
        ws = null;
    }
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    isWebSocketReady = false;
    isConnecting = false;
    reconnectAttempts = 0;
}

// Функция для переподключения WebSocket
function reconnectWebSocket() {
    console.log('[chat.js] Reconnecting WebSocket due to auth change...');
    closeWebSocket();
    connectWebSocket();
}

// Функция для добавления сообщения в чат
function addMessage(message, type) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;

    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${type}`;
    
    const textElement = document.createElement('div');
    textElement.className = 'message-text';
    textElement.textContent = message;
    messageElement.appendChild(textElement);
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Инициализация WebSocket connection
function connectWebSocket() {
    if (isConnecting) {
        console.log('[chat.js] WebSocket connection already in progress');
        return;
    }

    if (ws) {
        console.log('[chat.js] WebSocket already connected');
        return;
    }

    isConnecting = true;
    console.log('[chat.js] Connecting WebSocket...');
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    ws = new WebSocket(wsUrl);

    // Generate or retrieve unique client ID
    let clientId = localStorage.getItem('clientId');
    if (!clientId) {
        clientId = 'user-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('clientId', clientId);
    }

    ws.onopen = () => {
        console.log('[chat.js] WebSocket connected');
        // Отправляем init сообщение с clientId
        const initMessage = { 
            type: 'init', 
            clientId: clientId 
        };
        console.log('[chat.js] Sending init message:', initMessage);
        ws.send(JSON.stringify(initMessage));

        // Запускаем heartbeat для поддержания соединения
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
        }
        heartbeatInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'heartbeat' }));
            }
        }, HEARTBEAT_INTERVAL);

        isWebSocketReady = true;
        isConnecting = false;
        reconnectAttempts = 0;
    };

    ws.onmessage = event => {
        const data = JSON.parse(event.data);
        console.log('[chat.js] Received WebSocket message:', data);
        
        switch (data.type) {
            case 'message':
                addMessage(data.message, 'bot');
                break;
            
            case 'message_sent':
                addMessage(data.message, 'user');
                break;
            
            case 'error':
                addMessage(data.message, 'error');
                break;
        }
    };

    ws.onclose = () => {
        console.log('[chat.js] WebSocket connection closed');
        isWebSocketReady = false;
        isConnecting = false;

        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`[chat.js] Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            reconnectTimeout = setTimeout(connectWebSocket, RECONNECT_DELAY);
        } else {
            console.log('[chat.js] Max reconnection attempts reached');
            addMessage('Соединение потеряно. Пожалуйста, обновите страницу.', 'error');
        }
    };

    ws.onerror = (error) => {
        console.error('[chat.js] WebSocket error:', error);
        addMessage('Ошибка соединения. Пожалуйста, попробуйте позже.', 'error');
    };
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('[chat.js] DOM Content Loaded. Initializing...');

    // Инициализация элементов диалогового окна
    const container = document.getElementById("helper-container");
    const img = document.getElementById("helper-img");
    const dialog = document.getElementById("helper-dialog");
    const closeBtn = document.getElementById("close-dialog");
    const nextBtn = document.getElementById("next-phrase");
    const toggleChatBtn = document.getElementById("toggle-chat");
    const textBox = dialog.querySelector(".dialog-text");
    const chatContainer = dialog.querySelector(".chat-container");
    const chatInput = document.getElementById("chat-input");
    const sendButton = document.getElementById("send-message");

    // Кнопка чата
    if (toggleChatBtn) {
        toggleChatBtn.addEventListener("click", () => {
            const isChatVisible = chatContainer && chatContainer.style.display !== "none";
            
            if (!isChatVisible) {
                // Показываем чат
                chatContainer.style.display = "block";
                textBox.style.display = "none";
                nextBtn.style.display = "none";
                toggleChatBtn.style.display = "none";
                dialog.classList.add('expanded-chat');
                
                // Подключаем WebSocket
                if (!ws && !isConnecting) {
                    connectWebSocket();
                }
            }
        });
    }

    // Добавляем обработчик отправки сообщений
    if (chatInput && sendButton) {
        const sendMessage = () => {
            if (!isWebSocketReady || !ws) {
                console.log('[chat.js] Cannot send message: WebSocket not ready');
                return;
            }

            const message = chatInput.value.trim();
            if (message) {
                ws.send(JSON.stringify({
                    type: 'message',
                    message: message
                }));
                chatInput.value = '';
            }
        };

        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // --- Auth Logic ---
    
    // Функция для проверки сессии
    async function checkSession() {
        try {
            const response = await fetch('/auth/session');
            return await response.json();
        } catch (error) {
            console.error('Ошибка при проверке сессии:', error);
            return { authenticated: false };
        }
    }

    // Инициализация кнопки входа через Discord
    function initDiscordLogin() {
        const loginBtn = document.querySelector('.discord-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                const width = 600, height = 750;
                const left = (window.screen.width / 2) - (width / 2);
                const top = (window.screen.height / 2) - (height / 2);
                const authUrl = '/auth/discord';
                const authWindow = window.open(authUrl, 'discordAuth', `width=${width},height=${height},top=${top},left=${left}`);
                if (window.focus) {
                    authWindow.focus();
                }
            });
        }
    }

    function initLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await fetch('/auth/logout', { method: 'POST' });
                    updateUIForUnauthenticated();
                    // Также отключаем чат при выходе
                    closeWebSocket();
                } catch (error) {
                    console.error('Ошибка при выходе:', error);
                }
            });
        }
    }

    function updateUIForAuthenticated(user) {
        const authContainer = document.getElementById('auth-container');
        const userInfo = document.getElementById('user-info');
        
        if (authContainer) authContainer.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'flex';
            const avatar = document.getElementById('user-avatar');
            const username = document.getElementById('user-name');
            const discriminator = document.getElementById('user-discriminator');
            if(avatar) avatar.src = user.avatar;
            if(username) username.textContent = user.username;
            if(discriminator) discriminator.textContent = `#${user.discriminator}`;
        }
    }

    function updateUIForUnauthenticated() {
        const authContainer = document.getElementById('auth-container');
        const userInfo = document.getElementById('user-info');
        
        if (authContainer) authContainer.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
    }

    // Инициализация логики авторизации
    initDiscordLogin();
    initLogout();
    
    checkSession().then(data => {
        if (data.authenticated) {
            updateUIForAuthenticated(data.user);
        } else {
            updateUIForUnauthenticated();
        }
    });

    // Слушатель для сообщений от окна авторизации
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'authSuccess') {
            updateUIForAuthenticated(event.data.user);
            // Переподключаем WebSocket, чтобы он использовал новую сессию
            reconnectWebSocket();
        }
    });
}); 
