import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "https://api-arthaflow.celvinandra.my.id",
  fetchOptions: {
    credentials: "include",
  },
});

export const { useSession, signIn, signUp, signOut } = authClient;