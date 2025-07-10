"use client"

import { useState } from "react"
import type { Vendedor } from "@/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AtivarVendedorModal } from "./ativar-vendedor-modal"
import { ConfirmModal } from "./confirm-modal"
import { UserCheck, Search, Filter, UserX, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VendedoresTableProps {
  vendedores: Vendedor[]
  onRefresh: () => void
}

export function VendedoresTable({ vendedores, onRefresh }: VendedoresTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    type: "deactivate" | "delete"
    vendedor: Vendedor | null
  }>({
    open: false,
    type: "deactivate",
    vendedor: null,
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const filteredVendedores = vendedores.filter((vendedor) => {
    const matchesSearch =
      vendedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendedor.email.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesStatus = true
    if (statusFilter === "ativo") {
      matchesStatus = vendedor.status === true
    } else if (statusFilter === "pendente") {
      matchesStatus = vendedor.status === false
    }

    return matchesSearch && matchesStatus
  })

  const handleAtivar = (vendedor: Vendedor) => {
    setSelectedVendedor(vendedor)
    setModalOpen(true)
  }

  const handleDesativar = (vendedor: Vendedor) => {
    setConfirmModal({
      open: true,
      type: "deactivate",
      vendedor,
    })
  }

  const handleExcluir = (vendedor: Vendedor) => {
    setConfirmModal({
      open: true,
      type: "delete",
      vendedor,
    })
  }

  const executeAction = async () => {
    if (!confirmModal.vendedor) return

    setLoading(true)
    try {
      const endpoint = confirmModal.type === "deactivate" ? "/api/deactivate-user" : "/api/delete-user"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_user_crm: confirmModal.vendedor.id_user_crm,
          email: confirmModal.vendedor.email,
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

      onRefresh()
      setConfirmModal({ open: false, type: "deactivate", vendedor: null })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: boolean) => {
    if (status === true) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
          Ativo
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
        Pendente
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela - Responsiva */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Nome</TableHead>
                <TableHead className="min-w-[200px]">Email</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="text-right min-w-[140px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum vendedor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendedores.map((vendedor) => (
                  <TableRow key={vendedor.id_user_crm}>
                    <TableCell className="font-medium">
                      <div className="truncate max-w-[150px]" title={vendedor.nome}>
                        {vendedor.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-[200px]" title={vendedor.email}>
                        {vendedor.email}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(vendedor.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Botão Ativar - apenas para Pendentes */}
                        {vendedor.status === false && (
                          <Button
                            size="sm"
                            onClick={() => handleAtivar(vendedor)}
                            className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1 h-7"
                            title="Ativar vendedor"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Ativar</span>
                          </Button>
                        )}

                        {/* Botão Desativar - apenas para Ativos */}
                        {vendedor.status === true && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDesativar(vendedor)}
                            className="text-yellow-700 border-yellow-300 hover:bg-yellow-50 text-xs px-2 py-1 h-7"
                            title="Desativar vendedor"
                          >
                            <UserX className="h-3 w-3" />
                            <span className="hidden sm:inline ml-1">Desativar</span>
                          </Button>
                        )}

                        {/* Botão Excluir - para todos */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExcluir(vendedor)}
                          className="text-red-700 border-red-300 hover:bg-red-50 text-xs px-2 py-1 h-7 ml-1"
                          title="Excluir vendedor"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="hidden sm:inline ml-1">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modals */}
      <AtivarVendedorModal
        vendedor={selectedVendedor}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={onRefresh}
      />

      <ConfirmModal
        open={confirmModal.open}
        onOpenChange={(open) => setConfirmModal({ ...confirmModal, open })}
        onConfirm={executeAction}
        title={
          confirmModal.type === "deactivate"
            ? `Desativar ${confirmModal.vendedor?.nome}?`
            : `Excluir ${confirmModal.vendedor?.nome}?`
        }
        description={
          confirmModal.type === "deactivate"
            ? "O vendedor perderá acesso ao Sistema OCR, mas seus dados serão preservados. Você pode reativá-lo depois."
            : "Todos os dados do vendedor serão removidos permanentemente do sistema, incluindo acesso ao OCR e registros de cadastro."
        }
        confirmText={confirmModal.type === "deactivate" ? "Desativar" : "Excluir"}
        type={confirmModal.type}
        loading={loading}
      />
    </div>
  )
}
