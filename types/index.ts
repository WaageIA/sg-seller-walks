export interface Vendedor {
  id_user_crm: string
  nome: string
  email: string
  status: boolean // true = Ativo, false = Pendente
  created_at?: string
  updated_at?: string
}

export interface CadastroUser {
  id?: string // Auto-gerado
  user_id: string // UID do Supabase Auth
  nome: string // Nome do vendedor (após user_id)
  id_user_crm: string // Mesmo da tabela user_crm_rdstation
  id_drive?: string // Ignorar por enquanto
  email: string // Email usado no cadastro
  status?: boolean // Status ativo/inativo (true = ativo, false = inativo)
  created_at?: string
  updated_at?: string
}

export interface User {
  id: string
  email: string
  user_metadata?: {
    name?: string
  }
}
