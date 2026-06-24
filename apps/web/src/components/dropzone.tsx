"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { UploadIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: File | null;
  previewUrl: string | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeBytes?: number;
  className?: string;
};

export function Dropzone({
  value,
  previewUrl,
  onChange,
  accept = "image/*",
  maxSizeBytes,
  className,
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function isAccepted(file: File): boolean {
    if (!accept || accept === "*" || accept === "*/*") return true;
    const patterns = accept.split(",").map((p) => p.trim()).filter(Boolean);
    return patterns.some((p) => {
      if (p.endsWith("/*")) {
        const prefix = p.slice(0, -1); // "image/"
        return file.type.startsWith(prefix);
      }
      if (p.startsWith(".")) {
        return file.name.toLowerCase().endsWith(p.toLowerCase());
      }
      return file.type === p;
    });
  }

  function acceptFile(file: File) {
    if (!isAccepted(file)) {
      setError("Unsupported file type");
      return;
    }
    if (maxSizeBytes && file.size > maxSizeBytes) {
      setError(`File too large (max ${Math.round(maxSizeBytes / 1024 / 1024)}MB)`);
      return;
    }
    setError(null);
    onChange(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    setError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement | null;
      // Skip if a text field or editable element has focus.
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.kind === "file" && it.type.startsWith("image/")) {
          const file = it.getAsFile();
          if (file) {
            e.preventDefault();
            acceptFile(file);
          }
          return;
        }
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
    // acceptFile closes over `accept` and `maxSizeBytes`; re-bind when those change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accept, maxSizeBytes, onChange]);

  const hasImage = !!previewUrl;

  return (
    <div className="space-y-1.5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "group relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/40 hover:bg-muted/50",
          dragOver && "border-primary bg-primary/5",
          className,
        )}
      >
        {hasImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="absolute inset-0 h-full w-full bg-white object-contain p-2"
            />
            <button
              type="button"
              onClick={clear}
              className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-md bg-background/85 text-foreground/80 opacity-0 backdrop-blur-sm transition-opacity hover:text-destructive group-hover:opacity-100"
              aria-label="Remove image"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-center text-muted-foreground">
            <UploadIcon className="h-5 w-5" />
            <p className="text-xs">
              {dragOver ? "Drop image here" : "Drag, paste, or click to browse"}
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) acceptFile(file);
          }}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {value && !error && (
        <p className="text-[11px] text-muted-foreground">
          {value.name} · {(value.size / 1024).toFixed(0)} KB
        </p>
      )}
    </div>
  );
}
