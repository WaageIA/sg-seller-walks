import { type NextRequest, NextResponse } from "next/server"
import { deleteAuthUserAdmin } from "@/lib/supabase-admin"
import { supabaseData } from "@/lib/supabase-data"

export async function POST(request: NextRequest) {
  try {
    const { id_user_crm, email } = await request.json()

    if (!id_user_crm) {
      return NextResponse.json({ error: "ID do vendedor não fornecido" }, { status: 400 })
    }

    console.log(`🗑️ [API] Excluindo vendedor ${id_user_crm} completamente`)

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
          console.warn("⚠️ [API] Erro ao remover usuário do Auth:", authError)
          // Continua mesmo se falhar no Auth
        }
      }
    }

    // 4. Remover da tabela user_crm_rdstation
    await supabaseData.from("user_crm_rdstation").delete().eq("id_user_crm", id_user_crm)

    console.log("✅ [API] Vendedor excluído completamente")

    return NextResponse.json({
      success: true,
      message: "Vendedor excluído completamente!",
    })
  } catch (error: any) {
    console.error("❌ [API] Erro ao excluir vendedor:", error)
    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
