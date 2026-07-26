import { useState, useRef, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { socketService } from "../lib/socket";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import { useRoundStore, selectActiveChatChannelId } from "../store/useRoundStore";
import EmptyState from "./EmptyState";
import { MODAL_OVERLAY, TRANSITION, TRANSFORM_TRANSITION } from "../utils/motion";

const MAX_MESSAGE_LENGTH = 500;

interface Message {
  id: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: Date;
}

interface ApiMessage {
  id: string;
  username: string;
  avatar?: string;
  content: string;
  createdAt: string;
}

function mapApiMessage(msg: ApiMessage): Message {
  return {
    id: msg.id,
    username: msg.username,
    avatar: msg.avatar,
    content: msg.content,
    timestamp: new Date(msg.createdAt),
  };
}

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

interface ChatSidebarProps {
  /** When true, sidebar starts below news ribbon; when false, below header only */
  showNewsRibbon?: boolean;
}

export function ChatSidebar({ showNewsRibbon = true }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [onlineCount] = useState(16);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isConnected } = useConnectionStatus();
  // Round-scoped chat channel: derived from the active round so users in
  // round #42 only see round #42 messages. Falls back to CHAT_CHANNEL_FALLBACK
  // when there is no active round (issue #185).
  const channelId = useRoundStore(selectActiveChatChannelId);

  const scrollToBottom = (force = false) => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    
    // Auto-scroll if within 100px of the bottom, or if forced
    if (force || scrollHeight - scrollTop - clientHeight < 100) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    // Initial auto-scroll or scroll on new messages
    scrollToBottom(messages.length > 0 && messagesContainerRef.current?.scrollTop === 0);
  }, [messages]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // Handle body scroll lock and escape key for mobile sheet
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileOpen]);

  // Load chat history from REST on mount
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/chat/history`)
      .then((res) => res.json())
      .then((data: ApiMessage[]) => {
        if (!cancelled) {
          setMessages(data.map(mapApiMessage));
        }
      })
      .catch((err: unknown) =>
        console.error("[ChatSidebar] Failed to load history:", err),
      );

    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for incoming chat:message events via socket and stay subscribed
  // to the channel for the active round. When the active round changes, the
  // cleanup function leaves the previous channel and the next effect run
  // joins the new one (issue #185).
  useEffect(() => {
    // Ensure socket is connected
    socketService.connect();

    const unsubscribe = socketService.onChatMessage((data: ApiMessage) => {
      setMessages((prev) => {
        // De-duplicate: server echoes our own sends back through chat:message
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, mapApiMessage(data)];
      });
    });

    // Join this round's chat channel (or the fallback "general" channel
    // when no active round is available).
    socketService.joinChat(channelId);

    return () => {
      unsubscribe();
      socketService.leaveChat(channelId);
    };
  }, [channelId]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !isConnected || inputValue.length > MAX_MESSAGE_LENGTH) return;

    // Emit chat:send to the server instead of pushing to local state.
    // The server will broadcast chat:message back to all clients in the
    // channel (including the sender), which the listener above will handle.
    socketService.sendChat({ content: inputValue.trim() });

    setInputValue("");
    
    // Force scroll after sending a message
    setTimeout(() => scrollToBottom(true), 50);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
        className={`md:hidden fixed inset-0 bg-black/50 z-50 ${MODAL_OVERLAY} ${isMobileOpen ? "opacity-100 block" : "opacity-0 hidden"}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Mobile Toggle Button */}
      <button
        className={`md:hidden fixed right-4 bottom-24 w-14 h-14 bg-[#2C4BFD] border-none rounded-full flex items-center justify-center cursor-pointer z-70 shadow-lg shadow-[#2C4BFD]/30 hover:scale-105 hover:shadow-xl hover:shadow-[#2C4BFD]/40 ${TRANSFORM_TRANSITION}`}
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

      {/* Sidebar / Bottom Sheet */}
      <aside
        className={`chat-sidebar fixed flex flex-col z-60 border-r ${TRANSFORM_TRANSITION}
        bg-white dark:bg-[#1f2937] border-gray-100 dark:border-gray-800
        
        /* Desktop: Side Drawer */
        md:left-0 md:w-80 md:translate-x-0 md:transition-none
        ${showNewsRibbon ? "md:top-[128px] lg:md:top-[176px] md:h-[calc(100vh-128px)] lg:md:h-[calc(100vh-176px)]" : "md:top-[80px] lg:md:top-[112px] md:h-[calc(100vh-80px)] lg:md:h-[calc(100vh-112px)]"}
        
        /* Mobile: Bottom Sheet */
        left-0 bottom-0 w-full h-[80dvh] rounded-t-2xl shadow-2xl md:rounded-none md:shadow-none
        ${isMobileOpen ? "translate-y-0 ease-out" : "translate-y-full ease-in md:translate-y-0 md:translate-x-0"}`}
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4 m-2.5 rounded-lg bg-white dark:bg-[#1f2937] dark:text-white">
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
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-2.5 flex flex-col gap-3 bg-[#FAFAFA] dark:bg-gray-900 mx-2.5 p-3.5 rounded-xl overscroll-contain"
        >
          {messages.length === 0 && (
            <EmptyState
              icon={<MessageCircle className="h-10 w-10 text-[#2C4BFD] dark:text-xelma-blue" />}
              title="No messages yet"
              description="Be the first to say something in the chat."
              className="min-h-[160px] border-none bg-transparent backdrop-blur-none"
            />
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className="flex items-start gap-2.5 p-2.5 bg-white dark:bg-[#1f2937] rounded-xl dark:text-gray-200"
            >
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#E0E7FF] to-[#2C4BFD] shrink-0 flex items-center justify-center text-white font-semibold text-sm">
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
                <p className="font-['DM_Sans'] font-normal text-sm text-[#4D4D4D] dark:text-gray-300 text-wrap wrap-break-word">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white dark:bg-[#1f2937] border-t border-gray-100 dark:border-gray-800 shrink-0">
          {!isConnected && (
            <div className="mb-2 text-xs text-red-500 dark:text-red-400 text-center">
              Chat is offline - messages cannot be sent
            </div>
          )}
          <div className="flex items-end gap-2 p-2 bg-[#FAFAFA] dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl">
            <textarea
              ref={textareaRef}
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              className={`flex-1 border-none bg-transparent outline-none font-['DM_Sans'] text-sm text-[#292D32] dark:text-gray-200 placeholder-[#9B9B9B] resize-none overflow-y-auto py-2 min-h-[36px] max-h-[120px] ${
                !isConnected ? 'opacity-50' : ''
              }`}
              placeholder={isConnected ? "Type a message..." : "Chat offline..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={!isConnected}
              aria-label="Message input"
            />
            <button
              className={`flex items-center justify-center min-w-[36px] w-9 h-9 p-0 bg-[#2C4BFD] border-none rounded-lg cursor-pointer hover:opacity-90 hover:scale-105 shrink-0 ${TRANSITION} ${
                !isConnected || inputValue.length > MAX_MESSAGE_LENGTH ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!isConnected || inputValue.length > MAX_MESSAGE_LENGTH}
              onClick={handleSendMessage}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            {inputValue.length > MAX_MESSAGE_LENGTH && (
              <span className="text-xs text-red-500 dark:text-red-400">
                Message too long (max {MAX_MESSAGE_LENGTH} characters)
              </span>
            )}
            <span className={`text-xs ml-auto ${
              inputValue.length > MAX_MESSAGE_LENGTH ? 'text-red-500 dark:text-red-400' : 'text-[#9B9B9B] dark:text-gray-400'
            }`}>
              {inputValue.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}