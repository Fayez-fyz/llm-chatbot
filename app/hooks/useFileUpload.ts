// hooks/useFileUpload.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  uploading?: boolean;
}

interface UseFileUploadOptions {
  userId?: string;
  onFilesChange?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    userId,
    onFilesChange,
    maxFiles = 10,
    maxFileSize = 10 * 1024 * 1024, // 10MB default
  } = options;

  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  const updateFiles = useCallback(
    (files: UploadedFile[]) => {
      setAttachedFiles(files);
      onFilesChange?.(files);
    },
    [onFilesChange]
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!userId) {
        toast.error("User ID is required for file upload");
        return;
      }

      if (attachedFiles.length + files.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate files
      const validFiles = files.filter((file) => {
        if (file.type !== "application/pdf") {
          toast.error(`${file.name} is not a PDF file`);
          return false;
        }
        if (file.size > maxFileSize) {
          const sizeMB = Math.round(maxFileSize / (1024 * 1024));
          toast.error(`${file.name} exceeds ${sizeMB}MB size limit`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      // Create temporary file objects with uploading state
      const tempFiles: UploadedFile[] = validFiles.map((file) => ({
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        url: "",
        size: file.size,
        uploading: true,
      }));

      // Add temp files to the list immediately
      const updatedFiles = [...attachedFiles, ...tempFiles];
      updateFiles(updatedFiles);

      // Track uploading files
      const newUploadingIds = new Set(tempFiles.map((f) => f.id));
      setUploadingFiles((prev) => new Set([...prev, ...newUploadingIds]));

      try {
        // Upload files in parallel
        const uploadPromises = validFiles.map(async (file, index) => {
          const tempFile = tempFiles[index];
          try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("userId", userId);

            const response = await fetch("/api/upload-pdf", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(
                errorData.error || `Upload failed: ${response.statusText}`
              );
            }

            const result = await response.json();

            return {
              id:
                result.id ||
                `uploaded-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
              name: file.name,
              url: result.url,
              size: file.size,
              uploading: false,
            };
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            toast.error(
              `Failed to upload ${file.name}: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
            return null;
          } finally {
            // Remove from uploading set
            setUploadingFiles((prev) => {
              const newSet = new Set(prev);
              newSet.delete(tempFile.id);
              return newSet;
            });
          }
        });

        // Wait for all uploads to complete
        const results = await Promise.allSettled(uploadPromises);

        // Filter out failed uploads and update the file list
        const successfulUploads = results
          .filter(
            (
              result
            ): result is PromiseFulfilledResult<{
              id: string;
              name: string;
              url: string;
              size: number;
              uploading: boolean;
            }> => result.status === "fulfilled" && result.value !== null
          )
          .map(
            (result) =>
              result.value as {
                id: string;
                name: string;
                url: string;
                size: number;
                uploading?: boolean;
              }
          );

        // Update the file list by removing temp files and adding successful uploads
        const finalFiles = [
          ...attachedFiles.filter(
            (file) => !tempFiles.some((temp) => temp.id === file.id)
          ),
          ...successfulUploads,
        ];
        updateFiles(finalFiles);

        // Show success message
        if (successfulUploads.length > 0) {
          toast.success(
            `Successfully uploaded ${successfulUploads.length} file(s)`
          );
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload files");

        // Remove temp files on error
        const cleanedFiles = attachedFiles.filter(
          (file) => !tempFiles.some((temp) => temp.id === file.id)
        );
        updateFiles(cleanedFiles);
      }
    },
    [userId, attachedFiles, maxFiles, maxFileSize, updateFiles]
  );

  const removeFile = useCallback(
    async (fileId: string) => {
      const fileToRemove = attachedFiles.find((file) => file.id === fileId);
      if (!fileToRemove) return;

      // Immediately remove from UI
      const updatedFiles = attachedFiles.filter((file) => file.id !== fileId);
      updateFiles(updatedFiles);

      // If file is uploaded (not temp), try to delete from server
      if (!fileToRemove.uploading && fileToRemove.url) {
        try {
          const response = await fetch(
            `/api/upload-pdf?fileId=${fileId}&userId=${userId}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            console.error("Failed to delete file from server");
            // Don't show error to user as file is already removed from UI
          }
        } catch (error) {
          console.error("Error deleting file from server:", error);
        }
      }
    },
    [attachedFiles, updateFiles, userId]
  );

  const clearFiles = useCallback(() => {
    updateFiles([]);
    setUploadingFiles(new Set());
  }, [updateFiles]);

  const isUploading = uploadingFiles.size > 0;

  return {
    attachedFiles,
    uploadingFiles,
    isUploading,
    uploadFiles,
    removeFile,
    clearFiles,
    updateFiles,
  };
};
