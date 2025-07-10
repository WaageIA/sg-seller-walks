"use client"

import type { VendedorDashboard } from "@/lib/supabase-integration"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, User, Target } from "lucide-react"
import Image from "next/image"

interface VendedorCardProps {
  vendedor: VendedorDashboard
  onEdit: () => void
}

export function VendedorCard({ vendedor, onEdit }: VendedorCardProps) {
  const formatMeta = (meta: number | null) => {
    if (!meta) return "Não definida"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(meta)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Foto */}
        <div className="relative h-48 bg-gray-100 flex items-center justify-center">
          {vendedor.foto ? (
            <Image
              src={vendedor.foto || "/placeholder.svg"}
              alt={vendedor.nome}
              fill
              className="object-cover"
              onError={(e) => {
                // Fallback se a imagem não carregar
                const target = e.target as HTMLImageElement
                target.style.display = "none"
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <User className="h-12 w-12 mb-2" />
              <span className="text-sm">Sem foto</span>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg truncate" title={vendedor.nome}>
              {vendedor.nome}
            </h3>
            <p className="text-xs text-muted-foreground">ID: {vendedor.id_crm_seller}</p>
          </div>

          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">Meta</p>
              <p className="text-xs text-muted-foreground">{formatMeta(vendedor.meta)}</p>
            </div>
          </div>

          {vendedor.meta && (
            <Badge variant="outline" className="w-fit">
              Meta definida
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button onClick={onEdit} className="w-full" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </CardFooter>
    </Card>
  )
}
