import { createClient } from "@supabase/supabase-js"
import type { CadastroUser } from "@/types"

// URLs do Supabase Data (Sistema OCR)
const supabaseDataUrl = "https://onslmqspgpdgaryylohk.supabase.co"

// Função para criar cliente administrativo (APENAS PARA API ROUTES)
function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("Admin client cannot be used on client side")
  }

  const serviceKey = process.env.SUPABASE_DATA_SERVICE_KEY
  if (!serviceKey || serviceKey === "service-key") {
    // Modo demo
    return null
  }

  return createClient(supabaseDataUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Cliente público para operações básicas
const supabaseDataPublic = createClient(
  supabaseDataUrl,
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uc2xtcXNwZ3BkZ2FyeXlsb2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTc5MTIsImV4cCI6MjA2NjI5MzkxMn0.7vk-mIwxe0CI5yimmjlvmEkvhKil7wxviQbO0cpjiGg",
)

// Função para atualizar status do vendedor (ADMIN - API ROUTES APENAS)
export async function updateVendedorStatusAdmin(id_user_crm: string, status: boolean) {
  try {
    console.log(`🔄 [ADMIN] Iniciando atualização de status para ${id_user_crm}: ${status}`)

    const adminClient = createAdminClient()
    const isDemoMode = !adminClient

    // 1. Atualizar tabela user_crm_rdstation (com client público)
    const { data: crmData, error: crmError } = await supabaseDataPublic
      .from("user_crm_rdstation")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id_user_crm", id_user_crm)
      .select()

    if (crmError) {
      console.error("❌ Erro ao atualizar CRM:", crmError)
      throw crmError
    }
    console.log("✅ user_crm_rdstation atualizado:", crmData)

    if (isDemoMode) {
      console.log("ℹ️ Modo demo - simulando atualização de cadastros_user")
      return {
        success: true,
        crmUpdated: true,
        cadastroUpdated: true,
        finalStatus: status,
      }
    }

    // 2. Atualizar tabela cadastros_user (com SERVICE KEY)
    const { data: cadastroData, error: cadastroError } = await adminClient!
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

    return {
      success: true,
      crmUpdated: !!crmData?.length,
      cadastroUpdated: !!cadastroData?.length,
      finalStatus: status,
    }
  } catch (error) {
    console.error("💥 Erro geral ao sincronizar status:", error)
    throw error
  }
}

// Função para verificar se usuário já existe no Auth Supabase por email (ADMIN)
export async function checkAuthUserExistsAdmin(email: string) {
  const adminClient = createAdminClient()
  const isDemoMode = !adminClient

  if (isDemoMode) {
    // Modo demo - simula verificação
    return null
  }

  try {
    // Buscar usuário no Auth por email
    const { data, error } = await adminClient!.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (error) throw error

    // Procurar usuário com o email específico
    const existingUser = data.users.find((user) => user.email === email)
    return existingUser || null
  } catch (error) {
    console.error("Erro ao verificar usuário no Auth:", error)
    return null
  }
}

// Função para verificação completa (Auth + Tabela) - ADMIN
export async function checkCompleteUserStatusAdmin(email: string, id_user_crm: string) {
  const [authUser, cadastroUser] = await Promise.all([
    checkAuthUserExistsAdmin(email),
    checkExistingCadastroAdmin(id_user_crm),
  ])

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

// Função para verificar cadastro existente (ADMIN)
export async function checkExistingCadastroAdmin(id_user_crm: string) {
  const { data, error } = await supabaseDataPublic
    .from("cadastros_user")
    .select("*")
    .eq("id_user_crm", id_user_crm)
    .single()

  if (error && error.code !== "PGRST116") {
    throw error
  }

  return data
}

// Função para criar cadastro no sistema OCR (ADMIN)
export async function createCadastroUserAdmin(
  cadastro: Omit<CadastroUser, "id" | "created_at" | "updated_at" | "status">,
) {
  console.log("🔄 [ADMIN] Criando cadastro com dados:", cadastro)

  const adminClient = createAdminClient()
  const isDemoMode = !adminClient

  const insertData = {
    user_id: cadastro.user_id,
    nome: cadastro.nome,
    id_user_crm: cadastro.id_user_crm,
    email: cadastro.email,
    status: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  console.log("📝 Dados para inserção:", insertData)

  if (isDemoMode) {
    console.log("ℹ️ Modo demo - simulando criação de cadastro")
    return [{ ...insertData, id: `demo_${Date.now()}` }]
  }

  const { data, error } = await adminClient!.from("cadastros_user").insert([insertData]).select()

  if (error) {
    console.error("❌ Erro ao criar cadastro:", error)
    throw error
  }

  console.log("✅ Cadastro criado com sucesso:", data)
  return data
}

// Função para criar usuário no Auth do Sistema OCR (ADMIN)
export async function createAuthUserOCRAdmin(email: string, password: string) {
  const adminClient = createAdminClient()
  const isDemoMode = !adminClient

  if (isDemoMode) {
    // Modo demo - simula criação de usuário
    return {
      user: {
        id: `ocr_user_${Date.now()}`,
        email: email,
      },
    }
  }

  // Criar usuário no Auth do Supabase Data (Sistema OCR)
  const { data, error } = await adminClient!.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) throw error
  return data
}

// Função para reativar usuário existente no Auth (ADMIN)
export async function reactivateAuthUserOCRAdmin(userId: string, newPassword: string) {
  const adminClient = createAdminClient()
  const isDemoMode = !adminClient

  if (isDemoMode) {
    // Modo demo - simula reativação
    return {
      user: {
        id: userId,
        email: "demo@email.com",
      },
    }
  }

  // Atualizar senha do usuário existente
  const { data, error } = await adminClient!.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) throw error
  return data
}

// Função para deletar usuário do Auth (ADMIN)
export async function deleteAuthUserAdmin(userId: string) {
  const adminClient = createAdminClient()
  const isDemoMode = !adminClient

  if (isDemoMode) {
    console.log("ℹ️ Modo demo - simulando exclusão do Auth")
    return
  }

  const { error } = await adminClient!.auth.admin.deleteUser(userId)
  if (error) throw error
}
