/**
 * Sistema de auditoria para registrar ações críticas do sistema
 */

import { supabaseData } from "./supabase-client"
import { secureLogger } from "./secure-logger"

export interface AuditLog {
  id?: string
  action: string
  resource_type: string
  resource_id: string
  user_id?: string
  user_email?: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  timestamp?: string
}

// Ações auditáveis
export const AUDIT_ACTIONS = {
  USER_CREATED: 'user_created',
  USER_DELETED: 'user_deleted',
  USER_ACTIVATED: 'user_activated',
  USER_DEACTIVATED: 'user_deactivated',
  VENDEDOR_UPDATED: 'vendedor_updated',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  API_ACCESS: 'api_access',
  SECURITY_VIOLATION: 'security_violation'
} as const

// Tipos de recursos
export const RESOURCE_TYPES = {
  USER: 'user',
  VENDEDOR: 'vendedor',
  AUTH: 'auth',
  API: 'api'
} as const

/**
 * Registra uma ação de auditoria
 */
export async function logAuditEvent(event: AuditLog): Promise<void> {
  try {
    const auditRecord = {
      action: event.action,
      resource_type: event.resource_type,
      resource_id: event.resource_id,
      user_id: event.user_id,
      user_email: event.user_email,
      details: event.details ? JSON.stringify(event.details) : null,
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      timestamp: event.timestamp || new Date().toISOString()
    }

    // Em modo demo, apenas loga no console
    if (process.env.NODE_ENV === 'development') {
      secureLogger.info("Audit Event", auditRecord)
      return
    }

    // Em produção, salva no banco (se a tabela existir)
    try {
      await supabaseData
        .from('audit_logs')
        .insert([auditRecord])
    } catch (dbError) {
      // Se a tabela não existir, apenas loga no console
      secureLogger.warn("Tabela de auditoria não encontrada, logando apenas no console", auditRecord)
    }
  } catch (error) {
    secureLogger.error("Erro ao registrar evento de auditoria", error)
  }
}

/**
 * Helper para extrair informações da requisição
 */
export function extractRequestInfo(request: Request): { ip_address?: string; user_agent?: string } {
  return {
    ip_address: request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown'
  }
}

/**
 * Middleware de auditoria para APIs críticas
 */
export function withAudit(
  action: string,
  resourceType: string,
  handler: (request: Request) => Promise<Response>
) {
  return async (request: Request) => {
    const requestInfo = extractRequestInfo(request)
    const startTime = Date.now()
    
    try {
      const response = await handler(request)
      
      // Log de sucesso
      await logAuditEvent({
        action,
        resource_type: resourceType,
        resource_id: 'api_call',
        details: {
          method: request.method,
          url: request.url,
          status: response.status,
          duration_ms: Date.now() - startTime
        },
        ...requestInfo
      })
      
      return response
    } catch (error) {
      // Log de erro
      await logAuditEvent({
        action: AUDIT_ACTIONS.SECURITY_VIOLATION,
        resource_type: RESOURCE_TYPES.API,
        resource_id: 'api_error',
        details: {
          method: request.method,
          url: request.url,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration_ms: Date.now() - startTime
        },
        ...requestInfo
      })
      
      throw error
    }
  }
}