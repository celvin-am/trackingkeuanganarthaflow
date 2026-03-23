import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // 🔥 FIX BLANK SCREEN: Pakai window.location.origin biar URL valid
  baseURL: typeof window !== "undefined"
    ? window.location.origin + "/api/auth"
    : "https://arthaflow-web.vercel.app/api/auth",

  fetchOptions: {
    // 🔥 PENTING: Wajib bawa cookie lintas request
    credentials: "include",
  },
  advanced: {
    cookiePrefix: "arthaflow"
  }
});

export const { useSession, signIn, signUp, signOut } = authClient;