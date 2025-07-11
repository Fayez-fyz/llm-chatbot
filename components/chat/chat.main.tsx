"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { FC, useEffect, useState, useTransition } from "react";
import ChatNav from "./chat.nav";
import { useChat } from "@ai-sdk/react";
import ChatForm from "./chat.form";
import { toast } from "sonner";
import { ChatRequestOptions, generateId } from "ai";
import ChatConversation from "./chat.conversation";
import { useFileUpload } from "@/app/hooks/useFileUpload";

interface ChatMainProps {
  userId?: string; // Add userId prop for file uploads
}

const ChatMain: FC<ChatMainProps> = ({ userId }) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [, startTransition] = useTransition();
  const [showLoadingMessage, setShowLoadingMessage] = useState<boolean>(false);

  // File upload hook
  const {
    attachedFiles,
    isUploading,
    uploadFiles,
    // removeFile,
    // clearFiles,
    updateFiles,
  } = useFileUpload({
    userId,
    maxFiles: 10,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    onFilesChange: (files) => {
      console.log("Files changed:", files);
    },
  });

  const { messages, input, handleInputChange, handleSubmit, status, stop } =
    useChat({
      api: "/api/chat",
      initialMessages: [],
      maxSteps: 4,
      generateId: generateId,
      onError: (error) => {
        console.error("Chat error:", error);
        toast.error("An error occurred while processing your request.");
        setShowLoadingMessage(false); // Hide loading on error
      },
      onFinish: () => {
        console.log("Chat finished");
        setShowLoadingMessage(false); // Hide loading when finished
      },
    });

  // Enhanced submit handler that includes file data
  const handleFormSubmit = (
    event?:
      | {
          preventDefault?: (() => void) | undefined;
        }
      | undefined,
    chatRequestOptions?: ChatRequestOptions | undefined
  ) => {
    // Check if there are files being uploaded
    if (isUploading) {
      toast.error("Please wait for file uploads to complete");
      return;
    }

    // Start transition and show loading message
    startTransition(() => {
      setShowLoadingMessage(true);
    });

    // Include attached files in the submission
    const filesData = attachedFiles.map((file) => ({
      id: file.id,
      name: file.name,
      url: file.url,
      size: file.size,
    }));

    // Add files to the chat request options
    if (
      chatRequestOptions?.data &&
      typeof chatRequestOptions.data === "object"
    ) {
      const options = {
        ...chatRequestOptions,
        data: {
          files: filesData,
          ...chatRequestOptions.data,
        },
      };
      handleSubmit(event, options);
    } else {
      const options = {
        ...chatRequestOptions,
        data: {
          files: filesData,
        },
      };
      handleSubmit(event, options);
    }

    // Optionally clear files after submission
    // Uncomment the line below if you want to clear files after each message
    // clearFiles();
  };

  // Handle file input change
  const handleFileChange = async (files: File[]) => {
    await uploadFiles(files);
  };

  // Remove loading message when streaming starts
  useEffect(() => {
    if (status === "streaming" && showLoadingMessage) {
      setShowLoadingMessage(false);
    }
  }, [status, showLoadingMessage]);

  return (
    <>
      <SidebarProvider
        className="flex h-screen w-full flex-col md:flex-row"
        defaultOpen={sidebarOpen}
        open={sidebarOpen}
        onOpenChange={(open) => setSidebarOpen(open)}
      >
        <AppSidebar
          className="hidden md:block"
          style={{
            width: "var(--sidebar-width)",
          }}
        />
        <SidebarInset
          className={cn(
            "flex-1 md:pl-[var(--sidebar-width)] md:pr-0 transition-all duration-300 ease-in-out",
            !sidebarOpen ? "md:pl-0" : ""
          )}
          style={{
            transitionDelay: sidebarOpen ? "0.3s" : "0s",
          }}
        >
          <ChatNav />
          <div className="max-w-screen-xl mx-auto flex h-full w-full flex-col justify-between gap-4 px-4 py-2 md:px-8">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full">
                <h3 className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center font-semibold">
                  What&apos;s on the agenda today?
                </h3>
              </div>
            )}
            {messages.length > 0 && (
              <ChatConversation
                messages={messages}
                showLoading={showLoadingMessage}
              />
            )}
            <ChatForm
              messages={messages}
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleFormSubmit}
              status={status}
              stop={stop}
              userId={userId}
              attachedFiles={attachedFiles}
              onFilesChange={updateFiles}
              onFileUpload={handleFileChange}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
};

export default ChatMain;
