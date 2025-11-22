/**
 * Abilitix Widget - Embeddable Chat Widget
 * 
 * Usage:
 * <script src="https://app.abilitix.com/widget.js" 
 *         data-tenant="abilitix-pilot" 
 *         data-widget-key="wid_..."></script>
 * 
 * Optional theme attributes:
 * data-theme-primary="#3b82f6"
 * data-theme-accent="#8b5cf6"
 * data-title="Chat with us"
 * data-welcome-message="Hi! How can I help you today?"
 * data-position="bottom-right" or "bottom-left"
 */

(function() {
  'use strict';

  console.log('Abilitix Widget: Script loaded and executing...');

  // Configuration from script tag attributes
  const scriptTag = document.currentScript || document.querySelector('script[data-tenant]');
  if (!scriptTag) {
    console.error('Abilitix Widget: Script tag not found');
    console.log('Abilitix Widget: Available script tags:', document.querySelectorAll('script').length);
    return;
  }

  console.log('Abilitix Widget: Script tag found', scriptTag);

  const config = {
    tenant: scriptTag.getAttribute('data-tenant'),
    widgetKey: scriptTag.getAttribute('data-widget-key'),
    primaryColor: scriptTag.getAttribute('data-theme-primary') || '#3b82f6',
    accentColor: scriptTag.getAttribute('data-theme-accent') || '#8b5cf6',
    title: scriptTag.getAttribute('data-title') || 'Chat with us',
    welcomeMessage: scriptTag.getAttribute('data-welcome-message') || 'Hi! How can I help you today?',
    position: scriptTag.getAttribute('data-position') || 'bottom-right'
  };

  console.log('Abilitix Widget: Config loaded', {
    tenant: config.tenant,
    widgetKey: config.widgetKey ? config.widgetKey.substring(0, 10) + '...' : 'missing',
    primaryColor: config.primaryColor,
    position: config.position
  });

  if (!config.tenant || !config.widgetKey) {
    console.error('Abilitix Widget: Missing required attributes (data-tenant, data-widget-key)');
    console.error('Abilitix Widget: Current config:', config);
    return;
  }

  // API endpoints - Runtime API for widget requests
  const API_BASE = 'https://ask-abilitix-runtime.onrender.com';

  // Widget state
  let isOpen = false;
  let messages = [];
  let sessionId = 'widget-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'abilitix-widget-container';
  widgetContainer.style.cssText = `
    position: fixed;
    ${config.position === 'bottom-right' ? 'right: 20px' : 'left: 20px'};
    bottom: 20px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  `;

  // Create chat button
  const chatButton = document.createElement('button');
  chatButton.id = 'abilitix-widget-button';
  chatButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;
  chatButton.style.cssText = `
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: ${config.primaryColor};
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
  `;
  chatButton.onmouseover = () => {
    chatButton.style.transform = 'scale(1.1)';
    chatButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
  };
  chatButton.onmouseout = () => {
    chatButton.style.transform = 'scale(1)';
    chatButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  };

  // Create chat window
  const chatWindow = document.createElement('div');
  chatWindow.id = 'abilitix-widget-window';
  chatWindow.style.cssText = `
    position: absolute;
    bottom: 80px;
    ${config.position === 'bottom-right' ? 'right: 0' : 'left: 0'};
    width: 380px;
    height: 600px;
    max-height: calc(100vh - 100px);
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    display: none;
    flex-direction: column;
    overflow: hidden;
  `;

  // Chat header
  const chatHeader = document.createElement('div');
  chatHeader.style.cssText = `
    background: ${config.primaryColor};
    color: white;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  chatHeader.innerHTML = `
    <div>
      <div style="font-weight: 600; font-size: 16px;">${config.title}</div>
      <div style="font-size: 12px; opacity: 0.9;">We're here to help</div>
    </div>
    <button id="abilitix-widget-close" style="background: none; border: none; color: white; cursor: pointer; font-size: 24px; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">&times;</button>
  `;

  // Messages container
  const messagesContainer = document.createElement('div');
  messagesContainer.id = 'abilitix-widget-messages';
  messagesContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: #f5f5f5;
  `;

  // Input container
  const inputContainer = document.createElement('div');
  inputContainer.style.cssText = `
    padding: 16px;
    background: white;
    border-top: 1px solid #e0e0e0;
    display: flex;
    gap: 8px;
  `;

  const messageInput = document.createElement('input');
  messageInput.type = 'text';
  messageInput.placeholder = 'Type your message...';
  messageInput.style.cssText = `
    flex: 1;
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
  `;

  const sendButton = document.createElement('button');
  sendButton.innerHTML = 'Send';
  sendButton.style.cssText = `
    padding: 12px 24px;
    background: ${config.primaryColor};
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  `;

  // Add welcome message
  function addWelcomeMessage() {
    if (config.welcomeMessage) {
      addMessage('bot', config.welcomeMessage);
    }
  }

  // Add message to chat
  function addMessage(sender, text, isLoading = false) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      margin-bottom: 12px;
      display: flex;
      ${sender === 'user' ? 'justify-content: flex-end' : 'justify-content: flex-start'};
    `;

    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      ${sender === 'user' 
        ? `background: ${config.primaryColor}; color: white; border-bottom-right-radius: 4px;` 
        : 'background: white; color: #333; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);'};
    `;

    if (isLoading) {
      messageBubble.innerHTML = `
        <div style="display: flex; gap: 4px;">
          <div style="width: 8px; height: 8px; background: ${config.primaryColor}; border-radius: 50%; animation: bounce 1.4s infinite;"></div>
          <div style="width: 8px; height: 8px; background: ${config.primaryColor}; border-radius: 50%; animation: bounce 1.4s infinite 0.2s;"></div>
          <div style="width: 8px; height: 8px; background: ${config.primaryColor}; border-radius: 50%; animation: bounce 1.4s infinite 0.4s;"></div>
        </div>
      `;
    } else {
      messageBubble.textContent = text;
    }

    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageDiv;
  }

  // Send message to API
  async function sendMessage(question) {
    addMessage('user', question);
    const loadingMessage = addMessage('bot', '', true);

    try {
      // Call Runtime API with widget key authentication
      // Backend validates widget key and routes to correct tenant
      const response = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': config.tenant,
          'X-Widget-Key': config.widgetKey
        },
        body: JSON.stringify({
          question: question,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Remove loading message
      loadingMessage.remove();
      
      // Add bot response
      addMessage('bot', data.answer || 'Sorry, I couldn\'t process your question.');
    } catch (error) {
      console.error('Widget API error:', error);
      loadingMessage.remove();
      addMessage('bot', 'Sorry, there was an error processing your message. Please try again.');
    }
  }

  // Toggle chat window
  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      chatWindow.style.display = 'flex';
      messageInput.focus();
      if (messages.length === 0) {
        addWelcomeMessage();
      }
    } else {
      chatWindow.style.display = 'none';
    }
  }

  // Event listeners
  chatButton.onclick = toggleChat;
  document.getElementById('abilitix-widget-close').onclick = toggleChat;

  sendButton.onclick = () => {
    const question = messageInput.value.trim();
    if (question) {
      sendMessage(question);
      messageInput.value = '';
    }
  };

  messageInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
      sendButton.click();
    }
  };

  // Assemble widget
  inputContainer.appendChild(messageInput);
  inputContainer.appendChild(sendButton);
  chatWindow.appendChild(chatHeader);
  chatWindow.appendChild(messagesContainer);
  chatWindow.appendChild(inputContainer);
  widgetContainer.appendChild(chatButton);
  widgetContainer.appendChild(chatWindow);

  // Add to page
  document.body.appendChild(widgetContainer);
  console.log('Abilitix Widget: Widget container added to page');

  // Add CSS animation for loading dots
  const style = document.createElement('style');
  style.textContent = `
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-10px); }
    }
    #abilitix-widget-messages::-webkit-scrollbar {
      width: 6px;
    }
    #abilitix-widget-messages::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    #abilitix-widget-messages::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 3px;
    }
    #abilitix-widget-messages::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  `;
  document.head.appendChild(style);

  console.log('Abilitix Widget: Initialization complete');
  console.log('Abilitix Widget: Button should be visible now');
})();

