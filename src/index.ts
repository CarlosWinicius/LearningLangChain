// src/index.ts (Versão Refatorada, Limpa e Segura)

import { Elysia, t } from 'elysia'; // O framework web
import { env } from './config/env'; // Nossas variáveis de ambiente validadas
import { invokeAgent } from './agents/agent';
import { sendTextMessage } from './services/evolution.service';

// Inicializa a aplicação Elysia
const app = new Elysia();

// --- Rota 1: Health Check ---
app.get('/', () => ({
  status: 'online',
  message: 'Jeov.ai (Agente UPE) está rodando!',
}));

// --- Schema de Validação (O que esperamos da Evolution API) ---
// Esta é a "forma" do payload *real* que está dentro do 'body' aninhado
const evolutionEventSchema = t.Object({
  event: t.String(),
  instance: t.String(),
  data: t.Object({
    key: t.Object({
      remoteJid: t.String(),
      fromMe: t.Boolean(),
      id: t.String(),
    }),
    message: t.Optional(t.Nullable(t.Object({
      conversation: t.Optional(t.String()),
      extendedTextMessage: t.Optional(t.Object({
        text: t.Optional(t.String())
      }))
    })))
  })
}, {
  // --- CORREÇÃO 1: Permite chaves extras (como 'apikey', 'destination') ---
  additionalProperties: true
});

// --- Rota 2: O Webhook Principal ---
app.post(
  '/webhook',
  async ({ body }) => {
    // Log para depuração (descomente se precisar ver o payload completo)
    // console.log('[Webhook] Payload completo recebido:', JSON.stringify(body, null, 2));

    // --- CORREÇÃO: Extrai o payload real de dentro da estrutura do n8n ---
    // O payload real vem em: body[0].body
    const evolutionPayload = body[0]?.body;

    // Se o payload não existir ou não tiver o formato esperado, ignora.
    if (!evolutionPayload) {
      console.log('[Webhook] Payload recebido, mas em formato inesperado.');
      return { received: true };
    }

    // Agora, usamos 'evolutionPayload' em vez de 'body' para toda a lógica
    if (evolutionPayload.event === 'messages.upsert' && evolutionPayload.data.key && !evolutionPayload.data.key.fromMe) {
      
      const messageData = evolutionPayload.data;
      const senderJid = messageData.key.remoteJid; // Caminho correto

      // Filtro para ignorar mensagens de grupo
      if (senderJid.endsWith('@g.us')) {
        console.log(`[Webhook] Mensagem de grupo ignorada (de ${senderJid}).`);
        return { received: true };
      }

      // Extrai o texto da mensagem (caminho correto)
      const userMessage =
        messageData.message?.conversation ||
        messageData.message?.extendedTextMessage?.text;

      const sender = senderJid.split('@')[0];

      if (sender && userMessage) {
        console.log(`[Webhook] Mensagem recebida de ${sender}: "${userMessage}"`);

        const agentResponse = await invokeAgent(userMessage);
        await sendTextMessage(sender, agentResponse);
      
      } else {
        console.log(`[Webhook] Evento de ${sender} ignorado (sem texto de mensagem).`);
      }
    }

    return { received: true };
  },
  {
    // --- CORREÇÃO: O body da requisição é um Array de objetos ---
    body: t.Array(
      t.Object({
        body: evolutionEventSchema // O payload real está aninhado aqui
        // Podemos ignorar as outras chaves como 'headers', 'params', etc.
      }, {
        // --- CORREÇÃO 2: Permite chaves extras (como 'headers', 'params') ---
        additionalProperties: true
      })
    )
  }
);

// --- Inicia o Servidor ---
app.listen(env.PORT, () => {
  console.log('-------------------------------------------');
  console.log(`🔥 Servidor do Agente Jeov.ai rodando!`);
  console.log(`🚪 Escutando na porta: ${env.PORT}`);
  console.log('-------------------------------------------');
});

