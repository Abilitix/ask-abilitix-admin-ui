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
  
  // Debug: Log environment details
  console.log('Abilitix Widget: Environment Details', {
    windowLocation: window.location.href,
    windowOrigin: window.location.origin || 'null',
    windowProtocol: window.location.protocol,
    documentUrl: document.URL,
    documentLocation: document.location.href,
    isFileProtocol: window.location.protocol === 'file:',
    currentScript: document.currentScript ? document.currentScript.src : 'not available'
  });

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
  // Note: Using ask-abilitix-api.onrender.com (same as Admin UI), not ask-abilitix-runtime.onrender.com
  const API_BASE = 'https://ask-abilitix-api.onrender.com';

  // Widget state
  let isOpen = false;
  let messages = [];
  
  // Get or create sessionId (persist across page refreshes)
  // This ensures messages persist for the same user session
  function getOrCreateSessionId(tenantSlug) {
    const sessionKey = `ask_abilitix_widget_session_${tenantSlug || 'default'}`;
    try {
      let sessionId = localStorage.getItem(sessionKey);
      if (!sessionId) {
        // Generate new sessionId
        sessionId = 'widget-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(sessionKey, sessionId);
      }
      return sessionId;
    } catch (err) {
      // Fallback if localStorage fails
      return 'widget-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
  }
  
  let sessionId = getOrCreateSessionId(config.tenant);

  // localStorage helpers for chat persistence (tenant + session isolated)
  // Storage key includes both tenant slug AND session ID for proper isolation:
  // - Tenant isolation: Different tenants don't see each other's messages
  // - Session isolation: Different users/sessions on same browser don't see each other's messages
  function getStorageKey(tenantSlug, sessionId) {
    return `ask_abilitix_widget_chat_${tenantSlug || 'default'}_${sessionId || 'default'}`;
  }

  function loadChatFromStorage(tenantSlug, sessionId) {
    try {
      const key = getStorageKey(tenantSlug, sessionId);
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      // Validate structure
      if (parsed && Array.isArray(parsed.messages) && typeof parsed.lastUpdatedAt === 'string') {
        return parsed;
      }
      return null;
    } catch (err) {
      console.warn('Widget: Failed to load chat from localStorage:', err);
      return null;
    }
  }

  function saveChatToStorage(messages, tenantSlug, sessionId) {
    try {
      const key = getStorageKey(tenantSlug, sessionId);
      const stored = {
        messages: messages.map((m) => ({
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp || new Date().toISOString()
        })),
        lastUpdatedAt: new Date().toISOString(),
        tenantSlug: tenantSlug,
        sessionId: sessionId
      };
      localStorage.setItem(key, JSON.stringify(stored));
    } catch (err) {
      console.warn('Widget: Failed to save chat to localStorage:', err);
    }
  }

  function clearChatStorage(tenantSlug, sessionId) {
    try {
      const key = getStorageKey(tenantSlug, sessionId);
      localStorage.removeItem(key);
    } catch (err) {
      console.warn('Widget: Failed to clear chat from localStorage:', err);
    }
  }
  
  // Load messages from localStorage on initialization (using sessionId for isolation)
  const storedChat = loadChatFromStorage(config.tenant, sessionId);
  if (storedChat && storedChat.messages && storedChat.messages.length > 0) {
    messages = storedChat.messages;
  }

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
    padding: 16px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  `;
  chatHeader.innerHTML = `
    <div>
      <div style="font-weight: 600; font-size: 16px; line-height: 1.4;">${config.title}</div>
      <div style="font-size: 13px; opacity: 0.95; line-height: 1.4; margin-top: 2px;">We're here to help</div>
    </div>
    <button id="abilitix-widget-close" style="background: none; border: none; color: white; cursor: pointer; font-size: 24px; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s; opacity: 0.9;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.9'">&times;</button>
  `;
  
  // Get close button reference (must be after innerHTML is set)
  const closeButton = chatHeader.querySelector('#abilitix-widget-close');

  // Messages container
  const messagesContainer = document.createElement('div');
  messagesContainer.id = 'abilitix-widget-messages';
  messagesContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 18px;
    background: #f7f7f7;
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
    padding: 12px 14px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 15px;
    line-height: 1.5;
    outline: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #1a1a1a;
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
    font-size: 15px;
    font-weight: 500;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: opacity 0.2s;
  `;
  sendButton.onmouseover = () => {
    sendButton.style.opacity = '0.9';
  };
  sendButton.onmouseout = () => {
    sendButton.style.opacity = '1';
  };

  // Format message text: convert markdown to HTML
  function formatMessageText(text, sender) {
    if (!text) return '';
    
    // For user messages, just escape HTML (security)
    if (sender === 'user') {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    }
    
    // For bot messages, format markdown with full support
    let formatted = text;
    
    // Step 1: Handle code blocks (```code```) - do this first to preserve code
    const codeBlocks = [];
    formatted = formatted.replace(/```([\s\S]*?)```/g, (match, code) => {
      const id = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push({
        id: id,
        code: code.trim()
      });
      return id;
    });
    
    // Step 2: Handle inline code (`code`) - do this before other formatting
    const inlineCodes = [];
    formatted = formatted.replace(/`([^`]+)`/g, (match, code) => {
      const id = `__INLINE_CODE_${inlineCodes.length}__`;
      inlineCodes.push({
        id: id,
        code: code
      });
      return id;
    });
    
    // Step 3: Split into lines for list processing
    const lines = formatted.split('\n');
    const processedLines = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect bullet points: lines starting with "- " or "* " or "• " or numbered "1. " etc.
      const bulletMatch = line.match(/^([-*•]|\d+[.)])\s+(.+)$/);
      
      if (bulletMatch) {
        if (!inList) {
          processedLines.push('<ul>');
          inList = true;
        }
        // Process content with formatting
        let content = bulletMatch[2];
        content = applyTextFormatting(content, inlineCodes, codeBlocks);
        processedLines.push(`<li>${content}</li>`);
      } else {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        
        if (line) {
          // Check if it's a code block placeholder
          const codeBlockMatch = line.match(/^__CODE_BLOCK_(\d+)__$/);
          if (codeBlockMatch) {
            const blockIndex = parseInt(codeBlockMatch[1]);
            const codeBlock = codeBlocks[blockIndex];
            if (codeBlock) {
              processedLines.push(`<pre><code>${escapeHtml(codeBlock.code)}</code></pre>`);
            }
          } else {
            // Check for markdown headers: # Header, ## Header, ### Header
            const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headerMatch) {
              const level = headerMatch[1].length;
              const headerText = headerMatch[2];
              let content = applyTextFormatting(headerText, inlineCodes, codeBlocks);
              const tag = `h${Math.min(level + 2, 6)}`; // h3-h6 for widget (h1-h2 too large)
              processedLines.push(`<${tag} style="font-weight: 600; margin: 12px 0 8px 0; font-size: ${level === 1 ? '18px' : level === 2 ? '16px' : '15px'};">${content}</${tag}>`);
            } else {
              // Process content with formatting
              let content = line;
              content = applyTextFormatting(content, inlineCodes, codeBlocks);
              processedLines.push(`<p>${content}</p>`);
            }
          }
        } else {
          // Empty line - add spacing
          processedLines.push('<br>');
        }
      }
    }
    
    // Close any open list
    if (inList) {
      processedLines.push('</ul>');
    }
    
    formatted = processedLines.join('');
    
    // If no formatting was applied, wrap in paragraph
    if (!formatted.includes('<') && !formatted.includes('&')) {
      formatted = '<p>' + formatted + '</p>';
    }
    
    return formatted;
  }
  
  // Helper: Apply text formatting (bold, links, inline code)
  function applyTextFormatting(text, inlineCodes, codeBlocks) {
    // Restore inline code first
    inlineCodes.forEach((item, index) => {
      text = text.replace(item.id, `<code>${escapeHtml(item.code)}</code>`);
    });
    
    // Format markdown links: [text](url) - do this before escaping HTML
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      let href = url.trim();
      if (!href.startsWith('http')) {
        href = 'https://' + href;
      }
      return `__MARKDOWN_LINK_${linkText}__${href}__`;
    });
    
    // Escape HTML
    text = escapeHtml(text);
    
    // Restore markdown links as HTML
    text = text.replace(/__MARKDOWN_LINK_(.+?)__(.+?)__/g, (match, linkText, href) => {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: ${config.primaryColor}; text-decoration: underline;">${linkText}</a>`;
    });
    
    // Format bold: **text**
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Format italic: *text* (but not if it's part of **text**)
    text = text.replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    
    // Auto-detect and link plain URLs (http://, https://, www.) - only if not already in a link
    const urlRegex = /(https?:\/\/[^\s<>]+|www\.[^\s<>]+)/g;
    text = text.replace(urlRegex, (url) => {
      // Skip if already inside an <a> tag
      if (text.indexOf(`href="${url}"`) !== -1 || text.indexOf(`>${url}</a>`) !== -1) {
        return url;
      }
      let href = url;
      if (!href.startsWith('http')) {
        href = 'https://' + href;
      }
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: ${config.primaryColor}; text-decoration: underline;">${url}</a>`;
    });
    
    return text;
  }
  
  // Helper: Escape HTML
  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Add welcome message
  function addWelcomeMessage() {
    if (config.welcomeMessage) {
      addMessage('bot', config.welcomeMessage);
    }
  }

  // Track copied message IDs (for showing green tick)
  const copiedMessages = new Set();

  // Add message to chat
  function addMessage(sender, text, isLoading = false, skipSave = false) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      margin-bottom: 8px;
      display: flex;
      ${sender === 'user' ? 'justify-content: flex-end' : 'justify-content: flex-start'};
    `;

    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      max-width: 80%;
      padding: 14px 16px;
      border-radius: 12px;
      font-size: 15px;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      position: relative;
      ${sender === 'user' 
        ? `background: ${config.primaryColor}; color: white; border-bottom-right-radius: 4px; text-shadow: 0 1px 1px rgba(0,0,0,0.1);` 
        : 'background: white; color: #1a1a1a; border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);'};
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
      // Format text: convert markdown-like formatting to HTML
      const formattedText = formatMessageText(text, sender);
      
      // For bot messages, add footer with copy button at bottom left
      if (sender === 'bot' && text) {
        const messageId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Create footer div for copy button
        const footerDiv = document.createElement('div');
        footerDiv.style.cssText = `
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        `;
        
        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.setAttribute('data-message-id', messageId);
        copyButton.style.cssText = `
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 6px;
          transition: background-color 0.2s;
          padding: 0;
        `;
        copyButton.onmouseenter = function() {
          this.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
        };
        copyButton.onmouseleave = function() {
          this.style.backgroundColor = 'transparent';
        };
        
        // SVG icons for Copy and CheckCircle
        const copyIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #6b7280;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        const checkIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        
        copyButton.innerHTML = copyIcon;
        
        copyButton.onclick = async function() {
          try {
            await navigator.clipboard.writeText(text);
            copiedMessages.add(messageId);
            copyButton.innerHTML = checkIcon;
            
            // Reset after 2 seconds
            setTimeout(() => {
              copiedMessages.delete(messageId);
              copyButton.innerHTML = copyIcon;
            }, 2000);
          } catch (error) {
            console.error('Failed to copy message:', error);
          }
        };
        
        footerDiv.appendChild(copyButton);
        
        // Create a wrapper div to hold content and footer
        const contentWrapper = document.createElement('div');
        contentWrapper.innerHTML = formattedText;
        contentWrapper.appendChild(footerDiv);
        
        messageBubble.appendChild(contentWrapper);
      } else {
        // For user messages, just add formatted text
        messageBubble.innerHTML = formattedText;
      }
    }

    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Save to localStorage (skip for loading messages and when explicitly told to skip)
    if (!isLoading && !skipSave && text) {
      messages.push({
        sender: sender,
        text: text,
        timestamp: new Date().toISOString()
      });
      saveChatToStorage(messages, config.tenant, sessionId);
    }

    return messageDiv;
  }

  // Track if messages have been rendered
  let messagesRendered = false;

  // Render loaded messages from localStorage
  function renderLoadedMessages() {
    if (messages.length === 0 || messagesRendered) return;
    
    messagesContainer.innerHTML = ''; // Clear container
    messages.forEach((msg) => {
      addMessage(msg.sender, msg.text, false, true); // skipSave=true to avoid double-saving
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    messagesRendered = true;
  }

  // Send message to API
  async function sendMessage(question) {
    addMessage('user', question);
    const loadingMessage = addMessage('bot', '', true);

    try {
      // Call Runtime API with widget key authentication
      // Runtime API validates widget key and routes to correct tenant
      // Note: Once Runtime API adds CORS headers, this will work directly
      const requestBody = {
        question: question,
        session_id: sessionId,
        topk: 5  // Explicitly set to 5 to match tenant settings
      };
      
      // Log full request details including origin
      const currentOrigin = window.location.origin || 'null';
      const currentProtocol = window.location.protocol || 'unknown';
      
      console.log('Widget API request:', {
        url: `${API_BASE}/ask`,
        method: 'POST',
        origin: currentOrigin,
        protocol: currentProtocol,
        isFileProtocol: currentProtocol === 'file:',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': config.tenant,
          'X-Widget-Key': config.widgetKey ? config.widgetKey.substring(0, 10) + '...' : 'missing'
        },
        body: requestBody,
        environment: {
          windowLocation: window.location.href,
          documentUrl: document.URL,
          referrer: document.referrer || 'none'
        }
      });
      
      // Warn if using file:// protocol
      if (currentProtocol === 'file:' || currentOrigin === 'null' || !currentOrigin) {
        console.warn('⚠️ Widget is running from file:// protocol (origin: null)');
        console.warn('⚠️ CORS will fail. Use a web server: python -m http.server 8000');
        console.warn('⚠️ Then open: http://localhost:8000/test_widget_production.html');
      }
      
      console.log('Widget: Making fetch request to:', `${API_BASE}/ask`);
      
      const response = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': config.tenant,
          'X-Widget-Key': config.widgetKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        const corsHeader = response.headers.get('Access-Control-Allow-Origin');
        console.error('Widget API error response:', {
          status: response.status,
          statusText: response.statusText,
          corsHeader: corsHeader || 'MISSING',
          allHeaders: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      // Log CORS headers from successful response
      const corsHeader = response.headers.get('Access-Control-Allow-Origin');
      console.log('Widget API response CORS header:', corsHeader || 'MISSING');

      const data = await response.json();
      console.log('Widget API success:', data);
      
      // Remove loading message
      loadingMessage.remove();
      
      // Add bot response
      addMessage('bot', data.answer || 'Sorry, I couldn\'t process your question.');
    } catch (error) {
      const currentOrigin = window.location.origin || 'null';
      const currentProtocol = window.location.protocol || 'unknown';
      
      console.error('Widget API error:', error);
      console.error('Widget API error details:', {
        message: error.message,
        stack: error.stack,
        apiBase: API_BASE,
        tenant: config.tenant,
        widgetKey: config.widgetKey ? config.widgetKey.substring(0, 10) + '...' : 'missing',
        origin: currentOrigin,
        protocol: currentProtocol,
        isFileProtocol: currentProtocol === 'file:',
        windowLocation: window.location.href,
        errorType: error.name,
        isCorsError: error.message.includes('CORS') || error.message.includes('Failed to fetch')
      });
      
      // Specific CORS error diagnosis
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        if (currentProtocol === 'file:' || currentOrigin === 'null' || !currentOrigin) {
          console.error('🔴 DIAGNOSIS: CORS failed because origin is null (file:// protocol)');
          console.error('🔴 SOLUTION: Use a web server - python -m http.server 8000');
          console.error('🔴 Then open: http://localhost:8000/test_widget_production.html');
        } else {
          console.error('🔴 DIAGNOSIS: CORS failed with proper origin:', currentOrigin);
          console.error('🔴 POSSIBLE CAUSES:');
          console.error('   1. Production Runtime API hasn\'t deployed CORS fix yet');
          console.error('   2. Runtime API CORS middleware not configured correctly');
          console.error('   3. Network/proxy blocking the request');
        }
      }
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
      
      // Render loaded messages if any exist (only once)
      if (messages.length > 0 && !messagesRendered) {
        renderLoadedMessages();
      } else if (messages.length === 0 && !messagesRendered) {
        // Only show welcome message if no previous messages
        addWelcomeMessage();
        messagesRendered = true; // Mark as rendered to prevent duplicate welcome message
      }
    } else {
      chatWindow.style.display = 'none';
    }
  }

  // Event listeners
  chatButton.onclick = toggleChat;
  if (closeButton) {
    closeButton.onclick = toggleChat;
  } else {
    console.error('Abilitix Widget: Close button not found');
  }

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

  // Add CSS animation for loading dots and enhanced styling
  const style = document.createElement('style');
  style.textContent = `
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-10px); }
    }
    #abilitix-widget-messages {
      scrollbar-width: thin;
      scrollbar-color: #c1c1c1 #f7f7f7;
    }
    #abilitix-widget-messages::-webkit-scrollbar {
      width: 6px;
    }
    #abilitix-widget-messages::-webkit-scrollbar-track {
      background: #f7f7f7;
      border-radius: 3px;
    }
    #abilitix-widget-messages::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
      transition: background 0.2s;
    }
    #abilitix-widget-messages::-webkit-scrollbar-thumb:hover {
      background: #a1a1a1;
    }
    #abilitix-widget-container * {
      box-sizing: border-box;
    }
    #abilitix-widget-messages {
      -webkit-overflow-scrolling: touch;
    }
    /* Formatting styles for bot messages */
    #abilitix-widget-messages p {
      margin: 0 0 8px 0;
      line-height: 1.5;
    }
    #abilitix-widget-messages p:last-child {
      margin-bottom: 0;
    }
    #abilitix-widget-messages ul {
      margin: 8px 0;
      padding-left: 20px;
      list-style-type: disc;
    }
    #abilitix-widget-messages ul:first-child {
      margin-top: 0;
    }
    #abilitix-widget-messages ul:last-child {
      margin-bottom: 0;
    }
    #abilitix-widget-messages li {
      margin: 4px 0;
      line-height: 1.5;
      padding-left: 4px;
    }
    #abilitix-widget-messages strong {
      font-weight: 600;
    }
    #abilitix-widget-messages em {
      font-style: italic;
    }
    #abilitix-widget-messages a {
      text-decoration: underline;
      word-break: break-word;
    }
    #abilitix-widget-messages a:hover {
      opacity: 0.8;
    }
    #abilitix-widget-messages code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
      color: #d63384;
    }
    #abilitix-widget-messages pre {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 8px 0;
    }
    #abilitix-widget-messages pre code {
      background: none;
      padding: 0;
      color: #1a1a1a;
      font-size: 13px;
      line-height: 1.5;
    }
    #abilitix-widget-messages h3, #abilitix-widget-messages h4, #abilitix-widget-messages h5, #abilitix-widget-messages h6 {
      font-weight: 600;
      margin: 12px 0 8px 0;
      line-height: 1.4;
      color: #1a1a1a;
    }
    #abilitix-widget-messages h3 {
      font-size: 18px;
    }
    #abilitix-widget-messages h4 {
      font-size: 16px;
    }
    #abilitix-widget-messages h5, #abilitix-widget-messages h6 {
      font-size: 15px;
    }
  `;
  document.head.appendChild(style);

  console.log('Abilitix Widget: Initialization complete');
  console.log('Abilitix Widget: Button should be visible now');
})();

