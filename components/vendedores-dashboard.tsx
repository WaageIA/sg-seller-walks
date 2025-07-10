"use client"

import { useEffect, useState } from "react"
import { getVendedoresDashboard, type VendedorDashboard } from "@/lib/supabase-integration"
import { EditVendedorModal } from "./edit-vendedor-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, AlertCircle, Users } from "lucide-react"
import { VendedorListItem } from "./vendedor-list-item" // Declare the variable before using it
import { DeleteVendedorModal } from "./delete-vendedor-modal"
import { useToast } from "@/hooks/use-toast"

export function VendedoresDashboard() {
  const [vendedores, setVendedores] = useState<VendedorDashboard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedVendedor, setSelectedVendedor] = useState<VendedorDashboard | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean
    vendedor: VendedorDashboard | null
  }>({
    open: false,
    vendedor: null,
  })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { toast } = useToast()

  const loadVendedores = async () => {
    try {
      setLoading(true)
      const data = await getVendedoresDashboard()
      setVendedores(data || [])
      setError("")
    } catch (err: any) {
      setError(err.message || "Erro ao carregar vendedores")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVendedores()
  }, [])

  const handleEditVendedor = (vendedor: VendedorDashboard) => {
    setSelectedVendedor(vendedor)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedVendedor(null)
  }

  const handleVendedorUpdated = () => {
    loadVendedores()
    handleModalClose()
  }

  const handleDeleteVendedor = (vendedor: VendedorDashboard) => {
    setDeleteModal({
      open: true,
      vendedor,
    })
  }

  const executeDelete = async () => {
    if (!deleteModal.vendedor) return

    setDeleteLoading(true)
    try {
      const response = await fetch("/api/vendedores/delete-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deleteModal.vendedor.id,
          nome: deleteModal.vendedor.nome,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error)
      }

      toast({
        title: "Sucesso!",
        description: result.message,
      })

      loadVendedores()
      setDeleteModal({ open: false, vendedor: null })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Vendedores</h1>
          <p className="text-sm text-muted-foreground">Gerencie fotos e metas dos vendedores</p>
        </div>
        <Button onClick={loadVendedores} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Vendedores</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{vendedores.length}</div>
          <p className="text-xs text-muted-foreground">Vendedores ativos no sistema</p>
        </CardContent>
      </Card>

      {/* Vendedores List */}
      {vendedores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum vendedor encontrado</h3>
            <p className="text-sm text-muted-foreground text-center">
              Os vendedores aparecerão aqui após serem ativados no sistema.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lista de Vendedores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {vendedores.map((vendedor) => (
                <VendedorListItem
                  key={vendedor.id}
                  vendedor={vendedor}
                  onEdit={() => handleEditVendedor(vendedor)}
                  onDelete={() => handleDeleteVendedor(vendedor)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <EditVendedorModal
        vendedor={selectedVendedor}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleVendedorUpdated}
      />

      <DeleteVendedorModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ ...deleteModal, open })}
        onConfirm={executeDelete}
        vendedorNome={deleteModal.vendedor?.nome || ""}
        loading={deleteLoading}
      />
    </div>
  )
}
