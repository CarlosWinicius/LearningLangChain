// src/index.ts

import { Elysia, t } from 'elysia'; // O framework web
import { env } from './config/env'; // Nossas variáveis de ambiente
import { invokeAgent } from './agents/agent'; // Nosso agente LangChain
import { sendTextMessage } from './services/evolution.service'; // Nosso serviço de envio

// --- Schema de Validação (A "Forma" do JSON da Evolution API) ---
// Define o que esperamos receber no 'body' da requisição
const evolutionWebhookSchema = t.Object(
  {
    event: t.String(), // Ex: 'messages.upsert'
    instance: t.String(),
    data: t.Object({
      key: t.Object({
        remoteJid: t.String(),
        fromMe: t.Boolean(),
        id: t.String(),
      }),
      // 'message' pode não existir em eventos como 'connection.update'
      message: t.Optional(
        t.Nullable(
          t.Object({
            conversation: t.Optional(t.String()), // Mensagem de texto normal
            extendedTextMessage: t.Optional(
              t.Object({
                text: t.Optional(t.String()), // Mensagem de texto (ex: resposta)
              }),
            ),
          }),
        ),
      ),
    }),
  },
  {
    // ESSENCIAL: Permite que a Evolution API envie outras chaves
    // que não listamos aqui (como 'pushName', 'owner', etc.)
    additionalProperties: true,
  },
);

// --- Inicializa a aplicação Elysia ---
const app = new Elysia();

// --- Rota 1: Health Check ---
app.get('/', () => ({
  status: 'online',
  message: 'Jeov.ai (Agente UPE) está rodando!',
}));

// --- Rota 2: O Webhook Principal ---
// Esta rota vai receber TODOS os eventos da Evolution API
app.post(
  '/webhook',
  async ({ body }) => {
    // Graças à validação, 'body' já tem o formato do 'evolutionWebhookSchema'
    
    // Log para depuração (opcional, pode remover em produção)
    // console.log(`[Webhook] Evento recebido: ${body.event}`);

    // --- Filtro Principal: Processar apenas novas mensagens que NÃO são nossas ---
    if (
      body.event === 'messages.upsert' && // É uma mensagem nova
      body.data.key &&
      !body.data.key.fromMe // E a mensagem NÃO foi enviada por nós
    ) {
      const messageData = body.data;
      const senderJid = messageData.key.remoteJid; // Ex: '5581999998888@s.whatsapp.net'

      // --- Filtro 2: Ignorar mensagens de grupo ---
      if (senderJid.endsWith('@g.us')) {
        console.log(`[Webhook] Mensagem de grupo ignorada (de ${senderJid}).`);
        return { received: true };
      }

      // --- Extrai o texto da mensagem ---
      // Tenta pegar de 'conversation' OU de 'extendedTextMessage.text'
      const userMessage =
        messageData.message?.conversation ||
        messageData.message?.extendedTextMessage?.text;

      // Pega só o número, sem o '@s.whatsapp.net'
      const senderNumber = senderJid.split('@')[0];

      // --- Processa se tivermos um remetente e um texto ---
      if (senderNumber && userMessage) {
        console.log(
          `[Webhook] Mensagem recebida de ${senderNumber}: "${userMessage}"`,
        );

        // 1. Invoca o Agente de IA com a mensagem do usuário
        const agentResponse = await invokeAgent(userMessage);

        // 2. Envia a resposta da IA de volta para o usuário
        console.log(
          `[Webhook] Enviando resposta para ${senderNumber}: "${agentResponse}"`,
        );
        await sendTextMessage(senderNumber, agentResponse);

      } else {
        // Ignora eventos que não têm texto (ex: foto, áudio, localização)
        console.log(
          `[Webhook] Evento de ${senderNumber} ignorado (sem texto de mensagem).`,
        );
      }
    }

    // --- Resposta 200 OK ---
    // Sempre responda 200 OK para a Evolution API saber que você recebeu.
    return { received: true };
  },
  {
    // APLICA A VALIDAÇÃO:
    // O 'body' da requisição DEVE ter o formato do nosso schema
    body: evolutionWebhookSchema,
  },
);

// --- Inicia o Servidor ---
app.listen(env.PORT, () => {
  console.log('-------------------------------------------');
  console.log(`🔥 Servidor do Agente Jeov.ai rodando!`);
  console.log(`🚪 Escutando na porta: ${env.PORT}`);
  console.log('-------------------------------------------');
});