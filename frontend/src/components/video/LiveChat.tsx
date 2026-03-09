"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Users, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  author: {
    name: string;
    channelId: string | null;
    avatar: string | null;
  };
  text: string;
  timestamp: string;
  isOwner: boolean;
  isModerator: boolean;
  isVerified: boolean;
  isMember: boolean;
  amount: string | null;
  color: string | null;
}

interface LiveChatProps {
  videoId: string;
  className?: string;
}

const WS_BASE = typeof window !== "undefined"
  ? window.location.origin.replace(/^http/, "ws").replace(":3000", ":4000")
  : "ws://localhost:4000";

export function LiveChat({ videoId, className }: LiveChatProps) {
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "error" | "not_live">("connecting");
  const [inputText, setInputText] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect WebSocket
  useEffect(() => {
    shouldReconnectRef.current = true;

    const connect = () => {
      const wsUrl = `${WS_BASE}/live/${videoId}/chat`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setStatus("connecting");

      ws.onopen = () => setStatus("connected");

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);

          if (data.type === "connected") {
            setStatus("connected");
          } else if (data.type === "not_live" || data.type === "ended") {
            setStatus("not_live");
            shouldReconnectRef.current = false;
          } else if (data.type === "message" && data.data) {
            setMessages((prev) => [...prev, data.data as ChatMessage].slice(-200));
          } else if (data.type === "viewer_count") {
            setViewerCount(data.count);
          } else if (data.type === "error") {
            setStatus("error");
          }
        } catch {
          setStatus("error");
        }
      };

      ws.onerror = () => setStatus("error");
      ws.onclose = () => {
        wsRef.current = null;
        if (!shouldReconnectRef.current) return;
        setStatus("error");
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [videoId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  const sendMessage = useCallback(() => {
    if (!inputText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "send_message", text: inputText.trim() }));
    setInputText("");
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (status === "not_live") return null;

  return (
    <div className={cn("flex flex-col rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full",
            status === "connected" ? "bg-red-500 animate-pulse" : "bg-yellow-500"
          )} />
          <span className="text-sm font-semibold">Live Chat</span>
        </div>
        {viewerCount !== null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {viewerCount.toLocaleString()} watching
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 h-[400px]" ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
          setAutoScroll(atBottom);
        }}
      >
        {status === "connecting" && (
          <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Connecting to live chat...
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-4 text-center">
            <AlertCircle className="h-8 w-8 opacity-50" />
            <p className="text-sm">Live chat unavailable</p>
          </div>
        )}
        {status === "connected" && messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Waiting for messages...
          </div>
        )}

        <div className="space-y-0.5 p-2">
          {messages.map((msg) => (
            <ChatMessageRow key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom hint */}
      {!autoScroll && messages.length > 0 && (
        <button
          className="mx-2 mb-1 rounded-full bg-white/10 py-1 text-xs text-center hover:bg-white/20 transition-colors"
          onClick={() => {
            setAutoScroll(true);
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          ↓ Jump to latest
        </button>
      )}

      {/* Input */}
      <div className="border-t border-white/5 p-3">
        {isAuthenticated && user?.youtubeConnected ? (
          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Say something..."
              maxLength={200}
              className="bg-white/5 border-white/10 text-sm h-9"
            />
            <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={sendMessage} disabled={!inputText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center">
            {!isAuthenticated ? "Sign in to chat" : "Connect YouTube to send messages"}
          </p>
        )}
      </div>
    </div>
  );
}

function ChatMessageRow({ message: msg }: { message: ChatMessage }) {
  const isSuperChat = !!msg.amount;

  return (
    <div className={cn(
      "flex gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white/[0.03]",
      isSuperChat && "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg my-1"
    )}>
      {msg.author.avatar ? (
        <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
          <AvatarImage src={msg.author.avatar} />
          <AvatarFallback className="text-[10px]">{msg.author.name?.[0]}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="h-6 w-6 flex-shrink-0 mt-0.5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
          {msg.author.name?.[0]}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 flex-wrap">
          <span className={cn(
            "text-xs font-semibold",
            msg.isOwner ? "text-yellow-400" :
            msg.isModerator ? "text-blue-400" :
            msg.isMember ? "text-green-400" :
            "text-white/70"
          )}>
            {msg.author.name}
          </span>
          {msg.isOwner && <Badge className="h-3.5 px-1 text-[9px] bg-yellow-500/20 text-yellow-400 border-none">Owner</Badge>}
          {msg.isModerator && <Badge className="h-3.5 px-1 text-[9px] bg-blue-500/20 text-blue-400 border-none">Mod</Badge>}
          {msg.isMember && !msg.isOwner && !msg.isModerator && (
            <Badge className="h-3.5 px-1 text-[9px] bg-green-500/20 text-green-400 border-none">Member</Badge>
          )}
          {isSuperChat && (
            <Badge className="h-3.5 px-1 text-[9px] bg-yellow-500/20 text-yellow-300 border-none">{msg.amount}</Badge>
          )}
        </div>
        <p className="text-xs text-white/80 break-words leading-relaxed">{msg.text}</p>
      </div>
    </div>
  );
}
