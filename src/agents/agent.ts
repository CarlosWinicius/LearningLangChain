// src/agent/agent.ts (Corrigido)

import { ChatGroq } from '@langchain/groq';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { env } from '../config/env';
import { assistantPrompt } from './prompt'; // Importa o prompt (que o TS acha que é uma Promise)

// 1. Inicializa o Modelo (pode ser global)
const model = new ChatGroq({
  apiKey: env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  temperature: 0.7,
});

// 2. Inicializa o Parser (pode ser global)
const parser = new StringOutputParser();

/**
 * Invoca o agente de IA com uma entrada de texto.
 * @param input A mensagem do usuário
 * @returns A resposta gerada pela IA
 */
export async function invokeAgent(input: string): Promise<string> {
  console.log(`[Agent] Recebido input: "${input}"`);

  try {
    // --- INÍCIO DA CORREÇÃO ---
    // O erro diz que 'assistantPrompt' é uma Promise.
    // Então, usamos 'await' para "abrir" a Promise e pegar o template.
    const prompt = await assistantPrompt;

    // Agora que 'prompt' é um ChatPromptTemplate (e não uma Promise),
    // nós criamos a 'chain' aqui dentro.
    const chain = prompt
      .pipe(model)
      .pipe(parser);
    // --- FIM DA CORREÇÃO ---

    // 3. Executa a "chain" com a entrada do usuário
    const response = await chain.invoke({
      input: input,
    });

    console.log(`[Agent] Resposta gerada: "${response}"`);
    return response;
  } catch (error) {
    console.error('[Agent] Erro ao invocar o agente LangChain:', error);
    return 'Desculpe, estou com um problema para processar sua solicitação no momento.';
  }
}