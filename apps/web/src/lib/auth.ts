import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "https://arthaflow-api.vercel.app", // ✅ Nembak ke API, bukan web
  fetchOptions: {
    credentials: "include",
  },
  advanced: {
    cookiePrefix: "arthaflow"
  }
});

export const { useSession, signIn, signUp, signOut } = authClient;