import { z } from 'zod'

// Schema para criação de usuário
export const createUserSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  id_user_crm: z.string().min(1, 'ID do CRM é obrigatório').trim(),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').trim()
})

// Schema para atualização de vendedor
export const updateVendedorSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
  updates: z.object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').trim().optional(),
    email: z.string().email('Email inválido').toLowerCase().trim().optional(),
    telefone: z.string().optional(),
    status: z.boolean().optional(),
    foto_url: z.string().url('URL inválida').optional().or(z.literal(''))
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser fornecido para atualização'
  })
})

// Schema para exclusão de usuário
export const deleteUserSchema = z.object({
  id_user_crm: z.string().min(1, 'ID do CRM é obrigatório').trim(),
  email: z.string().email('Email inválido').toLowerCase().trim().optional()
})

// Schema para sync CRM
export const syncCrmSchema = z.object({
  id_user_crm: z.string().min(1, 'ID do CRM é obrigatório').trim(),
  status: z.boolean()
})

// Função para sanitizar strings
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove caracteres HTML básicos
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
}

// Função para validar e sanitizar dados
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
    throw new Error(`Dados inválidos: ${errors.join(', ')}`)
  }
  
  return result.data
}

// Validação de upload de arquivo
export const uploadFileSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 5 * 1024 * 1024, // 5MB
    'Arquivo deve ter no máximo 5MB'
  ).refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    'Apenas imagens JPEG, PNG ou WebP são permitidas'
  )
})