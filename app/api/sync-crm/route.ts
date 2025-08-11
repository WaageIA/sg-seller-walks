import { NextRequest, NextResponse } from 'next/server';

/**
 * Manipulador de POST para acionar a sincronização com o CRM.
 * Aciona um webhook de forma segura a partir de uma variável de ambiente.
 */
export async function POST(request: NextRequest) {
  // Busca a URL do webhook das variáveis de ambiente.
  const webhookUrl = process.env.CRM_WEBHOOK_URL;

  // Verifica se a variável de ambiente está configurada.
  if (!webhookUrl) {
    console.error('A variável de ambiente CRM_WEBHOOK_URL não está definida.');
    return NextResponse.json(
      {
        success: false,
        message: 'A configuração do servidor está incompleta. A URL do webhook não foi encontrada.',
      },
      { status: 500 }
    );
  }

  try {
    // Aciona o webhook com uma requisição POST.
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SG-Seller-Walks-Sync/1.0',
      },
      // Um corpo vazio é enviado, mas pode ser preenchido se o n8n esperar dados.
      body: JSON.stringify({}), 
    });

    // Verifica se a requisição ao webhook foi bem-sucedida.
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Erro ao acionar o webhook: ${response.status} ${response.statusText}`, errorData);
      
      return NextResponse.json(
        {
          success: false,
          message: 'Falha ao acionar o webhook de sincronização do CRM.',
          error: {
            status: response.status,
            statusText: response.statusText,
            body: errorData,
          },
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Retorna uma resposta de sucesso.
    return NextResponse.json({
      success: true,
      message: 'Webhook de sincronização do CRM acionado com sucesso!',
      data,
    });

  } catch (error: any) {
    console.error('Erro inesperado ao tentar acionar o webhook do CRM:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Ocorreu um erro interno ao tentar acionar o webhook.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
