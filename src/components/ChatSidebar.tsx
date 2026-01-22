import { useState, useRef, useEffect } from "react";
import "./ChatSidebar.css";

interface Message {
  id: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: Date;
}

// Mock messages for MVP
const mockMessages: Message[] = [
  {
    id: "1",
    username: "CryptoKing",
    content: "Just made a great prediction on XLM! 🚀",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: "2",
    username: "MarketWatcher",
    content: "The market is looking bullish today!",
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
  },
  {
    id: "3",
    username: "TradePro",
    content: "Anyone else seeing this pattern on Bitcoin?",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
  },
  {
    id: "4",
    username: "NewTrader",
    content: "Just joined, excited to learn from everyone!",
    timestamp: new Date(Date.now() - 1000 * 60 * 1),
  },
  {
    id: "5",
    username: "Joedev",
    content: "Welcome to the community! 🎉",
    timestamp: new Date(Date.now() - 1000 * 30),
  },
];

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

// Chat Icon Component
function ChatIcon() {
  return (
    <svg
      className="chat-sidebar__icon"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M28 16C28 22.6274 22.6274 28 16 28C14.1468 28 12.3951 27.5751 10.8325 26.8207L4 28L5.17929 21.1675C4.42487 19.6049 4 17.8532 4 16C4 9.37258 9.37258 4 16 4C22.6274 4 28 9.37258 28 16Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14H22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 18H18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Send Icon Component
function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22 2L11 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 2L15 22L11 13L2 9L22 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChatSidebar() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputValue, setInputValue] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [onlineCount] = useState(16);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      username: "You",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMobile = () => {
    setIsMobileOpen((prev) => !prev);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`chat-sidebar__overlay ${isMobileOpen ? "chat-sidebar__overlay--visible" : ""}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Mobile Toggle Button */}
      <button
        className="chat-sidebar__toggle"
        onClick={toggleMobile}
        aria-label="Toggle chat sidebar"
      >
        <ChatIcon />
      </button>

      {/* Sidebar */}
      <aside
        className={`chat-sidebar ${isMobileOpen ? "chat-sidebar--open" : ""}`}
      >
        {/* Header */}
        <header className="chat-sidebar__header">
          <div className="chat-sidebar__title-group">
            <ChatIcon />
            <h2 className="chat-sidebar__title">Live Chat</h2>
          </div>
          <div className="chat-sidebar__online">
            <div className="chat-sidebar__online-dot" />
            <span className="chat-sidebar__online-count">{onlineCount}</span>
          </div>
        </header>

        {/* Messages */}
        <div className="chat-sidebar__messages">
          {messages.map((message) => (
            <div key={message.id} className="chat-message">
              <div className="chat-message__avatar">
                {getInitials(message.username)}
              </div>
              <div className="chat-message__content">
                <div className="chat-message__header">
                  <span className="chat-message__username">
                    {message.username}
                  </span>
                  <span className="chat-message__timestamp">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                <p className="chat-message__text">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-sidebar__input-area">
          <div className="chat-sidebar__input-wrapper">
            <input
              type="text"
              className="chat-sidebar__input"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button
              className="chat-sidebar__send-btn"
              onClick={handleSendMessage}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
