"use client"

import { useEffect, useState } from "react"
import type { Vendedor } from "@/types"
import { getVendedores } from "@/lib/supabase-data"
import { VendedoresTable } from "./vendedores-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Users, UserCheck, Clock, RefreshCw, AlertCircle, UserPlus } from "lucide-react"

export function Dashboard() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const loadVendedores = async () => {
    try {
      setLoading(true)
      const data = await getVendedores()
      setVendedores(data || [])
      setError("")
    } catch (err: any) {
      setError(err.message || "Erro ao carregar vendedores")
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Não foi possível carregar os vendedores.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSyncFromCRM = async () => {
    setIsSyncing(true)
    setError("")
    try {
      const response = await fetch("/api/sync-crm", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro na sincronização: ${response.statusText}`)
      }

      const result = await response.json()

      toast({
        title: "Sincronização Iniciada",
        description: "Buscando vendedores do CRM. A lista será atualizada em breve.",
      })

      // Aguarda um momento para o webhook processar e então atualiza a lista
      setTimeout(() => {
        loadVendedores()
        toast({
          title: "Sucesso",
          description: "A lista de vendedores foi atualizada.",
        })
      }, 3000) // 3 segundos de delay

    } catch (err: any) {
      setError(err.message)
      toast({
        variant: "destructive",
        title: "Erro ao Sincronizar",
        description: err.message,
      })
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    loadVendedores()
  }, [])

  const stats = {
    total: vendedores.length,
    ativos: vendedores.filter((v) => v.status === true).length,
    pendentes: vendedores.filter((v) => v.status === false).length,
  }

  if (loading && vendedores.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gerenciar</h1>
          <p className="text-sm text-muted-foreground">Gerencie os vendedores e suas ativações</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSyncFromCRM} variant="outline" size="sm" disabled={isSyncing || loading}>
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Buscar do CRM
          </Button>
          <Button onClick={loadVendedores} variant="outline" size="sm" disabled={loading || isSyncing}>
            {loading && !isSyncing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Vendedores cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendedores Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
            <p className="text-xs text-muted-foreground">Com acesso liberado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
            <p className="text-xs text-muted-foreground">Aguardando ativação</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Vendedores Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Vendedores</CardTitle>
          <CardDescription className="text-sm">Lista de todos os vendedores cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <VendedoresTable vendedores={vendedores} onRefresh={loadVendedores} />
        </CardContent>
      </Card>
    </div>
  )
}
