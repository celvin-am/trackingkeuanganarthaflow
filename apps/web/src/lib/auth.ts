import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Target ke /api/auth
  baseURL: `${import.meta.env.VITE_API_URL}/auth`,

  advanced: {
    cookiePrefix: "arthaflow" // HARUS SAMA dengan backend
  }
});