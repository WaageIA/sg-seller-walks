import { type NextRequest, NextResponse } from "next/server"
import { deleteAuthUserAdmin } from "@/lib/supabase-admin"
import { supabaseData } from "@/lib/supabase-data"
import { withAuth } from "@/lib/auth-middleware"
import { deleteUserSchema, validateAndSanitize } from "@/lib/validation"
import { secureLogger } from "@/lib/secure-logger"

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json()
    const { id_user_crm, email } = validateAndSanitize(deleteUserSchema, body)

    secureLogger.info("Excluindo vendedor completamente", { id_user_crm })

    // 1. Buscar user_id na tabela cadastros_user (se existir)
    const { data: cadastroData } = await supabaseData
      .from("cadastros_user")
      .select("user_id")
      .eq("id_user_crm", id_user_crm)
      .single()

    // 2. Remover da tabela cadastros_user (se existir)
    if (cadastroData) {
      await supabaseData.from("cadastros_user").delete().eq("id_user_crm", id_user_crm)

      // 3. Remover usuário do Auth
      if (cadastroData.user_id) {
        try {
          await deleteAuthUserAdmin(cadastroData.user_id)
        } catch (authError) {
          secureLogger.warn("Erro ao remover usuário do Auth", authError)
          // Continua mesmo se falhar no Auth
        }
      }
    }

    // 4. Remover da tabela user_crm_rdstation
    await supabaseData.from("user_crm_rdstation").delete().eq("id_user_crm", id_user_crm)

    secureLogger.success("Vendedor excluído completamente")

    return NextResponse.json({
      success: true,
      message: "Vendedor excluído completamente!",
    })
  } catch (error: any) {
    secureLogger.error("Erro ao excluir vendedor", error)
    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
})