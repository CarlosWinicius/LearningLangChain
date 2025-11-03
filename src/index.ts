// src/index.ts (Versão Refatorada, Limpa e Segura)

import { Elysia, t } from 'elysia'; // O framework web
import { env } from './config/env'; // Nossas variáveis de ambiente validadas

// --- CORREÇÃO 1: O caminho da pasta é 'agent' (singular) ---
import { invokeAgent } from './agents/agent';
import { sendTextMessage } from './services/evolution.service';

// Inicializa a aplicação Elysia
const app = new Elysia();

// --- Rota 1: Health Check ---
// Rota simples para verificar no navegador se o servidor está no ar
app.get('/', () => ({
  status: 'online',
  message: 'Jeov.ai (Agente UPE) está rodando!',
}));

// --- Rota 2: O Webhook Principal ---
// É aqui que a Evolution API vai enviar os dados (via POST)
app.post(
  '/webhook',
  async ({ body }) => {
    // Log para depuração (descomente se precisar ver o payload completo)
    // console.log('[Webhook] Evento recebido:', JSON.stringify(body, null, 2));

    // Filtramos apenas por eventos de "nova mensagem recebida"
    // E ignoramos mensagens que nós mesmos enviamos (key.fromMe === true)
    if (body.event === 'messages.upsert' && body.data.key && !body.data.key.fromMe) {
      
      // --- CORREÇÃO 2: Usamos os caminhos padrão do payload ---
      const messageData = body.data;
      const senderJid = messageData.key.remoteJid; // Caminho correto

      // --- CORREÇÃO 3: Filtro para ignorar mensagens de grupo ---
      if (senderJid.endsWith('@g.us')) {
        console.log(`[Webhook] Mensagem de grupo ignorada (de ${senderJid}). O bot só responde no privado.`);
        // Responde 200 OK para a API, mas não faz nada.
        return { received: true };
      }

      // Extrai o texto da mensagem (caminho correto)
      const userMessage =
        messageData.message?.conversation ||
        messageData.message?.extendedTextMessage?.text;

      // Agora que sabemos que é um chat privado, limpamos o JID
      const sender = senderJid.split('@')[0];

      // Se conseguimos extrair um remetente E um texto de mensagem...
      if (sender && userMessage) {
        console.log(`[Webhook] Mensagem recebida de ${sender}: "${userMessage}"`);

        // 1. CHAMA O CÉREBRO (Jeov.ai)
        const agentResponse = await invokeAgent(userMessage);

        // 2. CHAMA O CARTEIRO
        await sendTextMessage(sender, agentResponse);
      
      } else {
        console.log(`[Webhook] Evento de ${sender} ignorado (sem texto de mensagem).`);
      }
    }

    // Responde 200 OK para a Evolution API saber que recebemos o evento
    return { received: true };
  },
  {
    // --- CORREÇÃO 4: Schema de validação detalhado (para autocomplete) ---
    body: t.Object({
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
    }),
  }
);

// --- Inicia o Servidor ---
app.listen(env.PORT, () => {
  console.log('-------------------------------------------');
  console.log(`🔥 Servidor do Agente Jeov.ai rodando!`);
  console.log(`🚪 Escutando na porta: ${env.PORT}`);
  console.log('-------------------------------------------');
});
