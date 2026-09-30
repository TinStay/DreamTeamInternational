/** True once the Supabase address and key are set (`.env.local`, and Vercel's environment variables for the live site). */
export const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
