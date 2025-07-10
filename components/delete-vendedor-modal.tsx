"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, AlertTriangle, Info } from "lucide-react"

interface DeleteVendedorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  vendedorNome: string
  loading?: boolean
}

export function DeleteVendedorModal({
  open,
  onOpenChange,
  onConfirm,
  vendedorNome,
  loading = false,
}: DeleteVendedorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Remover do Dashboard
          </DialogTitle>
          <DialogDescription className="text-left">
            Remover <strong>{vendedorNome}</strong> da lista de vendedores?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Esta ação remove apenas do dashboard:</strong>
              <ul className="mt-2 text-sm space-y-1">
                <li>• Remove foto e meta do vendedor</li>
                <li>• Vendedor continua ativo no sistema OCR</li>
                <li>• Dados do CRM são preservados</li>
                <li>• Pode ser reativado a qualquer momento</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>A foto e meta configuradas serão perdidas permanentemente.</AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={loading} variant="destructive">
            {loading ? "Removendo..." : "Remover do Dashboard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
