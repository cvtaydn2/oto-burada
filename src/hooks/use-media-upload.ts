"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
    const randomId = typeof crypto?.randomUUID === "function" 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 11);
    const fileName = `${randomId}-${Date.now()}.${fileExt}`;
    const filePath = `temp/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileObj.file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      toast.error(`Yükleme hatası: ${fileObj.file.name}`);
      // Remove the file from state so the user doesn't stay with a "stuck" preview
      setFiles((prev) => prev.filter((f) => f.id !== fileObj.id));
      if (fileObj.preview) URL.revokeObjectURL(fileObj.preview);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

    setFiles((prev) => 
      prev.map((f) => f.id === fileObj.id ? { ...f, status: "success", url: publicUrl } : f)
    );
  }, [bucket, supabase.storage]);

  const onFilesSelected = useCallback((selectedFiles: FileList | File[]) => {
    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
      id: typeof crypto?.randomUUID === "function" 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 11),
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

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

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
