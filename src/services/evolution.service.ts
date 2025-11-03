// src/services/evolution.service.ts

// Importamos nossas variáveis de ambiente validadas pelo Zod
import { env } from '../config/env';

/**
 * Interface simples para definir o formato do corpo (payload)
 * que a API do Evolution espera para enviar um texto.
 */
interface SendTextPayload {
  number: string;
  options: {
    delay: number;
    presence: 'composing' | 'paused';
  };
  text: string;
}

/**
 * Envia uma mensagem de texto para um número específico usando a Evolution API.
 * @param to O número de destino (ex: "5511999998888")
 * @param message O texto da mensagem a ser enviada
 */
export async function sendTextMessage(to: string, message: string) {
  // Monta a URL completa para o endpoint de envio de mensagem
  const url = `${env.EVOLUTION_API_URL}/message/sendText/${env.EVOLUTION_INSTANCE_NAME}`;

  // Monta o corpo da requisição (payload) no formato que a API espera
  const payload: SendTextPayload = {
    number: to,
    options: {
      delay: 1200, // Um pequeno delay para simular digitação
      presence: 'composing', // Mostra "digitando..." no WhatsApp do usuário
    },
    text: message,
  };

  console.log(`[Service] Enviando mensagem para ${to}: "${message}"`);

  try {
    // Usamos o 'fetch' nativo (disponível no Bun/Node.js)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.EVOLUTION_API_KEY, // Nossa chave de API
      },
      body: JSON.stringify(payload), // Converte o objeto JS para uma string JSON
    });

    // Se a resposta da API não for 'OK' (ex: 401, 500)
    if (!response.ok) {
      // Logamos o erro para depuração
      console.error(
        `[Service] Erro ao enviar mensagem para ${to}. Status: ${response.status}`
      );
      console.error(await response.json()); // Mostra a resposta de erro da API
      return;
    }

    console.log(`[Service] Mensagem enviada com sucesso para ${to}.`);
    
  } catch (error) {
    // Pega erros de rede (ex: API offline, DNS)
    console.error('[Service] Falha de conexão com a Evolution API:', error);
  }
}