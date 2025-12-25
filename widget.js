(function () {
    // ---------------------------------------------------------
    // 1. SETUP: Read Configuration from the Script Tag
    // ---------------------------------------------------------
    const currentScript = document.currentScript;
    const userId = currentScript.getAttribute("data-user-id");
    const integrationId = currentScript.getAttribute("data-integration-id");
    const chatbotId = currentScript.getAttribute("data-chatbot-id");
    const qdrant_collection = currentScript.getAttribute("data-qdrant-collection");
    const companyName = currentScript.getAttribute("data-company-name");
    // NEW: Read the logo URL, fallback to a default if missing
    const logoUrl = currentScript.getAttribute("data-logo-url") || "https://placehold.co/40x40/000/fff?text=AI";
    // ✅ NEW: Get the color from the script tag (default to black if missing)
    const chatbotColor = currentScript.getAttribute("data-chatbot-color") || "#000";
    const welcomeMessage = currentScript.getAttribute("data-welcome-message") || "👋 Hi there! Welcome to our virtual assistant. I'm here to help you with anything you need. <br> 👇 Click any question below to get started:";

    // ✅ NEW: Read and parse the dynamic buttons
    const quickRepliesData = currentScript.getAttribute("data-quick-replies");
    let quickReplies = [];

    const autoPopUp = currentScript.getAttribute("auto-pop-up") === "true";

    // Default fallback buttons if none are provided
    const defaultButtons = [
        { label: "💼 Our Services", text: "What services do you offer? List all Services..." },
        { label: "📅 Book a Consultation", text: "How can I book a consultation?" },
        { label: "📞 Contact Us!", text: "How can I get the contact details of this Company?" },
        { label: "🏢 About the Company", text: "Tell me more about your company" }
    ];

    try {
        if (quickRepliesData) {
            quickReplies = JSON.parse(quickRepliesData);
        } else {
            quickReplies = defaultButtons;
        }
    } catch (e) {
        console.error("Chatbot: Invalid JSON in data-quick-replies. Using defaults.");
        quickReplies = defaultButtons;
    }

    if (!userId) {
        console.error("Chatbot: Missing 'data-user-id' attribute.");
        return;
    }

    // ---------------------------------------------------------
    // 2. STYLES: Inject CSS into the Head
    // ---------------------------------------------------------
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://dlailtdjekfrovsdxepm.supabase.co/storage/v1/object/public/chatbot-assets//styles.css"; // 🔴 PASTE YOUR CSS URL HERE
    // link.href = "./styles.css"; // 🔴 PASTE YOUR CSS URL HERE
    document.head.appendChild(link);

    // ---------------------------------------------------------
    // 3. HTML: Create the Widget Structure
    // ---------------------------------------------------------
    // Only render the toggle button initially (remove overlay)
    const container = document.createElement("div");
    container.id = "mw-chatbot-container";
    container.className = "mw-chatbot-container";

    // ✅ NEW: Set the CSS variable dynamically
    container.style.setProperty('--mw-primary-color', chatbotColor);

    container.innerHTML = `
        <button class="mw-chat-toggle" id="mw-chatToggle" style="position:fixed;bottom:32px;right:32px;z-index:9999;">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
            </svg>
        </button>
    `;
    document.body.appendChild(container);

    // ---------------------------------------------------------
    // 4. LOGIC: The Chatbot Class (Refactored)
    // ---------------------------------------------------------
    // REMOVE the following block (from here...)
    /*
    class ChatbotWidget {
        constructor() {
            // ...existing code...
        }
        // ...existing code...
    }
    */
    // ...to here (end of first ChatbotWidget class definition)...
    // ---------------------------------------------------------
    // 5. INITIALIZATION: Run the Widget
    // ---------------------------------------------------------
    // --- NEW: Fetch chatbot details and validate domain ---
    async function fetchChatbotDetailsAndValidate() {
        if (!chatbotId) {
            showError("Chatbot: Missing 'data-chatbot-id' attribute.");
            return false;
        }
        try {
            const resp = await fetch("https://dlailtdjekfrovsdxepm.supabase.co/functions/v1/get-chatbots-data?chatbot_id=" + encodeURIComponent(chatbotId), {
                headers: {
                    // FIX: Use the raw API key string, no =, no quotes
                    "x-api-key": "^5H|;eSOWHlBcr:\"Bp4[6fF8Z$oI&|"
                }
            });
            if (!resp.ok) throw new Error("Failed to fetch chatbot details");
            const apiResult = await resp.json();

            // Debug log the API response
            console.log("Chatbot: API Response", apiResult);

            // Accept both array and object responses
            let chatbotData = null;
            if (Array.isArray(apiResult) && apiResult.length > 0 && apiResult[0]?.success && apiResult[0]?.data) {
                chatbotData = apiResult[0].data;
            } else if (apiResult?.success && apiResult?.data) {
                chatbotData = apiResult.data;
            } else {
                throw new Error("Invalid chatbot data (not found or malformed)");
            }

            // Extract allowed domain from website_url
            let allowedUrl = chatbotData.website_url || "";
            if (!allowedUrl) throw new Error("No website_url configured for this chatbot");
            // Normalize domain (strip protocol, www, trailing slash)
            const allowedDomain = allowedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
            // const allowedDomain = "n8n-lovable-chatbot.vercel.app";
            // const allowedDomain = "127.0.0.1";
            const currentDomain = window.location.hostname.replace(/^www\./, '');
            if (!currentDomain.endsWith(allowedDomain)) {
                showError(
                    `<b>Chatbot Error</b><br>
                    This chatbot is only allowed on<br> this domain: <u>${allowedDomain}</u>.<br>
                    Current domain is: <u>${currentDomain}</u>`
                );
                return false;
            }
            // Optionally: update logo, companyName, etc. from chatbotData
            if (chatbotData.company_logo_url) currentScript.setAttribute("data-logo-url", chatbotData.company_logo_url);
            if (chatbotData.company_name) currentScript.setAttribute("data-company-name", chatbotData.company_name);
            if (chatbotData.chatbot_bg_color) currentScript.setAttribute("data-chatbot-color", chatbotData.chatbot_bg_color);
            if (chatbotData.chatbot_welcome_msg) currentScript.setAttribute("data-welcome-message", chatbotData.chatbot_welcome_msg);
            if (chatbotData.qdrant_collection_name) currentScript.setAttribute("data-qdrant-collection", chatbotData.qdrant_collection_name);
            if (Array.isArray(chatbotData.chatbot_buttons) && chatbotData.chatbot_buttons.length > 0) {
                currentScript.setAttribute("data-quick-replies", JSON.stringify(chatbotData.chatbot_buttons));
            }
            // --- ADD: Store custom_prompt if present ---
            if (chatbotData.custom_prompt) customPrompt = chatbotData.custom_prompt;
            // --- END ADD ---
            // --- ADD: Store links_data if present ---
            if (chatbotData.links_data) linksData = chatbotData.links_data;
            // --- END ADD ---
            return true;
        } catch (err) {
            showError("Chatbot Error: " + err.message);
            return false;
        }
    }

    // --- NEW: Show error message in place of widget ---
    function showError(msg) {
        let container = document.getElementById("mw-chatbot-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "mw-chatbot-container";
            container.className = "mw-chatbot-container";
            document.body.appendChild(container);
        }
        container.innerHTML = `
            <div style="max-width:350px;margin:40px auto;padding:24px 16px;background:#fff3f3;border:1px solid #ffbdbd;border-radius:12px;color:#b71c1c;font-family:sans-serif;text-align:center;box-shadow:0 2px 8px #0001;">
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" style="margin-bottom:8px;"><circle cx="12" cy="12" r="10" fill="#ffebee"/><path d="M12 8v4m0 4h.01" stroke="#b71c1c" stroke-width="2" stroke-linecap="round"/></svg>
                <div style="font-size:16px;">${msg}</div>
            </div>
        `;
    }

    // --- NEW: Main entry point with validation ---
    async function main() {
        // --- ADD: Conversation history array (in-memory) ---
        let conversationHistory = [];

        const valid = await fetchChatbotDetailsAndValidate();
        if (!valid) return;

        // Only create the container and toggle button ONCE, here
        let container = document.getElementById("mw-chatbot-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "mw-chatbot-container";
            container.className = "mw-chatbot-container";
            container.style.setProperty('--mw-primary-color', chatbotColor);
            container.innerHTML = `
                <button class="mw-chat-toggle" id="mw-chatToggle" style="position:fixed;bottom:32px;right:32px;z-index:9999;">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                    </svg>
                </button>
            `;
            document.body.appendChild(container);
        }

        // ---------------------------------------------------------
        // 4. LOGIC: The Chatbot Class (Refactored)
        // ---------------------------------------------------------
        class ChatbotWidget {
            constructor() {
                this.container = document.getElementById("mw-chatbot-container");
                this.chatToggle = this.container.querySelector("#mw-chatToggle");
                this.chatWidget = null; // Will be created on open

                this.isOpen = false;
                this.isInitialized = false;
                this.isAnimating = false; // Prevent double open/close during animation

                // Chat icon SVGs
                this.chatIconSVG = `<svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>`;
                this.plusIconSVG = `<svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </svg>`;

                this.handleAnimationEnd = this.handleAnimationEnd.bind(this);
                this.handleToggleClick = this.toggleChat.bind(this);

                this.initializeEventListeners();
            }

            initializeEventListeners() {
                // Remove previous listeners to avoid stacking
                this.chatToggle.onclick = null;
                this.chatToggle.removeEventListener("click", this.handleToggleClick);
                this.chatToggle.addEventListener("click", this.handleToggleClick);

                // Overlay logic removed
                // ...existing code...
            }

            toggleChat() {
                if (this.isAnimating) return;
                if (this.isOpen) {
                    this.closeChat();
                } else {
                    this.openChat();
                }
            }

            openChat() {
                if (this.isOpen || this.isAnimating) return;
                if (!this.chatWidget) {
                    // Create chat widget only when opened
                    this.chatWidget = document.createElement("div");
                    this.chatWidget.className = "mw-chat-widget";
                    this.chatWidget.id = "mw-chatWidget";
                    this.chatWidget.innerHTML = `
                        <div class="mw-chat-header">
                            <div class="mw-chat-header-content">
                                <div class="mw-chat-logo">
                                    <img src="${logoUrl}" alt="Logo"> 
                                </div>
                                <div>
                                    <h3>AI Assistant</h3>
                                    <div class="mw-chat-status">
                                        <div class="mw-status-dot"></div>
                                        <span>Online</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mw-messages-container" id="mw-messagesContainer">
                            <div class="mw-empty-state">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg>
                                <div>Start a conversation</div>
                            </div>
                        </div>
                        <div class="mw-typing-indicator" id="mw-typingIndicator">
                            <div class="mw-typing-dots">
                                <div class="mw-typing-dot"></div>
                                <div class="mw-typing-dot"></div>
                                <div class="mw-typing-dot"></div>
                            </div>
                        </div>
                        <div class="mw-input-container">
                            <div class="mw-input-wrapper">
                                <textarea id="mw-messageInput" placeholder="Type your message..." rows="1"></textarea>
                            </div>
                            <button class="mw-send-button" id="mw-sendButton" type="button">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                            </button>
                        </div>
                        <div class="mw-chat-footer">
                            <p>Powered by <u><a href="https://www.microwebtec.com/" target="_blank">Microweb Software</a></u></p>
                        </div>
                    `;
                    this.container.appendChild(this.chatWidget);

                    // Setup references for widget elements
                    this.messagesContainer = this.chatWidget.querySelector("#mw-messagesContainer");
                    this.messageInput = this.chatWidget.querySelector("#mw-messageInput");
                    this.sendButton = this.chatWidget.querySelector("#mw-sendButton");
                    this.typingIndicator = this.chatWidget.querySelector("#mw-typingIndicator");

                    // --- ADD: Attach send button and Enter key event listeners ---
                    this.sendButton.onclick = () => this.handleSendMessage();
                    this.messageInput.onkeydown = (e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            this.handleSendMessage();
                        }
                    };
                    // --- END ADD ---

                    // Session ID Logic (Persistent across page reloads)
                    this.sessionId = localStorage.getItem("mw_chat_session_id");
                    if (!this.sessionId) {
                        this.sessionId = "session_" + Math.random().toString(36).slice(2, 11);
                        localStorage.setItem("mw_chat_session_id", this.sessionId);
                    }

                    this.isOpen = false;
                    this.isTyping = false;
                    this.isInitialized = false;

                    this.initializeEventListeners();
                    this.autoResizeTextarea();
                }
                // Remove any previous animationend listeners
                this.chatWidget.removeEventListener("animationend", this.handleAnimationEnd);

                // Animation: Remove closing, add opening
                this.chatWidget.classList.remove("mw-chat-closing");
                this.chatWidget.classList.add("mw-chat-opening");
                this.chatWidget.classList.add("active");
                this.chatToggle.classList.add("active");
                // Overlay logic removed

                // Remove animation class after animation ends
                this.chatWidget.addEventListener("animationend", this.handleAnimationEnd);

                // Change icon to plus
                this.chatToggle.innerHTML = this.plusIconSVG;
                this.initializeEventListeners();

                this.isAnimating = true;
                this.animatingAction = "open";

                // Show welcome message on first open
                if (!this.isInitialized) {
                    this.showWelcomeMessage();
                    this.isInitialized = true;
                }
                // Focus input after animation
                setTimeout(() => this.messageInput.focus(), 400);
            }

            closeChat() {
                if (!this.isOpen || this.isAnimating) return;
                if (this.chatWidget) {
                    // Remove any previous animationend listeners
                    this.chatWidget.removeEventListener("animationend", this.handleAnimationEnd);

                    // Animation: Remove opening, add closing
                    this.chatWidget.classList.remove("mw-chat-opening");
                    this.chatWidget.classList.add("mw-chat-closing");
                    this.chatWidget.addEventListener("animationend", this.handleAnimationEnd);
                }
                this.chatToggle.classList.remove("active");
                // Overlay logic removed

                // Change icon back to chat
                this.chatToggle.innerHTML = this.chatIconSVG;
                this.initializeEventListeners();

                this.isAnimating = true;
                this.animatingAction = "close";
            }

            handleAnimationEnd(e) {
                if (!this.chatWidget) return;
                if (this.animatingAction === "open") {
                    this.chatWidget.classList.remove("mw-chat-opening");
                    this.isOpen = true;
                } else if (this.animatingAction === "close") {
                    this.chatWidget.classList.remove("active");
                    this.chatWidget.classList.remove("mw-chat-closing");
                    this.isOpen = false;
                }
                this.isAnimating = false;
                this.animatingAction = null;
                this.chatWidget.removeEventListener("animationend", this.handleAnimationEnd);
            }

            autoResizeTextarea() {
                this.messageInput.style.height = "auto";
                this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 100) + "px";
            }

            addMessage(content, type) {
                const emptyState = this.messagesContainer.querySelector(".mw-empty-state");
                if (emptyState) emptyState.remove();

                const messageDiv = document.createElement("div");
                messageDiv.className = `mw-message ${type}`;

                if (type === "bot") {
                    const avatarDiv = document.createElement("div");
                    avatarDiv.className = "mw-bot-avatar";
                    avatarDiv.innerHTML = `<img src="${logoUrl}" alt="Bot">`;
                    messageDiv.appendChild(avatarDiv);

                    const contentDiv = document.createElement("div");
                    contentDiv.className = "mw-message-content";
                    contentDiv.innerHTML = this.parseMarkdown(content);
                    messageDiv.appendChild(contentDiv);
                } else {
                    // User message
                    const contentDiv = document.createElement("div");
                    contentDiv.className = "mw-message-content";
                    contentDiv.textContent = content;
                    messageDiv.appendChild(contentDiv);
                }

                this.messagesContainer.appendChild(messageDiv);
                this.scrollToBottom();
            }

            parseMarkdown(content) {
                // Enhanced Markdown Parser for headings, lists, bold, italic, and links
                let html = content;

                // Headings (###, ##, #)
                html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
                html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
                html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

                // Unordered lists (- or *)
                html = html.replace(/(?:^|\n)([-*]) (.*?)(?=\n|$)/g, function (match, bullet, item) {
                    return `<li>${item}</li>`;
                });
                // Wrap consecutive <li> in <ul>
                html = html.replace(/(<li>[\s\S]*?<\/li>)/g, function (match) {
                    // If already inside <ul>, skip
                    if (/^<ul>[\s\S]*<\/ul>$/.test(match)) return match;
                    return `<ul>${match}</ul>`;
                });

                // Bold
                html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // Italic
                html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
                // Links
                html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
                // Newlines (except inside <ul>)
                html = html.replace(/(?<!<\/ul>)\n/g, '<br>');

                return html;
            }

            // showWelcomeMessage() {
            //     const welcomeHTML = `
            //         <div class="mw-message bot">
            //             <div class="mw-bot-avatar"><img src="${logoUrl}"></div>
            //             <div class="mw-message-content">
            //                 <p>${welcomeMessage}</p>
            //                 <div class="mw-preset-buttons" style="margin-top:10px; display:flex; gap:5px; flex-wrap:wrap;">
            //                     <button class="mw-cta-button" data-text="What services do you offer? List all Services...">💼 Our Services</button>
            //                     <button class="mw-cta-button" data-text="How can I book a consultation?">📅 Book a Consultation</button>
            //                     <button class="mw-cta-button" data-text="How can I get the contact details of this Company?">📞 Contact Us!</button>
            //                     <button class="mw-cta-button" data-text="Tell me more about your company">🏢 About the Company</button>
            //                 </div>
            //             </div>
            //         </div>
            //     `;
            //     this.messagesContainer.innerHTML = welcomeHTML;

            //     // Attach event listeners to the dynamic buttons
            //     const buttons = this.messagesContainer.querySelectorAll(".mw-cta-button");
            //     buttons.forEach(btn => {
            //         btn.addEventListener("click", () => {
            //             const text = btn.getAttribute("data-text");
            //             this.messageInput.value = text;
            //             this.handleSendMessage();
            //         });
            //     });
            // }

            showWelcomeMessage() {
                // 1. Generate the HTML for buttons dynamically
                let buttonsHTML = '';

                // Loop through the quickReplies array
                quickReplies.forEach(btn => {
                    // Sanitize input to prevent breaking HTML
                    const label = btn.label || "Click me";
                    const text = btn.text || label;

                    buttonsHTML += `
                        <button class="mw-cta-button" data-text="${text}">${label}</button>
                    `;
                });

                const welcomeHTML = `
                    <div class="mw-message bot">
                        <div class="mw-bot-avatar"><img src="${logoUrl}"></div>
                        <div class="mw-message-content">
                            <p>${welcomeMessage}</p>
                            <div class="mw-preset-buttons" style="margin-top:10px; display:flex; gap:5px; flex-wrap:wrap;">
                                ${buttonsHTML} </div>
                        </div>
                    </div>
                `;
                this.messagesContainer.innerHTML = welcomeHTML;

                // Attach event listeners to the dynamic buttons
                const buttons = this.messagesContainer.querySelectorAll(".mw-cta-button");
                buttons.forEach(btn => {
                    btn.addEventListener("click", () => {
                        const text = btn.getAttribute("data-text");
                        this.messageInput.value = text;
                        this.handleSendMessage();
                    });
                });
            }


            async handleSendMessage() {
                const message = this.messageInput.value.trim();
                if (!message) return;

                // Clear input and show user message
                this.messageInput.value = "";
                this.autoResizeTextarea();
                this.addMessage(message, "user");

                // --- ADD: Add user message to conversation history ---
                conversationHistory.push({ role: "user", content: message });

                this.showTypingIndicator();

                try {
                    // 🚀 API Call to Backend
                    const response = await fetch("https://n8n.srv1044933.hstgr.cloud/webhook/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            message: message,
                            sessionId: this.sessionId, // sessionId is already included here
                            userId: userId,
                            integrationId: integrationId,
                            chatbotId: chatbotId,
                            companyName: companyName,
                            collection: qdrant_collection,
                            // --- ADD: Send customPrompt ---
                            customPrompt: customPrompt,
                            // --- ADD: Send linksData ---
                            links_data: linksData,
                            // --- ADD: Send last 10 messages as chat_history ---
                            chat_history: conversationHistory.slice(-10)
                        })
                    });

                    if (!response.ok) throw new Error("Network error");
                    const data = await response.json();

                    this.hideTypingIndicator();
                    this.addBotMessage(data.response);

                    // --- ADD: Add bot response to conversation history ---
                    conversationHistory.push({ role: "assistant", content: data.response });

                } catch (error) {
                    console.error(error);
                    this.hideTypingIndicator();
                    this.addBotMessage("⚠️ Sorry, I'm having trouble connecting right now.");
                    // Optionally: Add error to history as assistant message
                    conversationHistory.push({ role: "assistant", content: "⚠️ Sorry, I'm having trouble connecting right now." });
                }
            }

            showTypingIndicator() {
                this.typingIndicator.classList.add("show");
                this.scrollToBottom();
            }

            hideTypingIndicator() {
                this.typingIndicator.classList.remove("show");
            }

            scrollToBottom() {
                setTimeout(() => {
                    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
                }, 100);
            }

            addBotMessage(content) {
                this.addMessage(content, "bot");
            }
        }

        if (document.readyState === "complete" || document.readyState === "interactive") {
            const widget = new ChatbotWidget();
            if (autoPopUp) {
                widget.openChat();
            }
        } else {
            document.addEventListener("DOMContentLoaded", () => {
                const widget = new ChatbotWidget();
                if (autoPopUp) {
                    widget.openChat();
                }
            });
        }
    }

    // --- Replace direct initialization with main() ---
    main();

    // ---------------------------------------------------------
    // 6. DEBUG: Log Page and Chatbot Info
    // ---------------------------------------------------------
    // Log current page URL and title
    console.log("Chatbot: Page URL:", window.location.href);
    console.log("Chatbot: Page Title:", document.title);
    // Log chatbot configuration
    console.log("Chatbot: Configuration", {
        userId,
        integrationId,
        chatbotId,
        qdrant_collection,
        companyName,
        logoUrl,
        chatbotColor,
        welcomeMessage,
        quickReplies,
        autoPopUp
    });
})();