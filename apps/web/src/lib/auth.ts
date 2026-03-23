import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Pastiin baseURL ini nembak ke domain API lo
  baseURL: import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:3000",

  // 🔥 TAMBAHKAN INI (HARUS SAMA PERSIS DENGAN BACKEND)
  advanced: {
    cookiePrefix: "arthaflow"
  }
});

export const { useSession, signIn, signUp, signOut } = authClient;