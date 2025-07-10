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
    const { id, updates } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID do vendedor não fornecido" }, { status: 400 })
    }

    console.log(`🔄 API: Atualizando vendedor ${id}:`, updates)

    const { data, error } = await supabaseIntegrationAdmin
      .from("vendedores")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("❌ Erro ao atualizar vendedor:", error)
      throw error
    }

    console.log("✅ Vendedor atualizado:", data)

    return NextResponse.json({
      success: true,
      data: data[0],
    })
  } catch (error: any) {
    console.error("💥 Erro geral ao atualizar vendedor:", error)
    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
