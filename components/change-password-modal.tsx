"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Key, Copy, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import type { Vendedor } from "@/types"

interface ChangePasswordModalProps {
    vendedor: Vendedor | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ChangePasswordModal({ vendedor, open, onOpenChange, onSuccess }: ChangePasswordModalProps) {
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const { toast } = useToast()

    // Função para gerar senha segura
    const generateSecurePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*"
        let password = ""

        // Garantir pelo menos um de cada tipo
        password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]
        password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]
        password += "0123456789"[Math.floor(Math.random() * 10)]
        password += "!@#$%&*"[Math.floor(Math.random() * 7)]

        // Completar com caracteres aleatórios
        for (let i = 4; i < 12; i++) {
            password += chars[Math.floor(Math.random() * chars.length)]
        }

        // Embaralhar a senha
        return password.split('').sort(() => Math.random() - 0.5).join('')
    }

    // Validação de força da senha
    const getPasswordStrength = (password: string) => {
        if (password.length < 8) return { level: 0, text: "Muito fraca", color: "text-red-600" }

        let score = 0
        if (password.length >= 8) score++
        if (/[A-Z]/.test(password)) score++
        if (/[a-z]/.test(password)) score++
        if (/[0-9]/.test(password)) score++
        if (/[^A-Za-z0-9]/.test(password)) score++

        if (score < 3) return { level: 1, text: "Fraca", color: "text-orange-600" }
        if (score < 4) return { level: 2, text: "Média", color: "text-yellow-600" }
        if (score < 5) return { level: 3, text: "Forte", color: "text-green-600" }
        return { level: 4, text: "Muito forte", color: "text-green-700" }
    }

    const handleGeneratePassword = () => {
        const generated = generateSecurePassword()
        setNewPassword(generated)
        setConfirmPassword(generated)

        // Copiar para clipboard
        navigator.clipboard.writeText(generated).then(() => {
            toast({
                title: "Senha gerada!",
                description: "Nova senha copiada para a área de transferência",
            })
        })
    }

    const handleCopyPassword = () => {
        if (newPassword) {
            navigator.clipboard.writeText(newPassword).then(() => {
                toast({
                    title: "Copiado!",
                    description: "Senha copiada para a área de transferência",
                })
            })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!vendedor) return

        setError("")

        // Validações
        if (newPassword.length < 8) {
            setError("A senha deve ter pelo menos 8 caracteres")
            return
        }

        if (newPassword !== confirmPassword) {
            setError("As senhas não conferem")
            return
        }

        const strength = getPasswordStrength(newPassword)
        if (strength.level < 2) {
            setError("A senha deve ser pelo menos de nível médio")
            return
        }

        setLoading(true)

        try {
            const response = await fetch("/api/vendedores/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vendedorId: vendedor.id_user_crm,
                    email: vendedor.email,
                    newPassword,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error)
            }

            toast({
                title: "Sucesso!",
                description: `Senha alterada para ${vendedor.nome}`,
            })

            onSuccess()
            handleClose()
        } catch (error: any) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setNewPassword("")
        setConfirmPassword("")
        setShowPassword(false)
        setShowConfirmPassword(false)
        setError("")
        onOpenChange(false)
    }

    const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null
    const isValid = newPassword.length >= 8 && newPassword === confirmPassword && passwordStrength?.level >= 2

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Alterar Senha - {vendedor?.nome}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Gerador de Senha */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleGeneratePassword}
                            className="flex-1"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Gerar Senha Segura
                        </Button>
                        {newPassword && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleCopyPassword}
                                title="Copiar senha"
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Nova Senha */}
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Digite a nova senha"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>

                        {/* Indicador de Força */}
                        {passwordStrength && (
                            <div className="flex items-center gap-2 text-sm">
                                {passwordStrength.level >= 2 ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                )}
                                <span className={passwordStrength.color}>
                                    Força: {passwordStrength.text}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Confirmar Senha */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirme a nova senha"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>

                        {/* Validação de Confirmação */}
                        {confirmPassword && (
                            <div className="flex items-center gap-2 text-sm">
                                {newPassword === confirmPassword ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-green-600">Senhas conferem</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                        <span className="text-red-600">Senhas não conferem</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Erro */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Botões */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isValid || loading}
                            className="flex-1"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Alterando...
                                </>
                            ) : (
                                <>
                                    <Key className="h-4 w-4 mr-2" />
                                    Alterar Senha
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}