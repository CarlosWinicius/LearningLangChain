// src/agent/agent.ts

import { ChatGroq } from '@langchain/groq'; // O conector para a API do Groq
import { StringOutputParser } from '@langchain/core/output_parsers'; // Ferramenta para limpar a saída
import { env } from '../config/env'; // Nossas variáveis de ambiente (com a GROQ_API_KEY)
import { assistantPrompt } from './prompt'; // O prompt de personalidade que acabamos de criar

// 1. Inicializa o Modelo de IA (Groq)
// Aqui definimos qual modelo usar e passamos nossa chave de API.
const model = new ChatGroq({
  apiKey: env.GROQ_API_KEY,
  model:"llama-3.1-8b-instant" , // Um modelo super-rápido do Groq
  temperature: 0.7, // Um pouco de criatividade, mas não muito
});

// 2. Cria a "Chain" (A Linha de Montagem)
// Esta é a sequência de passos que o LangChain vai executar.
const chain = assistantPrompt // Elo 1: Pega o prompt de personalidade
  .pipe(model) // Elo 2: Envia o prompt formatado para o Groq
  .pipe(new StringOutputParser()); // Elo 3: Limpa a saída para garantir que é uma string simples

/**
 * Invoca o agente de IA com uma entrada de texto.
 * @param input A mensagem do usuário
 * @returns A resposta gerada pela IA
 */
export async function invokeAgent(input: string): Promise<string> {
  console.log(`[Agent] Recebido input: "${input}"`);

  try {
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