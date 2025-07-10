import { createClient } from "@supabase/supabase-js"

const supabaseIntegrationUrl =
  process.env.NEXT_PUBLIC_SUPABASE_INTEGRATION_URL || "https://integration-project.supabase.co"
const supabaseIntegrationKey = process.env.NEXT_PUBLIC_SUPABASE_INTEGRATION_ANON_KEY || "integration-anon-key"

if (!process.env.NEXT_PUBLIC_SUPABASE_INTEGRATION_URL || !process.env.NEXT_PUBLIC_SUPABASE_INTEGRATION_ANON_KEY) {
  console.warn(
    "[Aviso] Variáveis de ambiente do Supabase Integration não foram configuradas. " +
      "A aplicação está usando valores fictícios para o preview.",
  )
}

// Cliente específico para integrações externas (anon) - APENAS PARA LEITURA
export const supabaseIntegration = createClient(supabaseIntegrationUrl, supabaseIntegrationKey)

// Verificar se está em modo demo (apenas baseado nas URLs públicas)
export const isDemoIntegration =
  !process.env.NEXT_PUBLIC_SUPABASE_INTEGRATION_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_INTEGRATION_URL.includes("integration-project.supabase")

// Tipo para Vendedor do Dashboard
export interface VendedorDashboard {
  id: string
  nome: string
  foto: string | null
  meta: number | null
  historico_mensal: any | null
  atividades: any | null
  updated_at: string
  id_crm_seller: string
}

// Função para buscar vendedores do dashboard (APENAS LEITURA)
export async function getVendedoresDashboard(): Promise<VendedorDashboard[]> {
  try {
    console.log("🔄 Buscando vendedores do dashboard...")

    if (isDemoIntegration) {
      console.log("ℹ️ Modo demo - retornando dados fictícios")
      return [
        {
          id: "demo-1",
          nome: "Carlos Ferreira",
          foto: "/placeholder.svg?height=100&width=100",
          meta: 50000,
          historico_mensal: null,
          atividades: null,
          updated_at: new Date().toISOString(),
          id_crm_seller: "CRM005",
        },
        {
          id: "demo-2",
          nome: "Amanda Gabriela",
          foto: null,
          meta: 75000,
          historico_mensal: null,
          atividades: null,
          updated_at: new Date().toISOString(),
          id_crm_seller: "686540ead87a8b001676dab8",
        },
        {
          id: "demo-3",
          nome: "Thiago Souza",
          foto: null,
          meta: 60000,
          historico_mensal: null,
          atividades: null,
          updated_at: new Date().toISOString(),
          id_crm_seller: "68598c79a2d7390014f9deaf8",
        },
      ]
    }

    const { data, error } = await supabaseIntegration.from("vendedores").select("*").order("nome", { ascending: true })

    if (error) {
      console.error("❌ Erro ao buscar vendedores:", error)
      throw error
    }

    console.log("✅ Vendedores encontrados:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("💥 Erro geral ao buscar vendedores:", error)
    throw error
  }
}

// Função para criar vendedor no dashboard (tabela vendedores)
export async function createVendedorDashboard(nome: string, id_crm_seller: string) {
  try {
    if (isDemoIntegration) {
      console.log("[Demo] Simulando criação de vendedor no dashboard");
      return { success: true, demo: true };
    }

    const { data, error } = await supabaseIntegration
      .from("vendedores")
      .insert([
        {
          nome,
          id_crm_seller,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("❌ Erro ao criar vendedor no dashboard:", error);
      throw error;
    }

    console.log("✅ Vendedor criado no dashboard:", data);
    return { success: true, data };
  } catch (error) {
    console.error("💥 Erro geral ao criar vendedor no dashboard:", error);
    throw error;
  }
}

// Funções para integrações futuras
export async function syncWithExternalSystem(data: any) {
  // Implementar sincronização com sistemas externos
  console.log("Sincronizando com sistema externo:", data)
}
