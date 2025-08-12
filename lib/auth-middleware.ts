import { NextRequest, NextResponse } from 'next/server'
import { supabaseAuth } from './supabase-auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
  }
}

/**
 * Middleware para verificar autenticação em rotas da API
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  try {
    // Verificar se tem token de autorização
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove "Bearer "

    // Verificar token com Supabase Auth
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

    // Adicionar usuário ao request (para uso posterior)
    ;(request as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email || ''
    }

    return null // Continuar com a requisição
  } catch (error) {
    console.error('Erro na verificação de autenticação:', error)
    return NextResponse.json(
      { error: 'Erro interno de autenticação' },
      { status: 500 }
    )
  }
}

/**
 * Wrapper para rotas que precisam de autenticação
 */
export function withAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const authError = await requireAuth(request)
    if (authError) return authError

    return handler(request as AuthenticatedRequest)
  }
}