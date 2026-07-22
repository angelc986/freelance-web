"use client";

import { useState } from "react";
import Lightbox from "./Lightbox";

interface EvidenceImagesProps {
  imagesJson: string | null | undefined;
  className?: string;
}

export default function EvidenceImages({ imagesJson, className = "" }: EvidenceImagesProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!imagesJson) return null;

  let urls: string[] = [];
  try {
    urls = JSON.parse(imagesJson);
  } catch {
    return null;
  }

  if (!urls.length) return null;

  return (
    <>
      <div className={`flex gap-2 mt-2 flex-wrap ${className}`}>
        {urls.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightbox(url)}
            className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer flex-shrink-0"
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </>
  );
}
