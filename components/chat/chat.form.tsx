import { cn } from "@/lib/utils";
import { ChatRequestOptions, UIMessage } from "ai";
import { ChangeEvent, FC, useRef } from "react";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  ArrowUp,
  CircleStop,
  Paperclip,
  X,
  FileText,
  Loader2,
} from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  uploading?: boolean;
}

interface ChatFormProps {
  className?: string;
  input: string;
  messages: UIMessage[];
  handleInputChange: (
    e: ChangeEvent<HTMLTextAreaElement> | ChangeEvent<HTMLInputElement>
  ) => void;
  handleSubmit: (
    event?:
      | {
          preventDefault?: (() => void) | undefined;
        }
      | undefined,
    chatRequestOptions?: ChatRequestOptions | undefined
  ) => void;
  status: "ready" | "error" | "submitted" | "streaming";
  stop: () => void;
  userId?: string;
  attachedFiles?: UploadedFile[];
  onFilesChange?: (files: UploadedFile[]) => void;
  onFileUpload?: (files: File[]) => void;
}

const ChatForm: FC<ChatFormProps> = ({
  className,
  input,
  handleInputChange,
  handleSubmit,
  status,
  stop,
  userId,
  attachedFiles = [],
  onFilesChange,
  onFileUpload,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (!userId) {
      toast.error("User ID is required for file upload");
      return;
    }

    // Call the onFileUpload callback if provided
    if (onFileUpload) {
      onFileUpload(files);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const updatedFiles = attachedFiles.filter((file) => file.id !== fileId);
    onFilesChange?.(updatedFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isUploading = attachedFiles.some((file) => file.uploading);

  return (
    <div className="space-y-2">
      {/* File chips */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 py-2 bg-muted/50 rounded-lg">
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 bg-background border rounded-full px-3 py-1 text-sm"
            >
              <FileText className="size-3 text-blue-500" />
              <span className="max-w-[150px] truncate">{file.name}</span>
              <span className="text-muted-foreground text-xs">
                {formatFileSize(file.size)}
              </span>
              {file.uploading ? (
                <Loader2 className="size-3 animate-spin text-blue-500" />
              ) : (
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="hover:bg-destructive/10 rounded-full p-0.5 transition-colors"
                  type="button"
                >
                  <X className="size-3 text-destructive" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <form action="" onSubmit={handleSubmit} className="relative">
        <Textarea
          data-testid="multimodal-input"
          ref={textareaRef}
          placeholder="Send a message..."
          value={input}
          onChange={handleInputChange}
          className={cn(
            "min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 dark:border-zinc-700",
            className
          )}
          rows={3}
          autoFocus
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();

              if (status !== "ready") {
                toast.error(
                  "Please wait for the model to finish its response!"
                );
              } else if (isUploading) {
                toast.error("Please wait for file uploads to complete!");
              } else {
                handleSubmit();
              }
            }
          }}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          {status === "streaming" || status === "submitted" ? (
            <Button
              type="button"
              onClick={stop}
              className="rounded-full bg-white [&_svg]:size-5 [&_svg]:text-black   p-2"
            >
              <CircleStop />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={status !== "ready" || isUploading}
              className="rounded-full p-2 [&_svg]:size-5"
            >
              <ArrowUp />
            </Button>
          )}
        </div>
        <div className="absolute bottom-1 left-2 right-0 h-10 flex items-center justify-start">
          <input
            type="file"
            className="hidden"
            accept="application/pdf"
            ref={fileInputRef}
            multiple
            onChange={handleFileChange}
            tabIndex={-1}
            data-testid="file-input"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className={cn(
              "cursor-pointer bg-white hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors rounded-full p-2 border",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isUploading ? (
              <Loader2 className="size-5 text-muted-foreground animate-spin" />
            ) : (
              <Paperclip className="size-5 text-muted-foreground" />
            )}
          </label>
        </div>
      </form>
    </div>
  );
};

export default ChatForm;
