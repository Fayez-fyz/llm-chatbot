import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import type { FC } from "react";
import { User, Bot } from "lucide-react";
import React from "react";

interface ChatConversationProps {
  messages: UIMessage[];
  status?: "ready" | "error" | "submitted" | "streaming"; // Align with useChat
  showLoading?: boolean; // Add loading prop
}

const TypewriterLoading: FC = () => {
  return (
    <div className="flex items-center h-full gap-1">
      <div className="flex items-center gap-1">
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
      </div>
    </div>
  );
};

const ChatConversation: FC<ChatConversationProps> = ({ messages, showLoading }) => {
  return (
    <div className="flex flex-col gap-4 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn("flex gap-3 max-w-[80%]", message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}
        >
          {/* Avatar */}
          <div
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"
            )}
          >
            {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
          </div>

          {/* Message Content */}
          <div
            className={cn(
              "rounded-2xl px-4 py-2 max-w-full",
              message.role === "user"
                ? "bg-blue-600 text-white rounded-br-md"
                : "bg-gray-800 text-gray-100 rounded-bl-md border border-gray-700"
            )}
          >
            {message.parts?.map((part, i) => {
              switch (part.type) {
                case "text":
                  return (
                    <div key={`${message.id}-${i}`} className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {part.text}
                    </div>
                  );
                case "reasoning":
                  return (
                    <details key={`${message.id}-${i}`} className="mt-2 text-xs opacity-75">
                      <summary className="cursor-pointer hover:opacity-100 transition-opacity">View reasoning</summary>
                      <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-x-auto">
                        {part.details
                          .map((detail) => (detail.type === "text" ? detail.text : "<redacted>"))
                          .join("")}
                      </pre>
                    </details>
                  );
                default:
                  return null;
              }
            })}
          </div>
        </div>
      ))}
      
      {/* Loading message - shown separately */}
      {showLoading && (
        <div className="flex gap-3 max-w-[80%] mr-auto">
          {/* Avatar */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-700 text-gray-200">
            <Bot size={16} />
          </div>

          {/* Loading Content */}
          <div className="rounded-2xl px-4 py-2 max-w-full bg-gray-800 text-gray-100 rounded-bl-md border border-gray-700">
            <TypewriterLoading />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ChatConversation);