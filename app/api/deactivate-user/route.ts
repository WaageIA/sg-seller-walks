import { type NextRequest, NextResponse } from "next/server"
import { updateVendedorStatusAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const { id_user_crm } = await request.json()

    if (!id_user_crm) {
      return NextResponse.json({ error: "ID do vendedor não fornecido" }, { status: 400 })
    }

    console.log(`🔄 [API] Desativando vendedor ${id_user_crm}`)

    // Desativar vendedor (status = false) - sincroniza ambas as tabelas
    const result = await updateVendedorStatusAdmin(id_user_crm, false)

    console.log("✅ [API] Resultado da desativação:", result)

    return NextResponse.json({
      success: true,
      message: "Vendedor desativado com sucesso!",
      details: result,
    })
  } catch (error: any) {
    console.error("❌ [API] Erro ao desativar vendedor:", error)
    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
