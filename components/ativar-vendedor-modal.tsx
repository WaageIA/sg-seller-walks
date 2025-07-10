"use client"

import { useState } from "react"
import type { Vendedor } from "@/types"
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
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Database,
  RefreshCw,
  FolderSyncIcon as Sync,
} from "lucide-react"

interface AtivarVendedorModalProps {
  vendedor: Vendedor | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AtivarVendedorModal({ vendedor, open, onOpenChange, onSuccess }: AtivarVendedorModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1)
  const [senha, setSenha] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [userId, setUserId] = useState("")
  const [actionTaken, setActionTaken] = useState("")
  const [details, setDetails] = useState<any>(null)

  const handleAtivar = async () => {
    if (!vendedor) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: vendedor.email,
          password: senha,
          id_user_crm: vendedor.id_user_crm,
          nome: vendedor.nome,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao ativar vendedor no Sistema OCR")
      }

      setUserId(result.user_id)
      setActionTaken(result.actionTaken)
      setDetails(result.details)
      setStep(3) // Sucesso

      setTimeout(() => {
        onSuccess()
        onOpenChange(false)
        resetModal()
      }, 5000)
    } catch (err: any) {
      setError(err.message || "Erro ao ativar vendedor no Sistema OCR")
      setLoading(false)
    }
  }

  const resetModal = () => {
    setStep(1)
    setSenha("")
    setError("")
    setUserId("")
    setActionTaken("")
    setDetails(null)
    setShowPassword(false)
    setLoading(false)
  }

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setSenha(password)
  }

  const getActionIcon = () => {
    switch (actionTaken) {
      case "reactivated_existing":
        return <RefreshCw className="h-8 w-8 text-green-600" />
      case "synced_auth_to_table":
        return <Sync className="h-8 w-8 text-blue-600" />
      case "recreated_auth":
        return <Database className="h-8 w-8 text-yellow-600" />
      default:
        return <CheckCircle className="h-8 w-8 text-green-600" />
    }
  }

  const getActionTitle = () => {
    switch (actionTaken) {
      case "reactivated_existing":
        return "Vendedor Reativado!"
      case "synced_auth_to_table":
        return "Dados Sincronizados!"
      case "recreated_auth":
        return "Auth Recriado!"
      default:
        return "Vendedor Ativado!"
    }
  }

  const getActionDetails = () => {
    switch (actionTaken) {
      case "reactivated_existing":
        return (
          <>
            <p>✅ Usuário já existia no Auth e na tabela</p>
            <p>✅ Senha atualizada no Sistema OCR</p>
            <p>✅ Vendedor reativado com sucesso</p>
          </>
        )
      case "synced_auth_to_table":
        return (
          <>
            <p>🔄 Usuário existia no Auth mas não na tabela</p>
            <p>✅ Registro criado na tabela cadastros_user</p>
            <p>✅ Dados sincronizados com sucesso</p>
          </>
        )
      case "recreated_auth":
        return (
          <>
            <p>🔄 Usuário existia na tabela mas não no Auth</p>
            <p>✅ Novo usuário criado no Auth</p>
            <p>✅ Tabela atualizada com novo UID</p>
          </>
        )
      default:
        return (
          <>
            <p>✅ Usuário criado no Auth do Sistema OCR</p>
            <p>✅ Registrado na tabela cadastros_user</p>
            <p>✅ Vendedor ativado com sucesso</p>
          </>
        )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) resetModal()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            {step === 1 && "Ativar no Sistema OCR"}
            {step === 2 && "Verificando e Processando..."}
            {step === 3 && getActionTitle()}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && `Ativando vendedor no Sistema OCR: ${vendedor?.nome}`}
            {step === 2 && "Verificando Auth e tabela, processando ativação..."}
            {step === 3 && "Processamento concluído com sucesso!"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">Sistema OCR de Cadastro</p>
              <p className="text-xs text-blue-600">Verificação completa: Auth + Tabela</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Vendedor</Label>
              <Input id="nome" value={vendedor?.nome || ""} disabled className="bg-gray-50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email de Acesso OCR</Label>
              <Input id="email" value={vendedor?.email || ""} disabled className="bg-gray-50" />
              <p className="text-xs text-muted-foreground">Sistema verificará Auth Supabase e tabela cadastros_user</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="senha">Senha OCR</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generatePassword}
                  className="text-xs h-7 bg-transparent"
                >
                  Gerar Senha
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite ou gere uma senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Nova senha ou atualização (sistema detectará automaticamente)
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center space-y-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div className="text-center space-y-2">
              <p className="font-medium">Verificando e processando...</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>🔍 Verificando usuário no Auth Supabase</p>
                <p>🔍 Verificando registro na tabela</p>
                <p>⚙️ Processando ação necessária</p>
                <p>✅ Ativando vendedor</p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center space-y-4 py-8">
            {getActionIcon()}
            <div className="text-center space-y-2">
              <p className="font-medium text-green-600 text-lg">{getActionTitle()}</p>
              <div className="text-sm text-muted-foreground space-y-1">
                {getActionDetails()}
                <p>✅ Email: {vendedor?.email}</p>
                {userId && (
                  <div className="bg-gray-100 p-2 rounded mt-2">
                    <p className="text-xs font-mono">User UID: {userId}</p>
                    {details && (
                      <div className="text-xs mt-1 space-y-1">
                        <p>Auth existia: {details.authExisted ? "Sim" : "Não"}</p>
                        <p>Tabela existia: {details.tableExisted ? "Sim" : "Não"}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setStep(2)
                  handleAtivar()
                }}
                disabled={!senha.trim() || senha.length < 6 || loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Processar Ativação
              </Button>
            </>
          )}
          {step === 3 && (
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
