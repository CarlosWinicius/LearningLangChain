// src/index.ts (Versão de TESTE - Sem Validação)

import { Elysia } from 'elysia'; // Só o Elysia
import { env } from './config/env'; 

// Não precisamos do agent ou service para este teste
// import { invokeAgent } from './agents/agent';
// import { sendTextMessage } from './services/evolution.service';

const app = new Elysia();

// --- Rota 1: Health Check ---
app.get('/', () => ({
  status: 'online',
  message: 'Jeov.ai (Agente UPE) está rodando! [MODO DE TESTE]',
}));

// --- Rota 2: O Webhook de TESTE (DUMB) ---
// Sem 't.' nem nada, só para ver o que chega
app.post(
  '/webhook',
  async ({ body, set }) => {
    
    console.log('---------------------------------');
    console.log('--- 🔥 WEBHOOK RECEBIDO! 🔥 ---');
    console.log('---------------------------------');
    
    // Loga o corpo (body) COMPLETO que chega do n8n
    // O JSON.stringify com 'null, 2' formata o JSON para 
    // ficar fácil de ler no terminal
    console.log(JSON.stringify(body, null, 2));

    console.log('---------------------------------');

    // Responde 200 OK imediatamente para o n8n
    set.status = 200;
    return { status: 'recebido_no_teste' };
  }
);

// --- Inicia o Servidor ---
app.listen(env.PORT, () => {
  console.log('-------------------------------------------');
  console.log(`🔥 Servidor em MODO DE TESTE (Sem Validação)!`);
  console.log(`🚪 Escutando na porta: ${env.PORT}`);
  console.log('-------------------------------------------');
});