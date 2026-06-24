import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";

export type AuthErrorCode =
  | "username-taken"
  | "username-not-found"
  | "invalid-username"
  | "weak-password"
  | "email-in-use"
  | "invalid-credentials"
  | "popup-closed"
  | "unknown";

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "AuthError";
  }
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username.trim());
}

/** True if the string looks like an email rather than a username. */
export function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

async function getEmailForUsername(username: string): Promise<string | null> {
  const key = normalizeUsername(username);
  const snap = await getDoc(doc(db, "usernameMappings", key));
  if (!snap.exists()) return null;
  return (snap.data().email as string) ?? null;
}

/**
 * Creates the user's baseline documents. Runs after the auth account exists so
 * security rules (request.auth.uid == uid) are satisfied. No Cloud Functions.
 */
async function provisionUserDocs(
  user: User,
  username: string,
  email: string,
): Promise<void> {
  const key = normalizeUsername(username);
  const batch = writeBatch(db);

  batch.set(doc(db, "usernameMappings", key), {
    email,
    uid: user.uid,
    username: username.trim(),
  });

  batch.set(doc(db, "users", user.uid), {
    uid: user.uid,
    username: username.trim(),
    usernameLower: key,
    email,
    provider: "password",
    streak: 0,
    lastActiveDate: null,
    createdAt: serverTimestamp(),
  });

  batch.set(doc(db, "settings", user.uid), { theme: "system" });

  await batch.commit();
}

export async function signUpWithUsername(
  username: string,
  email: string,
  password: string,
): Promise<User> {
  if (!isValidUsername(username)) {
    throw new AuthError(
      "invalid-username",
      "Username must be 3-20 characters: letters, numbers, or underscores.",
    );
  }

  const existing = await getEmailForUsername(username);
  if (existing) {
    throw new AuthError("username-taken", "That username is already taken.");
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: username.trim() });
    await provisionUserDocs(cred.user, username, email.trim());
    return cred.user;
  } catch (err) {
    throw mapFirebaseError(err);
  }
}

/** Accepts either a username or an email plus a password. */
export async function signInWithIdentifier(
  identifier: string,
  password: string,
): Promise<User> {
  let email = identifier.trim();

  if (!looksLikeEmail(identifier)) {
    const resolved = await getEmailForUsername(identifier);
    if (!resolved) {
      throw new AuthError("username-not-found", "No account found for that username.");
    }
    email = resolved;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err) {
    throw mapFirebaseError(err);
  }
}

export async function signInWithGoogle(): Promise<User> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const userRef = doc(db, "users", cred.user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: cred.user.uid,
        username: cred.user.displayName ?? cred.user.email?.split("@")[0] ?? "Learner",
        email: cred.user.email,
        provider: "google",
        streak: 0,
        lastActiveDate: null,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "settings", cred.user.uid), { theme: "system" }, { merge: true });
    }
    return cred.user;
  } catch (err) {
    throw mapFirebaseError(err);
  }
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}

function mapFirebaseError(err: unknown): AuthError {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/email-already-in-use":
      return new AuthError("email-in-use", "An account with that email already exists.");
    case "auth/weak-password":
      return new AuthError("weak-password", "Password must be at least 6 characters.");
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return new AuthError("invalid-credentials", "Incorrect login details. Please try again.");
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return new AuthError("popup-closed", "Sign-in was cancelled.");
    default:
      return new AuthError("unknown", "Something went wrong. Please try again.");
  }
}
