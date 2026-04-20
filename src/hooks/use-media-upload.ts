"use client";

import { useState, useCallback, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { toast } from "sonner";

/**
 * World-Class UX: Background Upload (Issue 1, 2 - "Media Seam")
 * - Uses URL.createObjectURL for instant local previews (No Main Thread Lock).
 * - Uploads immediately after selection, not on form submit.
 * - Robust error handling per-file.
 */

interface UploadedFile {
  id: string;
  url: string;
  file: File;
  preview: string;
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
}

export function useMediaUpload(bucket: string = "listings") {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const supabase = createSupabaseBrowserClient();

  const uploadFile = useCallback(async (fileObj: UploadedFile) => {
    setFiles((prev) => 
      prev.map((f) => f.id === fileObj.id ? { ...f, status: "uploading" } : f)
    );

    const fileExt = fileObj.file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `temp/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileObj.file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      toast.error(`Yükleme hatası: ${fileObj.file.name}`);
      setFiles((prev) => 
        prev.map((f) => f.id === fileObj.id ? { ...f, status: "error" } : f)
      );
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

    setFiles((prev) => 
      prev.map((f) => f.id === fileObj.id ? { ...f, status: "success", url: publicUrl } : f)
    );
  }, [bucket, supabase.storage]);

  const onFilesSelected = useCallback((selectedFiles: FileList | File[]) => {
    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
      id: crypto.randomUUID(),
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
  }, [uploadFile]);

  // PILL: Issue 1 - Memory Safety
  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  return {
    files,
    onFilesSelected,
    removeFile: (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id)),
    isUploading: files.some((f) => f.status === "uploading"),
  };
}
