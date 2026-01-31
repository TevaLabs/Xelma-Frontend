import { useState, useRef, useEffect } from "react";

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
      className="w-8 h-8 text-[#2C4BFD]"
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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[18px] h-[18px] text-white"
    >
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
        className={`md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isMobileOpen ? "opacity-100 block" : "opacity-0 hidden"}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed left-4 bottom-4 w-14 h-14 bg-[#2C4BFD] border-none rounded-full flex items-center justify-center cursor-pointer z-50 shadow-lg shadow-[#2C4BFD]/30 transition-transform duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#2C4BFD]/40"
        onClick={toggleMobile}
        aria-label="Toggle chat sidebar"
      >
        <svg
          className="w-7 h-7 text-white"
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
      </button>

      {/* Chat Container - Bottom Sheet on Mobile, Sidebar on Desktop */}
      <aside
        className={`
          chat-sidebar
          fixed 
          flex flex-col 
          z-50
          transition-transform duration-300 ease-in-out
          border-gray-100 dark:border-gray-800
          bg-white dark:bg-[#1f2937]
          
          md:hidden
          left-0 right-0 bottom-0
          h-[65vh]
          rounded-t-3xl
          border-t border-l border-r
          ${isMobileOpen ? "translate-y-0" : "translate-y-full"}
          
          md:block
          md:left-0 md:right-auto md:bottom-auto
          md:top-[80px] lg:md:top-[112px]
          md:w-80 
          md:h-[calc(100vh-80px)] lg:md:h-[calc(100vh-112px)]
          md:rounded-none
          md:border-r
          md:translate-y-0
        `}
      >
        {/* Drag Handle (Mobile Only) */}
        <div className="md:hidden flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>

        {/* Header */}
        <header className="flex items-center justify-between p-4 mx-2.5 mt-2 rounded-lg bg-white dark:bg-[#1f2937] dark:text-white">
          <div className="flex items-center gap-2.5">
            <ChatIcon />
            <h2 className="font-['DM_Sans'] font-semibold text-xl text-[#292D32] dark:text-gray-100">
              Live Chat
            </h2>
          </div>
          <div className="flex items-center gap-2.5 px-2 py-1 bg-white dark:bg-[#1f2937] border border-[#FAFAFA] dark:border-gray-700 rounded text-black dark:text-white">
            <div className="w-3 h-3 bg-[#00C076] rounded-full" />
            <span className="font-['DM_Sans'] font-semibold text-xl">
              {onlineCount}
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-2.5 flex flex-col gap-3 bg-[#FAFAFA] dark:bg-gray-900 mx-2.5 p-3.5 rounded-xl">
          {messages.map((message) => (
            <div
              key={message.id}
              className="flex items-start gap-2.5 p-2.5 bg-white dark:bg-[#1f2937] rounded-xl dark:text-gray-200"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E0E7FF] to-[#2C4BFD] shrink-0 flex items-center justify-center text-white font-semibold text-sm">
                {getInitials(message.username)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-['DM_Sans'] font-semibold text-sm text-[#292D32] dark:text-gray-100">
                    {message.username}
                  </span>
                  <span className="font-['DM_Sans'] font-normal text-xs text-[#9B9B9B] dark:text-gray-400">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                <p className="font-['DM_Sans'] font-normal text-sm text-[#4D4D4D] dark:text-gray-300 break-words">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-[#1f2937] border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 p-2 bg-[#FAFAFA] dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl">
            <input
              type="text"
              className="flex-1 border-none bg-transparent outline-none font-['DM_Sans'] text-sm text-[#292D32] dark:text-gray-200 placeholder-[#9B9B9B]"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button
              className="flex items-center justify-center w-9 h-9 p-0 bg-[#2C4BFD] border-none rounded-lg cursor-pointer transition-all duration-200 hover:opacity-90 hover:scale-105"
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