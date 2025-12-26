/**
 * Chatbot Widget - Modern floating chat interface with live AI
 * Features: Slide-up animation, responsive design, real API integration
 */

// 🌍 Define Base URL
const mwBaseUrl = window.location.origin;

class ChatbotWidget {
    constructor() {
        this.chatToggle = document.getElementById('mw-chatToggle');
        this.chatWidget = document.getElementById('mw-chatWidget');
        this.chatOverlay = document.getElementById('mw-chatOverlay');
        this.messagesContainer = document.getElementById('mw-messagesContainer');
        this.messageInput = document.getElementById('mw-messageInput');
        this.sendButton = document.getElementById('mw-sendButton');
        this.typingIndicator = document.getElementById('mw-typingIndicator');

        // --- NEW CODE: Generate/Retrieve Session ID ---
        this.sessionId = localStorage.getItem('mw_chat_session_id');
        if (!this.sessionId) {
            this.sessionId = 'session_' + Math.random().toString(36).slice(2, 11);
            localStorage.setItem('mw_chat_session_id', this.sessionId);
        }
        // ----------------------------------------------

        this.isOpen = false;
        this.isTyping = false;
        this.messageCount = 0;
        this.isInitialized = false;

        this.initializeEventListeners();
        this.autoResizeTextarea();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Toggle button click
        this.chatToggle.addEventListener('click', () => this.toggleChat());

        // Overlay click (mobile)
        this.chatOverlay.addEventListener('click', () => this.closeChat());

        // Send button click
        this.sendButton.addEventListener('click', () => this.handleSendMessage());

        // Enter key press (with Shift for new line)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Input change for auto-resize
        this.messageInput.addEventListener('input', () => this.autoResizeTextarea());

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });
    }

    /**
     * Toggle chat widget visibility
     */
    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    /**
     * Open chat widget
     */
    openChat() {
        this.isOpen = true;
        this.chatWidget.classList.add('active');
        this.chatToggle.classList.add('active');
        this.chatOverlay.classList.add('active');

        // Show welcome message only once
        if (!this.isInitialized) {
            this.showWelcomeMessage();
            this.isInitialized = true;
        }

        // Focus input after animation
        setTimeout(() => {
            this.messageInput.focus();
        }, 400);
    }

    /**
     * Close chat widget
     */
    closeChat() {
        this.isOpen = false;
        this.chatWidget.classList.remove('active');
        this.chatToggle.classList.remove('active');
        this.chatOverlay.classList.remove('active');
    }

    /**
     * Show welcome message with preset buttons
     */
    showWelcomeMessage() {
        const welcomeHTML = `
            <div class="mw-message bot">
                <div class="mw-bot-avatar">
                    <img src="./assets/images/microweb_logo_black.png" alt="Microweb Logo">
                </div>
                <div class="mw-message-content">
                    <p>👋 Hi there! Welcome to our virtual assistant. I'm here to help you with anything you need.👇 Click any question below to get started:</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
                        <button onclick="mwChatbotWidget.sendPreset('What services do you offer? List all Services...')" class="mw-cta-button">💼 Our Services</button>
                        <button onclick="mwChatbotWidget.sendPreset('How can I book a consultation?')" class="mw-cta-button">📅 Book a Consultation</button>
                        <button onclick="mwChatbotWidget.sendPreset('How can I get the contact details of this Company?')" class="mw-cta-button">📞 Contact Us!</button>
                        <button onclick="mwChatbotWidget.sendPreset('Tell me more about your company')" class="mw-cta-button">🏢 About the Company</button>
                    </div>
                </div>
            </div>
        `;

        // Remove empty state if present
        const emptyState = this.messagesContainer.querySelector('.mw-empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        this.messagesContainer.innerHTML = welcomeHTML;
        this.scrollToBottom();

        // ⏸ Pause user input for 3 seconds after showing welcome message
        this.pauseUserInput(1000);
    }

    /**
     * Auto-resize textarea based on content
     */
    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 100) + 'px';
    }

    /**
     * Handle sending a message
     */
    async handleSendMessage() {
        if (this.isTyping || this.isPaused) return;
        // block sending while typing or paused

        const message = this.messageInput.value.trim();
        if (!message) return;

        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';

        this.addMessage(message, 'user');
        this.showTypingIndicator();
        await this.sendToAPI(message);
    }

    /**
     * Send message to live API
     */
    async sendToAPI(message) {
        try {
            // const response = await fetch("https://n8n.srv1044933.hstgr.cloud/webhook/test-chat", {
            const response = await fetch("https://n8n.srv1044933.hstgr.cloud/webhook/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    sessionId: this.sessionId, // <--- SEND SESSION ID HERE
                    userId: "9a41bf85-b171-47b2-9ccc-4c1b7928944a",
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.hideTypingIndicator();
            this.addBotMessage(data.response);

        } catch (error) {
            console.error("Error:", error);
            this.hideTypingIndicator();
            this.showErrorMessage();
        }
    }

    /**
     * Pause user input for a specified duration (in milliseconds)
     */
    pauseUserInput(delayMs) {
        this.isPaused = true;

        // Change send button icon to "waiting"
        const originalIcon = this.sendButton.innerHTML;
        this.sendButton.innerHTML = '⏳'; // or any spinner / waiting icon
        this.sendButton.disabled = true; // optional: disable button visually

        setTimeout(() => {
            this.isPaused = false;
            this.sendButton.innerHTML = originalIcon; // restore original icon
            this.sendButton.disabled = false; // re-enable button
            this.messageInput.focus();
        }, delayMs);
    }

    /**
     * Add a message to the chat
     * @param {string} content - Message content
     * @param {string} type - Message type ('user' or 'bot')
     */
    addMessage(content, type) {
        // Remove empty state if present
        const emptyState = this.messagesContainer.querySelector('.mw-empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `mw-message ${type}`;

        // Add bot avatar for bot messages
        if (type === 'bot') {
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'mw-bot-avatar';
            avatarDiv.innerHTML = `
                <img src="./assets/images/microweb_logo_black.png" alt="Microweb Logo">
            `;
            messageDiv.appendChild(avatarDiv);
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'mw-message-content';
        contentDiv.textContent = content;

        messageDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        this.scrollToBottom();

        this.messageCount++;
    }

    /**
     * Add bot message with HTML content support
     */
    addBotMessage(content) {
        // Remove empty state if present
        const emptyState = this.messagesContainer.querySelector('.mw-empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = 'mw-message bot';

        // Add bot avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'mw-bot-avatar';
        avatarDiv.innerHTML = `
            <img src="./assets/images/microweb_logo_black.png" alt="Microweb Logo">
        `;
        messageDiv.appendChild(avatarDiv);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'mw-message-content';

        // Parse markdown-like content
        const parsedContent = this.parseMarkdown(content);
        contentDiv.innerHTML = parsedContent;

        messageDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        this.scrollToBottom();

        this.messageCount++;

        // ⏸ Pause user input for 3 seconds
        this.pauseUserInput(2000);
    }

    /**
     * Parse markdown-like content to HTML with enhanced formatting
     */
    parseMarkdown(content) {
        let html = content;

        // Bold text
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Italic text
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Code blocks (```code```)
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

        // Inline code (`code`)
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Headers
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

        // Unordered lists (bullet points)
        html = html.replace(/^[\s]*[-*+] (.+)$/gm, '<li>$1</li>');

        // Numbered lists
        html = html.replace(/^[\s]*\d+\. (.+)$/gm, '<li>$1</li>');

        // Wrap consecutive list items in ul/ol
        html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
            const items = match.match(/<li>.*?<\/li>/g);
            if (items && items.length > 0) {
                // Check if it's a numbered list by looking for numbers
                const isNumbered = /^\d+\./.test(match);
                const tag = isNumbered ? 'ol' : 'ul';
                return `<${tag}>${items.join('')}</${tag}>`;
            }
            return match;
        });

        // Links [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Line breaks and paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');

        // Wrap in paragraph tags
        html = '<p>' + html + '</p>';

        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>\s*<\/p>/g, '');

        return html;
    }

    /**
     * Show error message
     */
    showErrorMessage() {
        const errorHTML = `
            <div class="mw-message bot">
                <div class="mw-bot-avatar">
                    <img src="./assets/images/microweb_logo_black.png" alt="Microweb Logo">
                </div>
                <div class="mw-message-content" style="color: #ff6161; background-color: #fff1f4;">
                    <p>😅 Sorry, I couldn't reach the server this time. But don't worry, I'll be right here when you try again! <br><br> Till then, keep exploring our website 🚀:</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
                        <button onclick="window.open('${mwBaseUrl}', '_blank')" class="mw-cta-button">Home</button>
                        <button onclick="window.open('${mwBaseUrl}/services', '_blank')" class="mw-cta-button">Services</button>
                        <button onclick="window.open('${mwBaseUrl}/about', '_blank')" class="mw-cta-button">About</button>
                        <button onclick="window.open('mailto:info@microwebtec.com', '_blank')" class="mw-cta-button">Mail Us</button>
                        <button onclick="window.open('tel:+919426483914', '_blank')" class="mw-cta-button">Call Us</button>
                    </div>
                </div>
            </div>
        `;

        this.messagesContainer.innerHTML += errorHTML;
        this.scrollToBottom();
    }

    /**
     * Send preset message
     */
    sendPreset(text) {
        this.messageInput.value = text;
        this.handleSendMessage();
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        this.isTyping = true;
        this.typingIndicator.classList.add('show');
        this.sendButton.disabled = true;
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        this.isTyping = false;
        this.typingIndicator.classList.remove('show');
        this.sendButton.disabled = false;
    }

    /**
     * Scroll to the bottom of the messages container
     */
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }
}

// Initialize the chatbot widget when the page loads
let mwChatbotWidget;
document.addEventListener('DOMContentLoaded', () => {
    mwChatbotWidget = new ChatbotWidget();
});

// Handle page visibility change to refocus input
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        const messageInput = document.getElementById('mw-messageInput');
        if (messageInput) {
            messageInput.focus();
        }
    }
});
