# Configuração e Teste do Webhook CRM

## 📋 Visão Geral

Este projeto se conecta com um webhook externo para sincronizar dados de vendedores do CRM. O webhook está localizado em:
- **URL Base:** `https://webhook.escalasdigitaischatboot.uk/webhook/`
- **Endpoint:** `get-user-crm-rd`
- **URL Completa:** `https://webhook.escalasdigitaischatboot.uk/webhook/get-user-crm-rd`

## 🔧 Configuração

### 1. Criar arquivo de variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

```bash
CRM_WEBHOOK_URL=https://webhook.escalasdigitaischatboot.uk/webhook/get-user-crm-rd
```

### 2. Reiniciar o servidor

Após criar o arquivo `.env.local`, reinicie o servidor de desenvolvimento:

```bash
npm run dev
# ou
pnpm dev
```

## 🧪 Testando o Webhook

### Opção 1: Usar o componente WebhookTester

1. Adicione o componente `WebhookTester` em alguma página
2. Clique em "Testar Webhook"
3. Analise os resultados dos testes GET e POST

### Opção 2: Testar via API diretamente

#### Teste GET (descobrir endpoints funcionais):
```bash
curl http://localhost:3000/api/sync-crm
```

#### Teste POST (sincronização):
```bash
curl -X POST http://localhost:3000/api/sync-crm
```

### Opção 3: Testar o webhook externo diretamente

```bash
# Teste GET
curl https://webhook.escalasdigitaischatboot.uk/webhook/get-user-crm-rd

# Teste POST
curl -X POST https://webhook.escalasdigitaischatboot.uk/webhook/get-user-crm-rd
```

## 🔍 Diagnóstico de Problemas

### Erro: "The requested webhook 'POST get-user-crm-rd' is not registered"

**Possíveis causas:**
1. **Endpoint incorreto** - O path pode ter mudado
2. **Método HTTP errado** - O servidor pode aceitar apenas GET
3. **Servidor offline** - O webhook pode estar indisponível
4. **Autenticação necessária** - Pode ser necessário incluir tokens

**Soluções:**
1. **Verificar se o servidor está online** acessando a URL no navegador
2. **Testar diferentes métodos HTTP** (GET, POST)
3. **Verificar se há autenticação** necessária
4. **Contatar o fornecedor** do webhook para confirmar a configuração

### Erro: "Access to fetch has been blocked by CORS policy"

**Causa:** Requisição direta do frontend para servidor externo
**Solução:** ✅ **Já resolvido** - Use a API route `/api/sync-crm`

## 📊 Logs e Debug

A API route `/api/sync-crm` inclui logs detalhados no console do servidor:

- Status das respostas
- Headers recebidos
- Dados de resposta
- Erros detalhados

## 🚀 Funcionalidades Implementadas

- ✅ **Resolução de CORS** via API route
- ✅ **Teste automático de múltiplos endpoints**
- ✅ **Logs detalhados** para debug
- ✅ **Tratamento robusto de erros**
- ✅ **Componente de teste visual**
- ✅ **Suporte a GET e POST**

## 📝 Próximos Passos

1. **Configurar o arquivo `.env.local`**
2. **Testar a conectividade** usando o WebhookTester
3. **Verificar logs** no console do servidor
4. **Ajustar configurações** conforme necessário
5. **Integrar com o sistema** de sincronização

## 🆘 Suporte

Se continuar enfrentando problemas:

1. Verifique os logs no console do servidor
2. Teste o webhook externo diretamente
3. Confirme a configuração com o fornecedor
4. Use o componente WebhookTester para diagnóstico detalhado 