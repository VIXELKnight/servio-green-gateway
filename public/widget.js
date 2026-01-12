(function() {
  'use strict';

  // Get embed key from script tag
  const script = document.currentScript;
  const embedKey = script?.getAttribute('data-embed-key');
  
  if (!embedKey) {
    console.error('Servio Widget: Missing data-embed-key attribute');
    return;
  }

  // API base URL - use the Supabase project URL
  const API_BASE = 'https://mjruadmnoaqeprygjcre.supabase.co/functions/v1';
  
  // Debug mode for testing
  const DEBUG = window.location.hostname === 'localhost' || window.location.hostname.includes('lovableproject');
  
  // Generate visitor ID
  function getVisitorId() {
    let visitorId = localStorage.getItem('servio_visitor_id');
    if (!visitorId) {
      visitorId = 'v_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('servio_visitor_id', visitorId);
    }
    return visitorId;
  }

  // Create widget container
  const container = document.createElement('div');
  container.id = 'servio-widget-container';
  container.innerHTML = `
    <style>
      #servio-widget-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      #servio-toggle-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      #servio-toggle-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(16, 185, 129, 0.5);
      }
      
      #servio-toggle-btn svg {
        width: 28px;
        height: 28px;
        fill: white;
      }
      
      #servio-chat-window {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 380px;
        max-width: calc(100vw - 40px);
        height: 520px;
        max-height: calc(100vh - 120px);
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
        animation: slideUp 0.3s ease;
      }
      
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      #servio-chat-window.open {
        display: flex;
      }
      
      #servio-header {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      #servio-header-avatar {
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      #servio-header-info h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      #servio-header-info p {
        margin: 2px 0 0;
        font-size: 12px;
        opacity: 0.9;
      }
      
      #servio-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f9fafb;
      }
      
      .servio-message {
        margin-bottom: 12px;
        display: flex;
      }
      
      .servio-message.user {
        justify-content: flex-end;
      }
      
      .servio-message-bubble {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .servio-message.user .servio-message-bubble {
        background: #10b981;
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      .servio-message.bot .servio-message-bubble {
        background: white;
        color: #1f2937;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }
      
      .servio-typing {
        display: flex;
        gap: 4px;
        padding: 12px;
      }
      
      .servio-typing span {
        width: 8px;
        height: 8px;
        background: #9ca3af;
        border-radius: 50%;
        animation: typing 1.4s infinite;
      }
      
      .servio-typing span:nth-child(2) { animation-delay: 0.2s; }
      .servio-typing span:nth-child(3) { animation-delay: 0.4s; }
      
      @keyframes typing {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-6px); }
      }
      
      #servio-input-area {
        padding: 12px;
        background: white;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
      }
      
      #servio-input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #e5e7eb;
        border-radius: 24px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      
      #servio-input:focus {
        border-color: #10b981;
      }
      
      #servio-send-btn {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 50%;
        background: #10b981;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      
      #servio-send-btn:hover {
        background: #059669;
      }
      
      #servio-send-btn:disabled {
        background: #d1d5db;
        cursor: not-allowed;
      }
    </style>
    
    <div id="servio-chat-window">
      <div id="servio-header">
        <div id="servio-header-avatar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
          </svg>
        </div>
        <div id="servio-header-info">
          <h3 id="servio-bot-name">Support</h3>
          <p>Online • Typically replies instantly</p>
        </div>
      </div>
      <div id="servio-messages"></div>
      <div id="servio-input-area">
        <input type="text" id="servio-input" placeholder="Type a message..." />
        <button id="servio-send-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
    
    <button id="servio-toggle-btn">
      <svg viewBox="0 0 24 24">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    </button>
  `;
  
  document.body.appendChild(container);

  // Elements
  const toggleBtn = document.getElementById('servio-toggle-btn');
  const chatWindow = document.getElementById('servio-chat-window');
  const messagesContainer = document.getElementById('servio-messages');
  const input = document.getElementById('servio-input');
  const sendBtn = document.getElementById('servio-send-btn');
  const botNameEl = document.getElementById('servio-bot-name');

  // State
  let isOpen = false;
  let conversationId = null;
  let isLoading = false;
  const visitorId = getVisitorId();

  // Toggle chat window
  toggleBtn.addEventListener('click', () => {
    isOpen = !isOpen;
    chatWindow.classList.toggle('open', isOpen);
    if (isOpen && messagesContainer.children.length === 0) {
      initBot();
    }
  });

  // Initialize bot
  async function initBot() {
    try {
      const response = await fetch(`${API_BASE}/bot-init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embed_key: embedKey })
      });
      
      if (!response.ok) throw new Error('Failed to initialize bot');
      
      const data = await response.json();
      botNameEl.textContent = data.bot_name || 'Support';
      addMessage(data.welcome_message || 'Hello! How can I help you today?', 'bot');
    } catch (error) {
      console.error('Servio Widget: Init error', error);
      addMessage('Hello! How can I help you today?', 'bot');
    }
  }

  // Add message to chat
  function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `servio-message ${sender}`;
    msgDiv.innerHTML = `<div class="servio-message-bubble">${escapeHtml(text)}</div>`;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Show typing indicator
  function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'servio-message bot';
    typingDiv.id = 'servio-typing';
    typingDiv.innerHTML = `
      <div class="servio-message-bubble">
        <div class="servio-typing">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Hide typing indicator
  function hideTyping() {
    const typingEl = document.getElementById('servio-typing');
    if (typingEl) typingEl.remove();
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  // Send message
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isLoading) return;

    isLoading = true;
    sendBtn.disabled = true;
    input.value = '';

    addMessage(text, 'user');
    showTyping();

    try {
      const response = await fetch(`${API_BASE}/bot-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embed_key: embedKey,
          message: text,
          conversation_id: conversationId,
          visitor_id: visitorId
        })
      });

      hideTyping();

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const data = await response.json();
      conversationId = data.conversation_id;
      addMessage(data.response, 'bot');

    } catch (error) {
      hideTyping();
      console.error('Servio Widget: Send error', error);
      addMessage("I'm sorry, I couldn't process your message. Please try again.", 'bot');
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // Event listeners
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

})();
