import { GoogleUser } from "../types";

/**
 * List of authorized administrator emails
 */
export const ADMIN_EMAILS: string[] = [
  "ana.izaguirrematamoros@gmail.com",
  "latinomigra@gmail.com",
  "admin@latinomigra.com",
  "ana.izaguirre@gmail.com",
];

/**
 * Checks if a given user has Administrator privileges
 */
export function isAdmin(user: GoogleUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (!user.email) return false;
  
  const normalizedEmail = user.email.trim().toLowerCase();
  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalizedEmail);
}
