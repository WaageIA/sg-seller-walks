import { createClient } from "@supabase/supabase-js"

const supabaseAuthUrl = process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL || "https://auth-project.supabase.co"
const supabaseAuthKey = process.env.NEXT_PUBLIC_SUPABASE_AUTH_ANON_KEY || "auth-anon-key"

if (!process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL || !process.env.NEXT_PUBLIC_SUPABASE_AUTH_ANON_KEY) {
  console.warn(
    "[Aviso] Variáveis de ambiente do Supabase Auth não foram configuradas. " +
      "A aplicação está usando valores fictícios para o preview.",
  )
}

// Cliente específico para autenticação
export const supabaseAuth = createClient(supabaseAuthUrl, supabaseAuthKey)

export const isDemoAuth =
  !process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL.includes("auth-project.supabase")
