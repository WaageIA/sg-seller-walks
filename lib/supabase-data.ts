import { createClient } from "@supabase/supabase-js"
import type { CadastroUser } from "@/types"
import { checkAuthUserExists } from "@/lib/auth-utils" // Assuming this is where checkAuthUserExists is declared

// URLs do Supabase Data (Sistema OCR) - APENAS CLIENTE PÚBLICO
const supabaseDataUrl = "https://onslmqspgpdgaryylohk.supabase.co"
const supabaseDataKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uc2xtcXNwZ3BkZ2FyeXlsb2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTc5MTIsImV4cCI6MjA2NjI5MzkxMn0.7vk-mIwxe0CI5yimmjlvmEkvhKil7wxviQbO0cpjiGg"

// Cliente específico para dados dos vendedores (APENAS OPERAÇÕES PÚBLICAS)
export const supabaseData = createClient(supabaseDataUrl, supabaseDataKey)

// Função para buscar vendedores (OPERAÇÃO PÚBLICA)
export async function getVendedores() {
  const { data, error } = await supabaseData
    .from("user_crm_rdstation")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// Função para verificar se vendedor já tem cadastro na tabela cadastros_user (OPERAÇÃO PÚBLICA)
export async function checkExistingCadastro(id_user_crm: string) {
  const { data, error } = await supabaseData.from("cadastros_user").select("*").eq("id_user_crm", id_user_crm).single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 = No rows found (esperado quando não existe)
    throw error
  }

  return data // null se não existir, objeto se existir
}

// Função para verificar sincronização de status entre tabelas (OPERAÇÃO PÚBLICA)
export async function checkStatusSync(id_user_crm: string) {
  try {
    const [crmResult, cadastroResult] = await Promise.all([
      supabaseData.from("user_crm_rdstation").select("status").eq("id_user_crm", id_user_crm).single(),
      supabaseData.from("cadastros_user").select("status").eq("id_user_crm", id_user_crm).single(),
    ])

    const crmStatus = crmResult.data?.status
    const cadastroStatus = cadastroResult.data?.status

    return {
      crm_status: crmStatus,
      cadastro_status: cadastroStatus,
      synchronized: crmStatus === cadastroStatus,
      crm_exists: !crmResult.error,
      cadastro_exists: !cadastroResult.error,
    }
  } catch (error) {
    console.error("Erro ao verificar sincronização:", error)
    return null
  }
}

// Função para atualizar status do vendedor (sincroniza ambas as tabelas)
export async function updateVendedorStatus(id_user_crm: string, status: boolean) {
  try {
    console.log(`🔄 Iniciando atualização de status para ${id_user_crm}: ${status}`)

    // 1. Atualizar tabela user_crm_rdstation (com client normal)
    const { data: crmData, error: crmError } = await supabaseData
      .from("user_crm_rdstation")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id_user_crm", id_user_crm)
      .select()

    if (crmError) {
      console.error("❌ Erro ao atualizar CRM:", crmError)
      throw crmError
    }
    console.log("✅ user_crm_rdstation atualizado:", crmData)

    // 2. Verificar se existe na tabela cadastros_user
    const { data: checkData, error: checkError } = await supabaseData
      .from("cadastros_user")
      .select("id, id_user_crm, status, nome")
      .eq("id_user_crm", id_user_crm)

    console.log("🔍 Verificação cadastros_user:", { checkData, checkError })

    if (checkError && checkError.code !== "PGRST116") {
      console.error("❌ Erro ao verificar cadastros_user:", checkError)
    }

    // 3. Atualizar tabela cadastros_user (com SERVICE KEY)
    const { data: cadastroData, error: cadastroError } = await supabaseData
      .from("cadastros_user")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id_user_crm", id_user_crm)
      .select()

    if (cadastroError) {
      console.error("❌ Erro ao atualizar cadastros_user:", cadastroError)
      if (cadastroError.code !== "PGRST116") {
        console.warn("⚠️ Erro crítico em cadastros_user:", cadastroError)
      } else {
        console.log("ℹ️ Registro não encontrado em cadastros_user (normal se não foi ativado ainda)")
      }
    } else {
      console.log("✅ cadastros_user atualizado:", cadastroData)
    }

    // 4. Verificação final
    const { data: finalCheck } = await supabaseData
      .from("cadastros_user")
      .select("status")
      .eq("id_user_crm", id_user_crm)
      .single()

    console.log("🔍 Status final em cadastros_user:", finalCheck?.status)

    return {
      success: true,
      crmUpdated: !!crmData?.length,
      cadastroUpdated: !!cadastroData?.length,
      finalStatus: finalCheck?.status,
    }
  } catch (error) {
    console.error("💥 Erro geral ao sincronizar status:", error)
    throw error
  }
}

