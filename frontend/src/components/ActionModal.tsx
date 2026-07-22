"use client";

import { useState, useRef } from "react";
import { uploadEvidence } from "@/lib/api";

// ─── SVG ICONS ───
function IconUpload({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function IconImage({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
    </svg>
  );
}

function IconX({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

interface ActionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string, images: string[]) => void;
  title: string;
  subtitle: string;
  placeholder: string;
  submitLabel: string;
  submitDanger?: boolean;
  loading?: boolean;
  showImages?: boolean;
}

export default function ActionModal({
  open, onClose, onSubmit,
  title, subtitle, placeholder, submitLabel,
  submitDanger = false,
  loading = false,
  showImages = true,
}: ActionModalProps) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        const url = await uploadEvidence(files[i]);
        urls.push(url.url);
      }
      setImages(prev => [...prev, ...urls]);
    } catch { /* ignore */ }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (url: string) => {
    setImages(prev => prev.filter(u => u !== url));
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim(), images);
    setText("");
    setImages([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl animate-modal-enter p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <IconX className="w-4 h-4 text-gray-400" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <h3 className="text-lg font-bold text-dark">{title}</h3>
          <p className="text-sm text-gray mt-1">{subtitle}</p>
        </div>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm resize-none bg-gray-50 max-h-32"
          autoFocus
        />

        {/* Image upload */}
        {showImages && (
          <div className="mt-3">
            {images.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {images.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(url)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <IconX className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFile} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || images.length >= 3}
              className="flex items-center gap-2 text-xs font-medium text-gray hover:text-primary transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <IconImage className="w-4 h-4" />
              )}
              {images.length > 0 ? `Añadir más (${images.length}/3)` : "Añadir fotos como evidencia"}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray text-sm font-medium rounded-xl hover:bg-gray-50 transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || loading}
            className={`flex-1 py-3 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 ${submitDanger ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary-dark"}`}
          >
            {loading ? "Enviando..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
