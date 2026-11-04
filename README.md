# Triagem Solidária

Plataforma web de pré-triagem de doações (UFOP · CS1991 Projeto Integrador II).
O doador cadastra os itens antes de entregá-los; o operador da campanha aprova, recusa ou encaminha online.

**Stack:** React + TypeScript (Vite) · Node.js + Express + TypeScript · PostgreSQL · Docker Compose (2 containers: `app` e `db`).

## Estrutura

```
backend/    API REST (Express). src/routes/ = uma rota por arquivo
frontend/   SPA React (Vite). Em produção é servida pelo próprio back-end
db/init.sql Schema (4 tabelas) + dados de exemplo. Roda na 1ª subida do banco
Dockerfile  Compila front e back e gera a imagem única "app"
docker-compose.yml           app + db (produção)
docker-compose.override.yml  só em desenvolvimento: abre a porta do banco em 127.0.0.1
TAREFAS.md  Quadro de tarefas da dupla
```

## Pré-requisitos

Git, Node.js 20 LTS e Docker Desktop (com `docker compose`). Editor sugerido: VS Code.

## Como rodar

### Opção A — tudo no Docker (igual ao que será entregue)

```bash
cp .env.example .env          # edite as senhas e o JWT_SECRET
docker compose up --build
docker compose exec app node dist/seed.js   # cria o operador inicial (1 vez)
```
Abra http://localhost:3000 (a tela mostra "API respondeu: ok" quando front e back estão conversando).

### Opção B — desenvolvimento (recarrega sozinho ao salvar)

```bash
cp .env.example .env
docker compose up -d db                     # só o banco
cd backend  && npm install && npm run dev   # API em http://localhost:3000
npm run seed                                # (em outro terminal, dentro de backend/) cria o operador
cd frontend && npm install && npm run dev   # site em http://localhost:5173
```
O Vite repassa `/api` para a porta 3000, então o front chama a API sem configurar nada.

### Recriar o banco do zero
`init.sql` só roda quando o volume está vazio: `docker compose down -v && docker compose up -d db`.

## O que já está pronto no starter

- `GET /api/v1/health`
- `POST /api/v1/auth/register` e `POST /api/v1/auth/login` (bcrypt, JWT de 8 h, limite de tentativas, validação com Zod)
- `GET /api/v1/campanhas` (modelo de rota protegida; use como exemplo para as demais)
- Middlewares `autenticar` e `exigirPerfil('OPERADOR')`, tratamento de erros no formato `{ erro: { codigo, mensagem } }`
- Cliente da API no front (`src/api.ts`) e proxy do Vite

## Regras de negócio que o código precisa respeitar

- Ciclo do item: `PENDENTE → APROVADO | RECUSADO | ENCAMINHADO → RECEBIDO`. Outra transição responde **409**.
- Use `UPDATE ... WHERE id = $1 AND status = 'PENDENTE'`; se nenhuma linha mudar, responda 409 (evita dois operadores decidirem o mesmo item).
- Alimentos exigem `data_validade`; `ENCAMINHADO` exige `parceiro_id` (o banco também barra).
- Itens só entram em campanha ativa e dentro do período.
- Doador só acessa os próprios itens: item de outro doador responde **404** (não 403).
- Rotas de operador usam `autenticar` + `exigirPerfil('OPERADOR')`.
- O CSV do relatório **não leva dados do doador**.
- Foto: JPEG/PNG até 5 MB, nome gerado (UUID), entregue só por rota autenticada.
- SQL sempre com parâmetros (`$1`, `$2`...). Nunca concatene entrada do usuário.
- Segredos só no `.env` (que não vai para o Git).

## Fluxo de trabalho no Git

- Branch `main` protegida: nada vai direto nela.
- Uma branch por tarefa: `feat/b04-itens-post`, `feat/f02-login`, `fix/...`.
- Commits curtos e no imperativo: `feat: cadastra item de doação`.
- Todo Pull Request é revisado **pela outra pessoa** antes do merge (revisão = rodar e entender o código).
- Mantenha a branch pequena (1 a 2 dias). Faça `git pull origin main` antes de abrir o PR.
- IA generativa é bem-vinda (está no Escopo), mas só entra código que vocês dois entendem e testaram.

## Problemas comuns

- `Variável de ambiente ausente`: faltou copiar o `.env.example` para `.env`.
- `ECONNREFUSED 5432`: o banco não está de pé (`docker compose up -d db`).
- Porta 5432 ou 3000 ocupada: feche o programa que a usa ou troque a porta no `.env`/compose.
- Mudou o `init.sql` e nada mudou: recrie o banco (veja acima).
