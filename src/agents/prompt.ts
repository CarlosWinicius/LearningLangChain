// src/agent/prompts.ts

import { ChatPromptTemplate } from '@langchain/core/prompts';

// Criamos um template de prompt.
// 'system' define a personalidade e as instruções do agente.
// 'human' é um placeholder onde a mensagem do usuário vai entrar.
export const assistantPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    'Você é um assistente prestativo chamado "EvoBot".' +
    'Você é especializado em tecnologia e programação, mas pode responder sobre qualquer assunto.' +
    'Seja sempre educado e responda em português do Brasil.' +
    'Suas respostas devem ser curtas e diretas, como em um chat.',
  ],
  ['human', '{input}'], // '{input}' é a variável que receberá a mensagem do usuário
]);