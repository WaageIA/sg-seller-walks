import { type NextRequest, NextResponse } from "next/server"
import {
  createAuthUserOCRAdmin,
  reactivateAuthUserOCRAdmin,
  createCadastroUserAdmin,
  updateVendedorStatusAdmin,
  checkCompleteUserStatusAdmin,
} from "@/lib/supabase-admin"
import { createVendedorDashboard } from "@/lib/supabase-integration"

export async function POST(request: NextRequest) {
  try {
    const { email, password, id_user_crm, nome } = await request.json()

    if (!email || !password || !id_user_crm || !nome) {
      return NextResponse.json({ error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    console.log("🔄 [API] Iniciando processo de ativação...")

    // 1. Verificação completa (Auth + Tabela)
    console.log("🔍 [API] Verificando status completo do usuário...")
    const userStatus = await checkCompleteUserStatusAdmin(email, id_user_crm)

    let userUID: string
    let actionTaken: string

    // 2. Lógica baseada no status encontrado
    if (userStatus.status.bothExist) {
      // CENÁRIO 1: Existe em ambos (Auth + Tabela) - REATIVAÇÃO SIMPLES
      console.log("✅ [API] Usuário existe em ambos os locais - Reativando...")
      userUID = userStatus.authUser.id
      await reactivateAuthUserOCRAdmin(userUID, password)
      actionTaken = "reactivated_existing"
    } else if (userStatus.status.onlyAuth) {
      // CENÁRIO 2: Existe no Auth mas não na tabela - SINCRONIZAR
      console.log("🔄 [API] Usuário existe no Auth mas não na tabela - Sincronizando...")
      userUID = userStatus.authUser.id
      await reactivateAuthUserOCRAdmin(userUID, password)
      await createCadastroUserAdmin({
        user_id: userUID,
        nome: nome,
        id_user_crm: id_user_crm,
        email: email,
      })
      actionTaken = "synced_auth_to_table"
    } else if (userStatus.status.onlyTable) {
      // CENÁRIO 3: Existe na tabela mas não no Auth - RECRIAR AUTH
      console.log("🔄 [API] Usuário existe na tabela mas não no Auth - Recriando Auth...")
      const authResult = await createAuthUserOCRAdmin(email, password)
      if (!authResult.user) {
        throw new Error("Falha ao recriar usuário no Auth")
      }
      userUID = authResult.user.id

      // Atualizar user_id na tabela com o novo UID (usando função admin)
      const { supabaseData } = await import("@/lib/supabase-data")
      await supabaseData
        .from("cadastros_user")
        .update({ user_id: userUID, updated_at: new Date().toISOString() })
        .eq("id_user_crm", id_user_crm)

      actionTaken = "recreated_auth"
    } else {
      // CENÁRIO 4: Não existe em nenhum lugar - PRIMEIRA ATIVAÇÃO
      console.log("🆕 [API] Usuário não existe - Criando novo cadastro...")
      const authResult = await createAuthUserOCRAdmin(email, password)
      if (!authResult.user) {
        throw new Error("Falha ao criar usuário no Sistema OCR")
      }
      userUID = authResult.user.id

      await createCadastroUserAdmin({
        user_id: userUID,
        nome: nome,
        id_user_crm: id_user_crm,
        email: email,
      })
      actionTaken = "created_new"
    }

    // 3. Atualizar status do vendedor para ativo (sempre) - sincroniza ambas as tabelas
    console.log("🔄 [API] Ativando vendedor em ambas as tabelas...")
    const statusResult = await updateVendedorStatusAdmin(id_user_crm, true)
    console.log("✅ [API] Resultado da ativação:", statusResult)

    // 4. Criar vendedor na tabela do dashboard
    console.log("🔄 [API] Criando vendedor no dashboard...")
    let dashboardResult
    try {
      dashboardResult = await createVendedorDashboard(nome, id_user_crm)
      console.log("✅ [API] Vendedor criado no dashboard:", dashboardResult)
    } catch (dashboardError) {
      console.warn("⚠️ [API] Erro ao criar no dashboard (não crítico):", dashboardError)
      dashboardResult = { success: false, error: dashboardError.message }
    }

    // 5. Definir mensagem baseada na ação
    const messages = {
      reactivated_existing: "Vendedor reativado com sucesso! (Dados já existiam)",
      synced_auth_to_table: "Vendedor reativado e dados sincronizados!",
      recreated_auth: "Vendedor reativado com novo acesso Auth!",
      created_new: "Vendedor ativado com sucesso no Sistema OCR!",
    }

    console.log("✅ [API] Processo de ativação concluído com sucesso!")

    return NextResponse.json({
      success: true,
      message: messages[actionTaken as keyof typeof messages],
      user_id: userUID,
      nome: nome,
      email: email,
      actionTaken: actionTaken,
      isReactivation: actionTaken !== "created_new",
      details: {
        authExisted: userStatus.authExists,
        tableExisted: userStatus.tableExists,
        actionPerformed: actionTaken,
      },
      dashboard: dashboardResult,
    })
  } catch (error: any) {
    console.error("❌ [API] Erro ao processar ativação:", error)
    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor",
        details: "Falha ao processar ativação no Sistema OCR",
      },
      { status: 500 },
    )
  }
}
