import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // Database & Security
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32, "Secret harus minimal 32 karakter biar aman!"),
  BETTER_AUTH_URL: z.string().url(),

  // App Config
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Ubah PORT jadi number otomatis biar app.listen gak protes
  PORT: z.string().transform((v) => parseInt(v, 10)).default('3000'),

  // URLs
  FRONTEND_URL: z.string().url(),

  // OAuth Providers (Optional tapi butuh validasi kalau ada)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // AI Features
  GEMINI_API_KEY: z.string().min(1, "Gemini API Key wajib diisi buat fitur Scan Struk!"),
});

export const env = envSchema.parse(process.env);