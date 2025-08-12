import { type NextRequest, NextResponse } from "next/server"
import {
  createAuthUserOCRAdmin,
  reactivateAuthUserOCRAdmin,
  createCadastroUserAdmin,
  updateVendedorStatusAdmin,
  checkCompleteUserStatusAdmin,
} from "@/lib/supabase-admin"
import { createVendedorDashboard } from "@/lib/supabase-integration"
import { withAuth } from "@/lib/auth-middleware"
import { createUserSchema, validateAndSanitize } from "@/lib/validation"
import { secureLogger } from "@/lib/secure-logger"

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json()
    const { email, password, id_user_crm, nome } = validateAndSanitize(createUserSchema, body)

    secureLogger.info("[CREATE-USER] Iniciando processo de ativação de usuário", { id_user_crm, nome })

    // 1. Verificação completa (Auth + Tabela)
    secureLogger.info("[CREATE-USER] Verificando status completo do usuário")
    const userStatus = await checkCompleteUserStatusAdmin(email, id_user_crm)
    secureLogger.info("[CREATE-USER] Status do usuário verificado", { userStatus })

    let userUID: string
    let actionTaken: string

    // 2. Lógica baseada no status encontrado
    if (userStatus.status.bothExist) {
      // CENÁRIO 1: Existe em ambos (Auth + Tabela) - REATIVAÇÃO SIMPLES
      secureLogger.info("[CREATE-USER] Usuário existe em ambos os locais - Reativando")
      userUID = userStatus.authUser.id
      secureLogger.info("[CREATE-USER] Chamando reactivateAuthUserOCRAdmin")
      await reactivateAuthUserOCRAdmin(userUID, password)
      secureLogger.info("[CREATE-USER] reactivateAuthUserOCRAdmin concluído")
      actionTaken = "reactivated_existing"
    } else if (userStatus.status.onlyAuth) {
      // CENÁRIO 2: Existe no Auth mas não na tabela - SINCRONIZAR
      secureLogger.info("[CREATE-USER] Usuário existe no Auth mas não na tabela - Sincronizando")
      userUID = userStatus.authUser.id
      secureLogger.info("[CREATE-USER] Chamando reactivateAuthUserOCRAdmin")
      await reactivateAuthUserOCRAdmin(userUID, password)
      secureLogger.info("[CREATE-USER] reactivateAuthUserOCRAdmin concluído")
      secureLogger.info("[CREATE-USER] Chamando createCadastroUserAdmin")
      await createCadastroUserAdmin({
        user_id: userUID,
        nome: nome,
        id_user_crm: id_user_crm,
        email: email,
      })
      secureLogger.info("[CREATE-USER] createCadastroUserAdmin concluído")
      actionTaken = "synced_auth_to_table"
    } else if (userStatus.status.onlyTable) {
      // CENÁRIO 3: Existe na tabela mas não no Auth - RECRIAR AUTH
      secureLogger.info("[CREATE-USER] Usuário existe na tabela mas não no Auth - Recriando Auth")
      secureLogger.info("[CREATE-USER] Chamando createAuthUserOCRAdmin")
      const authResult = await createAuthUserOCRAdmin(email, password)
      secureLogger.info("[CREATE-USER] createAuthUserOCRAdmin concluído")
      if (!authResult.user) {
        throw new Error("Falha ao recriar usuário no Auth")
      }
      userUID = authResult.user.id

      // Atualizar user_id na tabela com o novo UID (usando função admin)
      const { supabaseData } = await import("@/lib/supabase-data")
      secureLogger.info("[CREATE-USER] Atualizando user_id na tabela")
      await supabaseData
        .from("cadastros_user")
        .update({ user_id: userUID, updated_at: new Date().toISOString() })
        .eq("id_user_crm", id_user_crm)
      secureLogger.info("[CREATE-USER] user_id na tabela atualizado")

      actionTaken = "recreated_auth"
    } else {
      // CENÁRIO 4: Não existe em nenhum lugar - PRIMEIRA ATIVAÇÃO
      secureLogger.info("[CREATE-USER] Usuário não existe - Criando novo cadastro")
      secureLogger.info("[CREATE-USER] Chamando createAuthUserOCRAdmin")
      const authResult = await createAuthUserOCRAdmin(email, password)
      secureLogger.info("[CREATE-USER] createAuthUserOCRAdmin concluído")
      if (!authResult.user) {
        throw new Error("Falha ao criar usuário no Sistema OCR")
      }
      userUID = authResult.user.id

      secureLogger.info("[CREATE-USER] Chamando createCadastroUserAdmin")
      await createCadastroUserAdmin({
        user_id: userUID,
        nome: nome,
        id_user_crm: id_user_crm,
        email: email,
      })
      secureLogger.info("[CREATE-USER] createCadastroUserAdmin concluído")
      actionTaken = "created_new"
    }

    // 3. Atualizar status do vendedor para ativo (sempre) - sincroniza ambas as tabelas
    secureLogger.info("[CREATE-USER] Ativando vendedor em ambas as tabelas")
    const statusResult = await updateVendedorStatusAdmin(id_user_crm, true)
    secureLogger.success("[CREATE-USER] Resultado da ativação", { success: statusResult.success })

    // 4. Criar vendedor na tabela do dashboard
    secureLogger.info("[CREATE-USER] Criando vendedor no dashboard")
    let dashboardResult
    try {
      dashboardResult = await createVendedorDashboard(nome, id_user_crm)
      secureLogger.success("[CREATE-USER] Vendedor criado no dashboard", { success: dashboardResult.success })
    } catch (dashboardError: any) {
      secureLogger.warn("[CREATE-USER] Erro ao criar no dashboard (não crítico)", { error: dashboardError.message })
      dashboardResult = { success: false, error: dashboardError.message }
    }

    // 5. Definir mensagem baseada na ação
    const messages = {
      reactivated_existing: "Vendedor reativado com sucesso! (Dados já existiam)",
      synced_auth_to_table: "Vendedor reativado e dados sincronizados!",
      recreated_auth: "Vendedor reativado com novo acesso Auth!",
      created_new: "Vendedor ativado com sucesso no Sistema OCR!",
    }

    secureLogger.success("Processo de ativação concluído com sucesso")

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
    secureLogger.error("Erro ao processar ativação", error)
    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor",
        details: "Falha ao processar ativação no Sistema OCR",
      },
      { status: 500 },
    )
  }
})