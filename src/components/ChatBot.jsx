// ─────────────────────────────────────────────────────────────────────────────
// ChatBot.jsx  —  F1 Expert AI chatbot overlay
//
// LESSON: This component combines several important patterns:
//   1. Short-term memory via React state (messages[])
//   2. Long-term memory via Firestore (users/{uid}.chatMemory)
//   3. Server-side AI calls via Cloud Function (/api/askF1Expert)
//   4. Google Search grounding sources rendered as citations
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { httpsCallableFromURL } from 'firebase/functions';
import { functions } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { getChatMemory, saveChatMemory, getUserProfile } from '../firebase/firestore';
import { useToast } from './Toast';

// LESSON: Gen 1 onCall + Firebase Hosting `function` rewrite.
// - Firebase Hosting uses the App Engine SA (granted cloudfunctions.invoker)
//   to authenticate with the Gen 1 Cloud Function — satisfying the org policy
//   that blocks allUsers IAM bindings.
// - httpsCallableFromURL routes through our own Hosting domain (same-origin,
//   no CORS preflight) rather than calling cloudfunctions.net directly.
// - Firebase Hosting's `function` rewrite preserves the user's Firebase ID
//   token so the onCall framework can populate context.auth.
const FUNCTION_URL  = `${window.location.origin}/api/askF1Expert`;
const askF1ExpertFn = httpsCallableFromURL(functions, FUNCTION_URL, { timeout: 65_000 });

export default function ChatBot() {
  const { user }      = useAuth();
  const { showToast } = useToast();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen]   = useState(false);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);

  // ── Memory state ──────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [userContext, setUserContext] = useState({ facts: [], favouriteDriver: null });
  const [memoryLoaded, setMemoryLoaded] = useState(false);

  // Ref to auto-scroll the message list to the latest message
  const bottomRef = useRef(null);

  const generateInitialGreeting = useCallback((displayName, favouriteDriver) => ({
    role: 'model',
    text: `Hi${displayName ? ' ' + displayName : ''}! I'm your F1 Expert — powered by Gemini with live Google Search. Ask me anything about the 2026 season: standings, race results, driver news, regulations, or just who you think will win the championship!${favouriteDriver ? `\n\nI see you're a **${favouriteDriver}** fan — great taste! What would you like to know?` : ''}`,
    sources: [],
  }), []);

  // ── Load long-term memory when chat opens ─────────────────────────────────
  useEffect(() => {
    if (!isOpen || memoryLoaded || !user) return;

    async function loadMemory() {
      try {
        const memory  = await getChatMemory(user.uid);
        const profile = await getUserProfile(user.uid);

        const ctx = {
          facts: memory.facts || [],
          favouriteDriver: profile?.favouriteDriverId || null,
        };
        setUserContext(ctx);

        if (memory.recentMessages && memory.recentMessages.length > 0) {
          setMessages(memory.recentMessages.map(m => ({
            role: m.role,
            text: m.text,
            sources: [],
          })));
        } else {
          setMessages([generateInitialGreeting(user.displayName, ctx.favouriteDriver)]);
        }
      } catch (err) {
        console.error('Failed to load chat memory:', err);
        setMessages([generateInitialGreeting(user.displayName, null)]);
      } finally {
        setMemoryLoaded(true);
      }
    }

    loadMemory();
  }, [isOpen, memoryLoaded, user, generateInitialGreeting]);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Clear chat / start new session ───────────────────────────────────────
  const clearChat = useCallback(async () => {
    if (!user) return;

    setMessages([generateInitialGreeting(user.displayName, userContext.favouriteDriver)]);
    setInput('');
    setLoading(false);

    try {
      // Clear recentMessages but keep learned facts
      await saveChatMemory(user.uid, userContext.facts, []);
      showToast('Chat session cleared!', 'info');
    } catch (err) {
      console.error('Failed to clear chat memory:', err);
      showToast('Failed to clear chat session.', 'error');
    }
  }, [user, userContext.facts, userContext.favouriteDriver, generateInitialGreeting, showToast]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', text, sources: [] };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const result = await askF1ExpertFn({
        // Filter out the initial AI greeting — Gemini requires first role to be user
        messages: nextMessages
          .filter((m, idx) => !(idx === 0 && m.role === 'model'))
          .map(m => ({ role: m.role, text: m.text })),
        userContext,
      });

      const { reply, sources = [], newFacts = [] } = result.data;

      const aiMessage = { role: 'model', text: reply, sources };
      const finalMessages = [...nextMessages, aiMessage];
      setMessages(finalMessages);

      let updatedFacts = userContext.facts;
      if (newFacts.length > 0) {
        const merged = [...userContext.facts, ...newFacts];
        updatedFacts = merged.filter(
          (f, i) => merged.findIndex(x => x.toLowerCase() === f.toLowerCase()) === i
        );
        setUserContext(prev => ({ ...prev, facts: updatedFacts }));
      }

      const messagesToSave = finalMessages
        .slice(-20)
        .map(m => ({ role: m.role, text: m.text, ts: Date.now() }));
      await saveChatMemory(user.uid, updatedFacts, messagesToSave);

    } catch (err) {
      console.error('ChatBot error:', err);
      const errorMsg = err?.code === 'functions/unavailable'
        ? 'Could not reach the AI service. Check your connection and try again.'
        : 'Something went wrong. Please try again.';
      showToast(errorMsg, 'error');
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, userContext, user, showToast]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        className={`chatbot-fab ${isOpen ? 'chatbot-fab--open' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Close F1 Expert chat' : 'Open F1 Expert chat'}
        title={isOpen ? 'Close chat' : 'Ask the F1 Expert'}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>

      {isOpen && (
        <div className="chatbot-panel" role="dialog" aria-label="F1 Expert chat">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <span className="chatbot-avatar">🏎️</span>
              <div>
                <div className="chatbot-title">F1 Expert</div>
                <div className="chatbot-subtitle">Powered by Gemini + Google Search</div>
              </div>
            </div>

            <button
              className="chatbot-clear-btn"
              onClick={clearChat}
              aria-label="Clear chat session"
              title="Start new chat session"
              disabled={loading}
            >
              <ClearIcon />
            </button>

            <button
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="chatbot-messages">
            {!memoryLoaded ? (
              <div className="chatbot-loading-init">
                <span className="chatbot-dot-pulse" />
                Loading your memory...
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`chatbot-message chatbot-message--${msg.role}`}
                >
                  <div className="chatbot-bubble">
                    <MessageText text={msg.text} />
                  </div>

                  {msg.role === 'model' && msg.sources?.length > 0 && (
                    <div className="chatbot-sources">
                      <span className="chatbot-sources-label">Sources:</span>
                      {msg.sources.map((s, si) => (
                        <a
                          key={si}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="chatbot-source-link"
                        >
                          {s.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="chatbot-message chatbot-message--model">
                <div className="chatbot-bubble chatbot-bubble--typing">
                  <span className="chatbot-dot" />
                  <span className="chatbot-dot" />
                  <span className="chatbot-dot" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="chatbot-input-row">
            <textarea
              className="chatbot-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about standings, results, news..."
              rows={1}
              disabled={loading || !memoryLoaded}
              aria-label="Chat message"
            />
            <button
              className="chatbot-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading || !memoryLoaded}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function MessageText({ text }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {parseInline(line)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

function parseInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1H9.5l-1 1H5v2h14V4z" />
    </svg>
  );
}
