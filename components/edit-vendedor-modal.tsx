"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import type { VendedorDashboard } from "@/lib/supabase-integration"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, User, Target, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface EditVendedorModalProps {
  vendedor: VendedorDashboard | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditVendedorModal({ vendedor, open, onOpenChange, onSuccess }: EditVendedorModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [meta, setMeta] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && vendedor) {
      setMeta(vendedor.meta?.toString() || "")
      setPreviewUrl(vendedor.foto)
      setSelectedFile(null)
      setError("")
    } else {
      setMeta("")
      setPreviewUrl(null)
      setSelectedFile(null)
      setError("")
    }
  }, [open, vendedor])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione apenas arquivos de imagem")
      return
    }

    // Validar tamanho (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB")
      return
    }

    setSelectedFile(file)
    setError("")

    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!vendedor) return

    setLoading(true)
    setError("")

    try {
      let fotoUrl = vendedor.foto

      // Upload da nova foto se selecionada
      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)
        formData.append("vendedorId", vendedor.id)

        const uploadResponse = await fetch("/api/vendedores/upload-foto", {
          method: "POST",
          body: formData,
        })

        const uploadResult = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error)
        }

        fotoUrl = uploadResult.publicUrl
      }

      // Preparar dados para atualização
      const updates: any = {}

      // Adicionar meta se foi alterada
      if (meta !== (vendedor.meta?.toString() || "")) {
        updates.meta = meta ? Number.parseInt(meta) : null
      }

      // Adicionar foto se foi alterada
      if (fotoUrl !== vendedor.foto) {
        updates.foto = fotoUrl
      }

      // Verificar se há algo para atualizar
      if (Object.keys(updates).length === 0) {
        toast({
          title: "Nenhuma alteração",
          description: "Não há alterações para salvar",
        })
        onSuccess()
        return
      }

      const updateResponse = await fetch("/api/vendedores/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: vendedor.id,
          updates,
        }),
      })

      const updateResult = await updateResponse.json()

      if (!updateResponse.ok) {
        throw new Error(updateResult.error)
      }

      toast({
        title: "Sucesso!",
        description: "Vendedor atualizado com sucesso",
      })

      onSuccess()
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar vendedor")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: string) => {
    const numValue = Number.parseInt(value.replace(/\D/g, ""))
    if (isNaN(numValue)) return ""
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue)
  }

  if (!vendedor) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Editar Vendedor
          </DialogTitle>
          <DialogDescription>Atualize a foto e meta de {vendedor.nome}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview da Foto */}
          <div className="space-y-2">
            <Label>Foto do Vendedor</Label>
            <div className="flex flex-col items-center space-y-3">
              <div className="relative h-32 w-32 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
                {previewUrl ? (
                  <Image src={previewUrl || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <User className="h-8 w-8" />
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {previewUrl ? "Alterar Foto" : "Adicionar Foto"}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>
          </div>

          {/* Meta */}
          <div className="space-y-2">
            <Label htmlFor="meta" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Meta de Vendas
            </Label>
            <Input
              id="meta"
              type="number"
              placeholder="Ex: 50000"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              disabled={loading}
            />
            {meta && <p className="text-xs text-muted-foreground">Valor formatado: {formatCurrency(meta)}</p>}
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
