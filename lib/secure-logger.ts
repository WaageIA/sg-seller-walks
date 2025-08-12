/**
 * Sistema de logs seguros - remove dados sensíveis automaticamente
 */

// Campos que devem ser mascarados nos logs
const SENSITIVE_FIELDS = [
  'password', 'senha', 'token', 'key', 'secret', 'auth',
  'email', 'cpf', 'rg', 'telefone', 'phone'
]

// Função para mascarar dados sensíveis
function maskSensitiveData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => maskSensitiveData(item))
  }

  const masked: any = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()
    
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      // Mascarar dados sensíveis
      if (typeof value === 'string') {
        if (lowerKey.includes('email')) {
          const [local, domain] = (value as string).split('@')
          masked[key] = `${local.substring(0, 2)}***@${domain}`
        } else {
          masked[key] = '***MASKED***'
        }
      } else {
        masked[key] = '***MASKED***'
      }
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value)
    } else {
      masked[key] = value
    }
  }
  
  return masked
}

// Logger seguro
export const secureLogger = {
  info: (message: string, data?: any) => {
    const maskedData = data ? maskSensitiveData(data) : undefined
    console.log(`ℹ️ [INFO] ${message}`, maskedData)
  },
  
  error: (message: string, error?: any) => {
    const maskedError = error ? maskSensitiveData(error) : undefined
    console.error(`❌ [ERROR] ${message}`, maskedError)
  },
  
  warn: (message: string, data?: any) => {
    const maskedData = data ? maskSensitiveData(data) : undefined
    console.warn(`⚠️ [WARN] ${message}`, maskedData)
  },
  
  success: (message: string, data?: any) => {
    const maskedData = data ? maskSensitiveData(data) : undefined
    console.log(`✅ [SUCCESS] ${message}`, maskedData)
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      const maskedData = data ? maskSensitiveData(data) : undefined
      console.log(`🐛 [DEBUG] ${message}`, maskedData)
    }
  }
}