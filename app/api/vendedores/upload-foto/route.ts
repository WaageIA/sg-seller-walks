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
    const formData = await request.formData()
    const file = formData.get("file") as File
    const vendedorId = formData.get("vendedorId") as string

    if (!file || !vendedorId) {
      return NextResponse.json({ error: "Arquivo ou ID do vendedor não fornecido" }, { status: 400 })
    }

    console.log(`🔄 API: Fazendo upload da foto para vendedor ${vendedorId}`)

    // Gerar nome único para o arquivo
    const fileExt = file.name.split(".").pop()
    const fileName = `${vendedorId}-${Date.now()}.${fileExt}`

    // Upload para o bucket
    const { data: uploadData, error: uploadError } = await supabaseIntegrationAdmin.storage
      .from("imagens-vendedores")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      console.error("❌ Erro no upload:", uploadError)
      throw uploadError
    }

    // Obter URL pública
    const { data: urlData } = supabaseIntegrationAdmin.storage.from("imagens-vendedores").getPublicUrl(fileName)

    console.log("✅ Upload concluído:", urlData.publicUrl)

    return NextResponse.json({
      success: true,
      publicUrl: urlData.publicUrl,
      path: uploadData.path,
    })
  } catch (error: any) {
    console.error("💥 Erro geral no upload:", error)
    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
