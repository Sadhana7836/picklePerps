"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import { ChevronDown, Wallet, Plus, Send, Globe, X } from "lucide-react";
import { useStellarWallet } from "@/contexts/StellarContext";
import { useMemeTokenFactory } from "@/hooks/useMemeTokenFactory";
import { useAppActions, useSidebarOpen } from "@/lib/store";
import { CHAT } from "@/lib/constants";

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: number;
}

export function LeftSidebar() {
  const { isConnected, address, balance, connect, disconnect } = useStellarWallet();
  const { data } = useMemeTokenFactory();
  const { setShowMintModal, setSidebarOpen } = useAppActions();
  const sidebarOpen = useSidebarOpen();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    if (!inputMessage.trim() || !address) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: address.slice(0, 6) + "..." + address.slice(-4),
      message: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => {
      const updated = [...prev, newMessage];
      // Prevent memory leak by trimming old messages
      if (updated.length > CHAT.MAX_MESSAGES) {
        return updated.slice(-CHAT.MESSAGE_TRIM_COUNT);
      }
      return updated;
    });
    setInputMessage("");
  }, [inputMessage, address]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed xl:relative z-50 xl:z-auto
          w-[280px] xl:w-[280px] 2xl:w-[320px]
          min-w-[280px] xl:min-w-[280px] 2xl:min-w-[320px]
          bg-[#0a0a0a] border-r border-[#151515] flex flex-col h-full
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
          ${!sidebarOpen ? 'xl:hidden' : ''}
        `}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] xl:hidden z-10"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        {/* Wallet & Create Token Section */}
        <div className="p-4 border-b border-[#151515]">
        <div className="w-full space-y-3">
                {!isConnected ? (
                  <>
                    <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 mt-2">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-[#555]" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">Welcome</p>
                          <p className="text-[#555] text-xs">Connect to get started</p>
                        </div>
                      </div>
                      <button
                        onClick={connect}
                        className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] hover:border-[#00d26a]/50 text-white text-sm px-4 py-2.5 rounded-lg transition-all"
                      >
                        <Wallet className="w-4 h-4 text-[#00d26a]" />
                        Connect Wallet
                      </button>
                    </div>
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 bg-[#0d0d0d] border border-[#1a1a1a] text-[#555] text-sm px-4 py-3 rounded-lg cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Token</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={disconnect}
                      className="w-full flex items-center gap-3 bg-[#111] hover:bg-[#161616] border border-[#1a1a1a] text-white text-sm px-3 py-2.5 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#00d26a] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm text-black font-bold">
                          {address?.charAt(0)?.toUpperCase() || "W"}
                        </span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-white text-xs truncate">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}</p>
                        {balance && (
                          <p className="text-[#00d26a] text-xs">{balance} XLM</p>
                        )}
                      </div>
                      <ChevronDown className="w-3 h-3 text-[#555] flex-shrink-0" />
                    </button>
                    <button
                      onClick={() => setShowMintModal(true)}
                      className="w-full flex items-center justify-center gap-2 bg-[#0d0d0d] hover:bg-[#111] border border-[#00d26a]/30 hover:border-[#00d26a]/60 text-white text-sm px-4 py-3 rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4 text-[#00d26a]" />
                      <span>Create Token</span>
                    </button>
                  </>
                )}
              </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-[#151515]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[#555] text-xs">Total Tokens</span>
            <span className="text-white text-sm font-medium">{data.tokenCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#555] text-xs">Your Tokens</span>
            <span className="text-white text-sm font-medium">{data.myTokens.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#555] text-xs">Mint Fee</span>
            <span className="text-[#00d26a] text-sm font-medium">{data.mintingFee} XLM</span>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
          <p className="text-[#444] text-[10px] uppercase tracking-wider mb-3">How it works</p>
          <div className="space-y-2 text-[11px] text-[#666]">
            <div className="flex items-start gap-2">
              <span className="text-[#00d26a]">1.</span>
              <span>Create your token with an image</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#00d26a]">2.</span>
              <span>Token becomes tradeable via perpetuals</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#00d26a]">3.</span>
              <span>Trade long/short with up to 100x leverage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="flex flex-col p-4 h-[400px] flex-shrink-0">
        <p className="text-[#444] text-[10px] uppercase tracking-wider mb-2">Chat</p>
        <div className="flex-1 flex flex-col bg-[#111] border border-[#1a1a1a] rounded-lg overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
            {messages.length === 0 ? (
              <p className="text-[#444] text-xs text-center py-4">No messages yet</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[#00d26a] text-[10px]">{msg.user}</span>
                    <span className="text-[#333] text-[10px]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-white text-xs">{msg.message}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#1a1a1a] p-2">
            {!isConnected ? (
              <p className="text-[#444] text-[10px] text-center py-1">Connect wallet to chat</p>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Message..."
                  className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded px-2 py-1.5 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#333]"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="bg-[#00d26a] hover:bg-[#00e676] disabled:opacity-30 text-black p-1.5 rounded transition-colors"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


        {/* Footer */}
        <div className="px-3 pt-2 pb-1 border-t border-[#1a1a1a] mt-auto">
          <div className="flex items-center justify-center gap-2 text-[#555] text-xs">
            <svg width="14" height="14" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><circle cx="128" cy="128" r="128" fill="#000"/><path d="M199.2 73.6l-18.4 9.6c-14.4-13.6-33.6-22.4-55.2-22.4-44 0-79.2 35.2-79.2 79.2 0 8 1.6 16 4 23.2L32 172.8V152l12-6.4c-1.6-5.6-2.4-12-2.4-18.4 0-48 38.4-86.4 86.4-86.4 24 0 45.6 9.6 61.6 25.6l9.6-4.8v11.2zm24 9.6V104l-12 6.4c1.6 5.6 2.4 12 2.4 18.4 0 48-38.4 86.4-86.4 86.4-24 0-45.6-9.6-61.6-25.6l-9.6 4.8v-11.2l18.4-9.6c14.4 13.6 33.6 22.4 55.2 22.4 44 0 79.2-35.2 79.2-79.2 0-8-1.6-16-4-23.2L224 84.8z" fill="white"/></svg>
            <span>Stellar Testnet</span>
          </div>
        </div>
      </div>
    </>
  );
}
