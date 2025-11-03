// src/test-service.ts
import { sendTextMessage } from './services/evolution.service';

// --- ATENÇÃO ---
// Coloque aqui um número de WhatsApp VÁLIDO (com seu DDD e código do país)
// que você possa verificar se a mensagem chegou.
// Exemplo: "5511999998888" (para um número de São Paulo, Brasil)
const SEU_NUMERO_DE_TESTE = "5587911111111"; 
// ----------------

const MENSAGEM_DE_TESTE = "Olá! Este é um teste do evolution.service.ts. Se você recebeu isso, funcionou!";

async function runTest() {


  console.log(`[TESTE] Inciando o teste do serviço...`);
  console.log(`[TESTE] Tentando enviar para: ${SEU_NUMERO_DE_TESTE}`);
  
  await sendTextMessage(SEU_NUMERO_DE_TESTE, MENSAGEM_DE_TESTE);

  console.log(`[TESTE] Teste concluído.`);
}

// Executa a função de teste
runTest();