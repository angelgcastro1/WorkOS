"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Download, Eye, Paperclip, X } from "lucide-react";

export type GalleryFile = { path: string; name: string; url: string | null };

const IMG_RE = /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i;

function downloadUrl(url: string, name: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}download=${encodeURIComponent(name)}`;
}

export function AttachmentGallery({ files }: { files: GalleryFile[] }) {
  const [preview, setPreview] = useState<GalleryFile | null>(null);

  if (files.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {files.map((f) => {
          const isImage = !!f.url && IMG_RE.test(f.name);
          if (isImage && f.url) {
            return (
              <div key={f.path} className="group relative overflow-hidden rounded-lg border border-border">
                <button type="button" onClick={() => setPreview(f)} className="block" aria-label={`Preview ${f.name}`}>
                  <img src={f.url} alt={f.name} className="h-24 w-24 object-cover transition group-hover:opacity-90" />
                </button>
                <a
                  href={downloadUrl(f.url, f.name)}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-black/55 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label={`Download ${f.name}`}
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-0.5 text-[10px] text-white">{f.name}</span>
              </div>
            );
          }
          return (
            <div key={f.path} className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs">
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="max-w-[180px] truncate">{f.name}</span>
              {f.url ? (
                <span className="flex items-center gap-1">
                  <a href={f.url} target="_blank" rel="noopener noreferrer" title="Preview" aria-label={`Preview ${f.name}`} className="text-muted-foreground transition hover:text-foreground">
                    <Eye className="h-3.5 w-3.5" />
                  </a>
                  <a href={downloadUrl(f.url, f.name)} title="Download" aria-label={`Download ${f.name}`} className="text-muted-foreground transition hover:text-foreground">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {preview?.url ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[92vh] max-w-3xl flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <img src={preview.url} alt={preview.name} className="max-h-[85vh] w-auto rounded-lg object-contain" />
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-sm text-white/80">{preview.name}</span>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={downloadUrl(preview.url, preview.name)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/25"
                >
                  <Download className="h-4 w-4" /> Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/25"
                >
                  <X className="h-4 w-4" /> Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
