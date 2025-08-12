import { createClient } from "@supabase/supabase-js"
import { supabaseConfig } from "./secure-config"

if (supabaseConfig.auth.isDemo) {
  console.warn(
    "[Aviso] Variáveis de ambiente do Supabase Auth não foram configuradas. " +
      "A aplicação está usando valores fictícios para o preview.",
  )
}

// Cliente específico para autenticação
export const supabaseAuth = createClient(
  supabaseConfig.auth.url,
  supabaseConfig.auth.anonKey
)

export const isDemoAuth = supabaseConfig.auth.isDemo
