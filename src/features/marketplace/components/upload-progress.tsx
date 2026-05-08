"use client";

import { Check, Loader2, X } from "lucide-react";

interface UploadState {
  status: string;
  progress: number;
  message?: string;
  previewUrl?: string;
}

interface UploadProgressProps {
  uploadStates: Record<string, UploadState>;
}

export function UploadProgress({ uploadStates }: UploadProgressProps) {
  const entries = Object.entries(uploadStates || {});
  if (entries.length === 0) return null;

  // Show only active uploads and recent results
  const items = entries.map(([key, state]) => ({ id: key, ...state }));

  return (
    <div className="fixed right-4 bottom-6 z-50 w-80 max-w-[90vw]">
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border bg-white/95 p-3 shadow-lg shadow-black/5 flex items-center gap-3"
          >
            <div className="flex-shrink-0">
              {item.status === "uploaded" ? (
                <Check className="text-green-600" />
              ) : item.status === "uploading" ? (
                <Loader2 className="animate-spin text-blue-600" />
              ) : (
                <X className="text-rose-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-700 truncate">
                {item.message ?? item.previewUrl ?? item.id}
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-2 bg-primary"
                  style={{ width: `${Math.max(0, Math.min(100, item.progress || 0))}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] text-slate-500">{item.progress}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UploadProgress;
