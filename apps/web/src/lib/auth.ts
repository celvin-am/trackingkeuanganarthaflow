import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // 🔥 WAJIB: Pakai path relatif biar kena proxy vercel.json
  baseURL: "/api/auth",

  fetchOptions: {
    // Biar useSession bawa cookie pas nembak ke API
    credentials: "include",
  },
  advanced: {
    cookiePrefix: "arthaflow"
  }
});

export const { useSession, signIn, signUp, signOut } = authClient;