// Função para verificação completa (Auth + Tabela)
export async function checkCompleteUserStatus(email: string, id_user_crm: string) {
  const [authUser, cadastroUser] = await Promise.all([checkAuthUserExists(email), checkExistingCadastro(id_user_crm)])

  return {
    authExists: !!authUser,
    tableExists: !!cadastroUser,
    authUser: authUser,
    cadastroUser: cadastroUser,
    status: {
      bothExist: !!authUser && !!cadastroUser,
      onlyAuth: !!authUser && !cadastroUser,
      onlyTable: !authUser && !!cadastroUser,
      noneExist: !authUser && !cadastroUser,
    },
  }
}

// Função para criar cadastro no sistema OCR
export async function createCadastroUser(cadastro: Omit<CadastroUser, "id" | "created_at" | "updated_at" | "status">) {
  console.log("🔄 Criando cadastro com dados:", cadastro)

  const insertData = {
    user_id: cadastro.user_id,
    nome: cadastro.nome,
    id_user_crm: cadastro.id_user_crm,
    email: cadastro.email,
    status: true, // FORÇAR SEMPRE TRUE
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  console.log("📝 Dados para inserção:", insertData)

  // USAR SERVICE KEY para inserção
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.from("cadastros_user").insert([insertData]).select()

  if (error) {
    console.error("❌ Erro ao criar cadastro:", error)
    throw error
  }

  console.log("✅ Cadastro criado com sucesso:", data)
  return data
}

// Função para criar usuário no Auth do Sistema OCR (Supabase Data)
export async function createAuthUserOCR(email: string, password: string) {
  if (typeof window !== "undefined") {
    return null
  }

  const demoMode = typeof window !== "undefined" || !process.env.SUPABASE_DATA_SERVICE_KEY

  if (demoMode) {
    // Modo demo - simula criação de usuário
    return {
      user: {
        id: `ocr_user_${Date.now()}`,
        email: email,
      },
    }
  }

  // Criar usuário no Auth do Supabase Data (Sistema OCR)
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Confirma email automaticamente
  })

  if (error) throw error
  return data
}

// Função para reativar usuário existente no Auth (resetar senha)
export async function reactivateAuthUserOCR(userId: string, newPassword: string) {
  if (typeof window !== "undefined") {
    return null
  }

  const demoMode = typeof window !== "undefined" || !process.env.SUPABASE_DATA_SERVICE_KEY

  if (demoMode) {
    // Modo demo - simula reativação
    return {
      user: {
        id: userId,
        email: "demo@email.com",
      },
    }
  }

  // Atualizar senha do usuário existente
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) throw error
  return data
}

// Função para atualizar status na tabela cadastros_user
export async function updateCadastroUserStatus(id_user_crm: string, status: boolean) {
  const { data, error } = await supabaseData
    .from("cadastros_user")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id_user_crm", id_user_crm)

  if (error) throw error
  return data
}

function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("Admin client cannot be used on client side")
  }
  const serviceKey = process.env.SUPABASE_DATA_SERVICE_KEY
  if (!serviceKey || serviceKey === "service-key") {
    throw new Error("Service key not configured")
  }
  return createClient(supabaseDataUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
