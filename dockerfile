### 1. Stage de Instalação (deps) ###
# Usamos a imagem oficial do Bun como base
FROM oven/bun:latest as deps

# Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia os arquivos de manifesto de dependência
COPY package.json bun.lock ./

# Instala SOMENTE as dependências de produção
# Isso cria uma "camada" no Docker que só é refeita se o package.json mudar
RUN bun install --production


### 2. Stage de Execução (runner) ###
# Começamos de uma imagem limpa do Bun
FROM oven/bun:latest as runner

WORKDIR /usr/src/app

# Copia as dependências que instalamos no stage anterior
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copia o código-fonte da nossa aplicação
COPY src ./src
COPY tsconfig.json .

# Expõe a porta que nossa aplicação usa (no seu caso, 3001)
# Mude este valor se você usa uma porta diferente no .env
EXPOSE 3001

# Comando final para iniciar a aplicação
# Bun consegue rodar o TypeScript diretamente
CMD ["bun", "src/index.ts"]