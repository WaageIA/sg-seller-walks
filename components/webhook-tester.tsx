"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"

export function WebhookTester() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<{
    get?: { success: boolean; message: string; status?: number; data?: any }
    post?: { success: boolean; message: string; status?: number; data?: any }
  }>({})
  const [webhookUrl, setWebhookUrl] = useState("")

  const testWebhook = async () => {
    setTesting(true)
    setResults({})

    try {
      // Testa GET primeiro
      const getResponse = await fetch("/api/sync-crm", {
        method: "GET",
      })
      
      const getData = await getResponse.json()
      setResults(prev => ({
        ...prev,
        get: {
          success: getResponse.ok,
          message: getData.message || getData.error || "Resposta inesperada",
          status: getResponse.status
        }
      }))

      // Aguarda um pouco antes de testar POST
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Testa POST
      const postResponse = await fetch("/api/sync-crm", {
        method: "POST",
      })
      
      const postData = await postResponse.json()
      setResults(prev => ({
        ...prev,
        post: {
          success: postResponse.ok,
          message: postData.message || postData.error || "Resposta inesperada",
          status: postResponse.status
        }
      }))

    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        post: {
          success: false,
          message: error.message || "Erro na requisição",
          status: 0
        }
      }))
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    if (success) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = (success: boolean, status?: number) => {
    if (success) return <Badge variant="default" className="bg-green-600">Sucesso</Badge>
    if (status === 404) return <Badge variant="destructive">Não Encontrado</Badge>
    if (status === 403) return <Badge variant="destructive">Proibido</Badge>
    if (status === 500) return <Badge variant="destructive">Erro do Servidor</Badge>
    return <Badge variant="secondary">Erro {status}</Badge>
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Testador de Webhook
        </CardTitle>
        <CardDescription>
          Teste a conectividade com o webhook do CRM para diagnosticar problemas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">URL do Webhook:</label>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://webhook.escalasdigitaischatboot.uk/webhook/get-user-crm-rd"
            className="w-full p-2 border rounded-md text-sm"
            disabled={testing}
          />
        </div>

        <Button 
          onClick={testWebhook} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Testando...
            </>
          ) : (
            "Testar Webhook"
          )}
        </Button>

                {/* Resultados dos testes */}
        {Object.keys(results).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Resultados dos Testes:</h4>
            
            {results.get && (
              <Alert variant={results.get.success ? "default" : "destructive"}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(results.get.success)}
                    <AlertDescription>
                      <strong>GET:</strong> {results.get.message}
                    </AlertDescription>
                  </div>
                  {getStatusBadge(results.get.success, results.get.status)}
                </div>
                {results.get.data && (
                  <div className="mt-2 text-xs bg-black/10 p-2 rounded">
                    <strong>Dados:</strong> {JSON.stringify(results.get.data, null, 2)}
                  </div>
                )}
              </Alert>
            )}

            {results.post && (
              <Alert variant={results.post.success ? "default" : "destructive"}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(results.post.success)}
                    <AlertDescription>
                      <strong>POST:</strong> {results.post.message}
                    </AlertDescription>
                  </div>
                  {getStatusBadge(results.post.success, results.post.status)}
                </div>
                {results.post.data && (
                  <div className="mt-2 text-xs bg-black/10 p-2 rounded">
                    <strong>Dados:</strong> {JSON.stringify(results.post.data, null, 2)}
                  </div>
                )}
              </Alert>
            )}
          </div>
        )}

        {/* Dicas de solução */}
        {results.post?.status === 404 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Endpoint não encontrado:</strong> Verifique se a URL do webhook está correta e se o servidor está online.
            </AlertDescription>
          </Alert>
        )}

        {results.post?.status === 403 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Acesso negado:</strong> O servidor pode estar bloqueando requisições ou exigindo autenticação.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 