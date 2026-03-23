import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Jika VITE_API_URL lo .../api, maka ini jadi .../api/auth
  baseURL: `${import.meta.env.VITE_API_URL}/auth`,

  advanced: {
    // 🔥 WAJIB: Harus sama persis dengan backend
    cookiePrefix: "arthaflow"
  }
});

export const { useSession, signIn, signUp, signOut } = authClient;