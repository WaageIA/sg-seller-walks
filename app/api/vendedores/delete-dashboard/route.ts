import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseIntegrationUrl = process.env.NEXT_PUBLIC_SUPABASE_INTEGRATION_URL!
const supabaseIntegrationServiceKey = process.env.SUPABASE_INTEGRATION_SERVICE_KEY!

const supabaseIntegrationAdmin = createClient(supabaseIntegrationUrl, supabaseIntegrationServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { id, nome } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID do vendedor não fornecido" }, { status: 400 })
    }

    console.log(`🗑️ API: Removendo vendedor ${nome} (ID: ${id}) apenas da tabela vendedores`)

    // Verificar se está em modo demo
    const isDemoMode =
      !process.env.SUPABASE_INTEGRATION_SERVICE_KEY ||
      process.env.SUPABASE_INTEGRATION_SERVICE_KEY === "integration-service-key"

    if (isDemoMode) {
      console.log("ℹ️ Modo demo - simulando exclusão")
      return NextResponse.json({
        success: true,
        message: `${nome} removido do dashboard (modo demo)`,
      })
    }

    // Remover apenas da tabela vendedores
    const { error } = await supabaseIntegrationAdmin.from("vendedores").delete().eq("id", id)

    if (error) {
      console.error("❌ Erro ao remover vendedor:", error)
      throw error
    }

    console.log("✅ Vendedor removido do dashboard com sucesso")

    return NextResponse.json({
      success: true,
      message: `${nome} removido do dashboard com sucesso!`,
    })
  } catch (error: any) {
    console.error("💥 Erro geral ao remover vendedor:", error)
    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
