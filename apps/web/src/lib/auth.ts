import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Pastikan ini hasilnya https://arthaflow-api.vercel.app/api/auth
  baseURL: `${import.meta.env.VITE_API_URL}/auth`,

  advanced: {
    cookiePrefix: "arthaflow"
  }
});

export const { useSession, signIn, signUp, signOut } = authClient;