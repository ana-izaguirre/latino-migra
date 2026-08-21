import React, { useState } from "react";
import { ImageOff } from "lucide-react";

interface ImageWithFallbackProps {
  src?: string;
  /** Describes the picture, not the file. Empty when purely decorative. */
  alt: string;
  className?: string;
  /** Prefix for the element's `id`, so E2E can target the fallback. */
  id?: string;
}

/**
 * An image that shows a placeholder instead of a broken-image icon.
 *
 * The scholarship covers are remote URLs on hosts this project does not
 * control. When one stops resolving the browser draws its own broken-image
 * glyph inside a card that otherwise looks fine, which reads as the
 * application being broken rather than one picture being gone.
 *
 * The placeholder is deliberately visible rather than a blank box: a missing
 * cover is worth noticing, and a silent fallback is how a broken feature goes
 * unnoticed here.
 */
export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = "",
  id,
}) => {
  const [failed, setFailed] = useState(false);

  // An empty or absent `src` is a failure too — the browser resolves it
  // against the page URL and fetches the document itself.
  if (failed || !src) {
    return (
      <div
        id={id}
        role="img"
        aria-label={`Imagen no disponible: ${alt}`}
        className={`flex flex-col items-center justify-center gap-1.5 bg-surface-container dark:bg-slate-900 text-on-surface-variant/70 dark:text-slate-500 ${className}`}
      >
        <ImageOff className="w-7 h-7" aria-hidden="true" />
        <span className="text-[11px] font-semibold">Imagen no disponible</span>
      </div>
    );
  }

  return (
    <img
      id={id}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
