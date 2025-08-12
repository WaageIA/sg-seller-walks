/**
 * Configuração segura - centraliza e valida variáveis de ambiente
 */

// Validação de variáveis obrigatórias
function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não encontrada: ${key}`)
  }
  return value
}

// Configuração segura do Supabase
export const supabaseConfig = {
  // Supabase Auth (para login/autenticação do sistema de gestão)
  auth: {
    url: process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL || 'https://auth-project.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_AUTH_ANON_KEY || 'auth-anon-key',
    isDemo: !process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL || 
            process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL.includes('auth-project.supabase')
  },
  
  // Supabase Data - Sistema OCR (para dados dos vendedores e criação de acesso OCR)
  data: {
    url: process.env.NEXT_PUBLIC_SUPABASE_DATA_URL || 'https://onslmqspgpdgaryylohk.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_DATA_ANON_KEY || 
             'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uc2xtcXNwZ3BkZ2FyeXlsb2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTc5MTIsImV4cCI6MjA2NjI5MzkxMn0.7vk-mIwxe0CI5yimmjlvmEkvhKil7wxviQbO0cpjiGg',
    serviceKey: process.env.SUPABASE_DATA_SERVICE_KEY,
    isDemo: !process.env.SUPABASE_DATA_SERVICE_KEY || 
            process.env.SUPABASE_DATA_SERVICE_KEY === 'service-key'
  },
  
  // Supabase Integration (para integrações externas - dashboard)
  integration: {
    url: process.env.NEXT_PUBLIC_SUPABASE_INTEGRATION_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_INTEGRATION_ANON_KEY,
    serviceKey: process.env.SUPABASE_INTEGRATION_SERVICE_KEY,
    isDemo: !process.env.SUPABASE_INTEGRATION_SERVICE_KEY
  }
}

// Configuração de webhooks
export const webhookConfig = {
  crmUrl: process.env.CRM_WEBHOOK_URL,
  isConfigured: !!process.env.CRM_WEBHOOK_URL
}

// Configuração de segurança
export const securityConfig = {
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minuto
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '20')
  },
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-demo',
  
  // Ambiente
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
}

// Função para verificar se está em modo demo
export function isDemoMode(): boolean {
  return supabaseConfig.auth.isDemo || supabaseConfig.data.isDemo
}

// Função para validar configuração crítica
export function validateCriticalConfig(): void {
  if (securityConfig.isProduction) {
    // Em produção, certas configurações são obrigatórias
    if (supabaseConfig.auth.isDemo) {
      console.warn('⚠️ AVISO: Executando em produção com configuração de demo para Auth')
    }
    
    if (supabaseConfig.data.isDemo) {
      console.warn('⚠️ AVISO: Executando em produção com configuração de demo para Data')
    }
    
    if (securityConfig.jwtSecret === 'fallback-secret-for-demo') {
      console.warn('⚠️ AVISO: Usando JWT secret padrão em produção')
    }
  }
}