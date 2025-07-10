import { createClient } from "@supabase/supabase-js"

/**
 * Verifica se um usuário já existe no Auth do Supabase Data.
 * – No cliente (browser) sempre devolve null para evitar expor a SERVICE KEY.
 * – No servidor (API Route / Server Component) usa a SERVICE KEY, se disponível.
 */
export async function checkAuthUserExists(email: string) {
  // Executando no browser → não podemos usar a service key
  if (typeof window !== "undefined") return null

  const serviceKey = process.env.SUPABASE_DATA_SERVICE_KEY
  // Se a SERVICE_KEY não estiver configurada (modo demo) devolve null
  if (!serviceKey || serviceKey === "service-key") return null

  const supabaseDataUrl = "https://onslmqspgpdgaryylohk.supabase.co"
  const admin = createClient(supabaseDataUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error) throw error
    return data.users.find((u) => u.email === email) ?? null
  } catch (err) {
    console.error("Erro ao verificar usuário no Auth:", err)
    return null
  }
}
