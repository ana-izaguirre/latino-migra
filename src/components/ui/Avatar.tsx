import React from "react";

import { cn } from "../../lib/cn";
import { getSafeImageUrl } from "../../lib/sanitize";

interface AvatarProps {
  /** The person's own picture, when the provider gave one. */
  src?: string | null;
  /** Used for the initial and for the alt text. */
  name: string;
  className?: string;
  id?: string;
}

/** The first letter of the name, or a neutral glyph when there is no name. */
function initialOf(name: string): string {
  const first = name.trim()[0];
  return first ? first.toLocaleUpperCase("es") : "·";
}

/**
 * A person's picture, or their initial — never a stranger's face.
 *
 * The fallback used to be a stock photograph from Unsplash, rendered as though
 * it were the visitor's own (#99). A photograph of somebody else is a claim
 * about who this account belongs to; an initial is not.
 */
export const Avatar: React.FC<AvatarProps> = ({ src, name, className, id }) => {
  const safeSrc = getSafeImageUrl(src);

  if (safeSrc) {
    return (
      <img
        id={id}
        src={safeSrc}
        alt={name}
        referrerPolicy="no-referrer"
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <span
      id={id}
      role="img"
      aria-label={name}
      className={cn(
        "grid place-items-center bg-primary/10 dark:bg-sky-500/20 text-primary dark:text-sky-300 font-bold select-none",
        className
      )}
    >
      {initialOf(name)}
    </span>
  );
};
