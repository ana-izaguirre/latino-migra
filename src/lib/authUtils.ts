import { GoogleUser } from "../types";

/**
 * Whether a user holds administrator privileges.
 *
 * The flag is set once at sign-in from the `admins/{uid}` document, which no
 * client can write — see `isUserAdmin` in `src/lib/firebase.ts` and the
 * `admins` rule in `firestore.rules`. This function deliberately consults
 * nothing else: it previously short-circuited on `user.role === "admin"`, and
 * because `users/{uid}` is writable by its owner, that let any signed-in user
 * grant themselves the admin interface.
 */
export function isAdmin(user: GoogleUser | null | undefined): boolean {
  return user?.isAdmin === true;
}
