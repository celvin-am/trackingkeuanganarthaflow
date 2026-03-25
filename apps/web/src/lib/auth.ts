import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "https://api-arthaflow.celvinandra.my.id ", // ✅ Nembak ke API, bukan web
  fetchOptions: {
    credentials: "include",
  },
  advanced: {
    cookiePrefix: "arthaflow-v1",
    cookieDomain: ".celvinandra.my.id"
  }
});

export const { useSession, signIn, signUp, signOut } = authClient;