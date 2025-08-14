import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { updateVendedorSchema, validateAndSanitize } from "@/lib/validation"
import { secureLogger } from "@/lib/secure-logger"
import { supabaseConfig } from "@/lib/secure-config"

const supabaseIntegrationAdmin = createClient(
  supabaseConfig.integration.url!,
  supabaseConfig.integration.serviceKey!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, updates } = validateAndSanitize(updateVendedorSchema, body)

    secureLogger.info("Atualizando vendedor", { id })

    const { data, error } = await supabaseIntegrationAdmin
      .from("vendedores")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      secureLogger.error("Erro ao atualizar vendedor", error)
      throw error
    }

    secureLogger.success("Vendedor atualizado", { id })

    return NextResponse.json({
      success: true,
      data: data[0],
    })
  } catch (error: any) {
    secureLogger.error("Erro geral ao atualizar vendedor", error)
    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}