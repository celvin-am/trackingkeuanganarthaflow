import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Target ke /api/auth
  baseURL: `${import.meta.env.VITE_API_URL}/auth`,

  // 🔥 TAMBAHKAN INI: Wajib agar useSession bawa cookie lintas domain
  fetchOptions: {
    credentials: "include",
  },

  advanced: {
    cookiePrefix: "arthaflow"
  }
});

export const { useSession, signIn, signUp, signOut } = authClient;