import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Usando Supabase DATA - onde estão os vendedores e autenticação OCR
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_DATA_URL!
const supabaseServiceKey = process.env.SUPABASE_DATA_SERVICE_KEY!

// Cliente admin para operações de administração
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { vendedorId, email, newPassword } = await request.json()

    if (!vendedorId || !email || !newPassword) {
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      )
    }

    console.log(`🔑 API: Alterando senha para vendedor ${email} (ID: ${vendedorId})`)

    // Verificar se está em modo demo
    const isDemoMode = 
      !process.env.SUPABASE_DATA_SERVICE_KEY || 
      process.env.SUPABASE_DATA_SERVICE_KEY === "service-key"

    if (isDemoMode) {
      console.log("ℹ️ Modo demo - simulando alteração de senha")
      return NextResponse.json({
        success: true,
        message: `Senha alterada com sucesso (modo demo)`,
      })
    }

    // Validar força da senha
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      )
    }

    // Verificar se contém pelo menos: 1 maiúscula, 1 minúscula, 1 número
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return NextResponse.json(
        { error: "A senha deve conter pelo menos 1 maiúscula, 1 minúscula e 1 número" },
        { status: 400 }
      )
    }

    // Buscar o usuário pelo email para obter o user_id do Supabase Auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (userError) {
      console.error("❌ Erro ao buscar usuários:", userError)
      throw new Error("Erro ao buscar usuário no sistema de autenticação")
    }

    const user = userData.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado no sistema de autenticação" },
        { status: 404 }
      )
    }

    // Alterar a senha usando o Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error("❌ Erro ao alterar senha:", updateError)
      throw new Error("Erro ao alterar senha: " + updateError.message)
    }

    console.log("✅ Senha alterada com sucesso")

    // Log de auditoria (opcional - pode ser implementado futuramente)
    // await supabaseAdmin.from("audit_logs").insert({
    //   action: "password_changed",
    //   user_id: user.id,
    //   details: { vendedor_id: vendedorId, email },
    //   created_at: new Date().toISOString()
    // })

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso!",
    })

  } catch (error: any) {
    console.error("💥 Erro geral ao alterar senha:", error)
    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 }
    )
  }
}