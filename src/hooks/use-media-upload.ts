"use client";

import imageCompression from "browser-image-compression";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * World-Class UX: Background Upload (Issue 1, 2 - "Media Seam")
 * - Uses URL.createObjectURL for instant local previews (No Main Thread Lock).
 * - Uploads immediately after selection, not on form submit.
 * - Robust error handling per-file.
 * - NEW: Client-side compression to optimize LCP and save on storage.
 */

interface UploadedFile {
  id: string;
  url: string;
  file: File;
  preview: string;
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
  filePath?: string;
}

/**
 * Generates a collision-resistant client-side ID.
 */
function createClientId(): string {
  return crypto.randomUUID();
}

export function useMediaUpload(bucket: string = "listings") {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const supabase = createSupabaseBrowserClient();

  const uploadFile = useCallback(
    async (fileObj: UploadedFile) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileObj.id ? { ...f, status: "uploading" } : f))
      );

      try {
        // ── PILL: Issue 28.5 - Client-Side Image Compression ─────────────
        // We compress here before upload to keep our free-tier storage clean
        // and ensure visitors don't download 10MB raw JPEGs.
        const compressionOptions = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.8,
        };

        const compressedFile = await imageCompression(fileObj.file, compressionOptions);

        const fileExt = fileObj.file.name.split(".").pop();
        const randomId = createClientId();
        const fileName = `${randomId}-${Date.now()}.${fileExt}`;

        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id;

        if (!userId) {
          throw new Error("Oturum açık değil.");
        }

        const filePath = `listings/${userId}/temp/${fileName}`;

        const { error } = await supabase.storage.from(bucket).upload(filePath, compressedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: fileObj.file.type, // Maintain original content type
        });

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(filePath);

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id ? { ...f, status: "success", url: publicUrl, filePath } : f
          )
        );
      } catch (err) {
        console.error("[MediaUpload] Failed:", err);
        toast.error(`Yükleme hatası: ${fileObj.file.name}`);
        setFiles((prev) => prev.filter((f) => f.id !== fileObj.id));
        if (fileObj.preview) URL.revokeObjectURL(fileObj.preview);
      }
    },
    [bucket, supabase.storage, supabase.auth]
  );

  const onFilesSelected = useCallback(
    (selectedFiles: FileList | File[]) => {
      const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
        id: createClientId(),
        file,
        url: "",
        // PILL: Issue 1 - Instant Preview (No Base64 Lock)
        preview: URL.createObjectURL(file),
        status: "idle",
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      // Automatically start background upload
      // PILL: Issue 2 - Async Background Uploads
      newFiles.forEach(uploadFile);
    },
    [uploadFile]
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const fileToRemove = prev.find((f) => f.id === id);
        if (fileToRemove?.preview) {
          URL.revokeObjectURL(fileToRemove.preview);
        }

        if (fileToRemove?.filePath) {
          supabase.storage.from(bucket).remove([fileToRemove.filePath]).catch(console.error);
        }

        return prev.filter((f) => f.id !== id);
      });
    },
    [bucket, supabase.storage]
  );

  const filesRef = useRef<UploadedFile[]>(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // PILL: Issue 1 - Memory Safety (Unmount cleanup)
  useEffect(() => {
    return () => {
      filesRef.current.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, []);

  return {
    files,
    onFilesSelected,
    removeFile,
    isUploading: files.some((f) => f.status === "uploading"),
    hasError: files.some((f) => f.status === "error"),
  };
}
