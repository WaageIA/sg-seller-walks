"use client"

import type { VendedorDashboard } from "@/lib/supabase-integration"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, User, Target, Trash2 } from "lucide-react"
import Image from "next/image"

interface VendedorListItemProps {
  vendedor: VendedorDashboard
  onEdit: () => void
  onDelete: () => void // Nova prop
}

export function VendedorListItem({ vendedor, onEdit, onDelete }: VendedorListItemProps) {
  const formatMeta = (meta: number | null) => {
    if (!meta) return "Não definida"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(meta)
  }

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
      {/* Foto Discreta */}
      <div className="relative h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {vendedor.foto ? (
          <Image
            src={vendedor.foto || "/placeholder.svg"}
            alt={vendedor.nome}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = "none"
            }}
          />
        ) : (
          <User className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      {/* Informações Principais */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-semibold text-base truncate" title={vendedor.nome}>
            {vendedor.nome}
          </h3>
          {vendedor.meta && (
            <Badge variant="outline" className="text-xs">
              Meta definida
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>ID: {vendedor.id_crm_seller}</span>
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            <span>{formatMeta(vendedor.meta)}</span>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button onClick={onEdit} variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
        <Button
          onClick={onDelete}
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
