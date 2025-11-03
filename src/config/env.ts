import { z } from 'zod'; // Importa o Zod

// 1. Definimos o "schema" - a forma que nossas variáveis de ambiente DEVEM ter.
const envSchema = z.object({
  // PORT: esperamos que seja um número.
  // z.coerce.number() força a conversão (ex: a string "3000" vira o número 3000).
  // .default(3000) usa 3000 se nenhuma porta for definida.
  PORT: z.coerce.number().default(3000),

  // EVOLUTION_API_URL: esperamos que seja uma string e que seja uma URL válida.
  EVOLUTION_API_URL: z.string().url(),

  // EVOLUTION_API_KEY: esperamos que seja uma string com pelo menos 1 caractere.
  EVOLUTION_API_KEY: z.string().min(1),
  EVOLUTION_INSTANCE_NAME: z.string().min(1),

  // GROQ_API_KEY: esperamos que seja uma string que comece com "gsk_".
  // Isso nos ajuda a pegar erros de digitação na chave.
  GROQ_API_KEY: z.string().startsWith('gsk_'),
});

// 2. Validamos o process.env contra o schema que definimos.
// .parse() vai TENTAR validar.
// Se funcionar: ele retorna um objeto 'env' limpo e tipado.
// Se falhar (ex: faltar uma chave): ele vai "quebrar" o programa AGORA
// e nos dizer exatamente qual variável está errada.
export const env = envSchema.parse(process.env);

// 3. O 'export' acima faz com que 'env' esteja disponível para outros arquivos.
// Agora, em outros arquivos, podemos usar 'env.GROQ_API_KEY' com segurança
// e o TypeScript saberá que é uma string.