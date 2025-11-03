// src/index.ts

import { Elysia, t } from 'elysia'; // O framework web
import { env } from './config/env'; // Nossas variáveis de ambiente validadas
import { invokeAgent } from './agents/agent'; // O "Cérebro" (LangChain + Groq)
import { sendTextMessage } from './services/evolution.service'; // O "Carteiro" (Evolution API)

// Inicializa a aplicação Elysia
const app = new Elysia();

// --- Rota 1: Health Check ---
// Uma rota simples para você verificar no navegador se o servidor está no ar
app.get('/', () => ({
  status: 'online',
  message: 'Evo-LangChain Agent está rodando!',
}));

// --- Rota 2: O Webhook Principal ---
// É aqui que a Evolution API vai enviar os dados (via POST)
app.post(
  '/webhook',
  async ({ body }) => {
    // Logamos o evento (bom para depuração)
    // console.log('[Webhook] Evento recebido:', JSON.stringify(body, null, 2));

    // --- Início da Lógica do Webhook ---

    // Filtramos apenas por eventos de "nova mensagem recebida"
    // E ignoramos mensagens que nós mesmos enviamos (key.fromMe === true)
    if (body.event === 'messages.upsert' && body.data.key && !body.data.key.fromMe) {
      
      const messageData = body.data;
      const senderJid = messageData.key.remoteJid; // Ex: "5587992075741@s.whatsapp.net"

      // Extrai o texto da mensagem.
      // Pode estar em 'conversation' (texto simples)
      // ou 'extendedTextMessage.text' (texto em uma resposta, etc.)
      const userMessage =
        messageData.message?.conversation ||
        messageData.message?.extendedTextMessage?.text;

      // ATENÇÃO: Correção do número de telefone
      // O 'senderJid' vem com "@s.whatsapp.net", mas nosso 'sendTextMessage'
      // funciona com o número limpo (ex: "5587992075741").
      // Vamos limpar o número antes de usar.
      // Isso assume que estamos tratando apenas com chats privados.
      const sender = senderJid.split('@')[0];

      // Se conseguimos extrair um remetente E um texto de mensagem...
      if (sender && userMessage) {
        console.log(`[Webhook] Mensagem recebida de ${sender}: "${userMessage}"`);

        // 1. CHAMA O CÉREBRO
        const agentResponse = await invokeAgent(userMessage);

        // 2. CHAMA O CARTEIRO
        await sendTextMessage(sender, agentResponse);
      
      } else {
        console.log(`[Webhook] Evento 'messages.upsert' de ${sender} ignorado (sem texto).`);
      }
    }

    // --- Fim da Lógica do Webhook ---

    // Responde 200 OK para a Evolution API saber que recebemos o evento
    return { received: true };
  },
  {
    // Validação básica do corpo (payload) que esperamos da Evolution API
    // Isso usa o 't' (mini-Zod do Elysia) para proteger nossa rota.
    body: t.Object({
      event: t.String(),
      instance: t.String(),
      data: t.Any(), // Por enquanto, não precisamos validar a estrutura interna de 'data'
    }),
  }
);

// --- Inicia o Servidor ---
app.listen(env.PORT, () => {
  console.log('-------------------------------------------');
  console.log(`🔥 Servidor do Agente rodando!`);
  console.log(`🚪 Escutando na porta: ${env.PORT}`);
  console.log('-------------------------------------------');
  console.log(
    `👉 Configure o "Webhook Global" da sua Evolution API para: http://SEU_IP_LOCAL:${env.PORT}/webhook`
  );
  console.log('-------------------------------------------');
});