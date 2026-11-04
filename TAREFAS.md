# Quadro de tarefas — Sprint 4 (até 04/12/2026)

Divisão sugerida: **Arthur = back-end, banco e Docker** · **Ronald = front-end**.
Contrato combinado: a seção 4.2 do documento da Entrega 03 (rotas, perfis e formato de erro). Quem precisar mudar o contrato avisa o outro **antes**.
Passo a passo ideal: cada um cria os cards no GitHub Projects (colunas: A fazer · Fazendo · Revisão · Pronto) e marca aqui `[x]` ao concluir.

Legenda de prioridade (do Levantamento de Requisitos): **E** Essencial · **I** Importante.

## Semana 0 · 03/11 a 06/11 — Preparação (juntos)
- [ ] **T01** Criar repositório privado no GitHub, convidar a dupla, proteger a `main` — Arthur
- [ ] **T02** Instalar Git, Node 20 e Docker Desktop; clonar e subir o starter (Opção A do README) — ambos
- [ ] **T03** Rodar a Opção B e ver "API respondeu: ok" em localhost:5173 — ambos
- [ ] **T04** Criar o quadro no GitHub Projects com estas tarefas — Ronald
- [ ] **T05** Ler juntos a seção 4.2 da Entrega 03 e a pasta `db/` — ambos
- [ ] **T06** Criar coleção no Postman/Insomnia com as rotas já prontas — Arthur

## Semana 1 · 09/11 a 13/11 — Login e campanhas
Back-end (Arthur)
- [ ] **B01** Revisar register/login do starter e testar casos de erro (e-mail repetido, senha curta, sem termos) — E
- [ ] **B02** Campanhas: `POST /campanhas` e `PATCH /campanhas/:id` (só operador) — E
- [ ] **B03** `DELETE /usuarios/me` (anonimiza nome/e-mail e apaga fotos) — I
Front-end (Ronald)
- [ ] **F01** Layout base, rotas (`react-router-dom`), contexto de login (token em `sessionStorage`) e cores do protótipo — E
- [ ] **F02** Telas de Login e Cadastro (checkbox de termos, mensagens de erro da API) — E
- [ ] **F03** Rotas protegidas por perfil (doador x operador) e botão Sair — E

## Semana 2 · 16/11 a 20/11 — Doador cadastra e acompanha (US01 e US02)
Back-end (Arthur)
- [ ] **B04** `POST /itens` (Zod; só campanha ativa; validade obrigatória para alimentos) — E
- [ ] **B05** `GET /itens` (doador vê só os seus; paginação `page`/`pageSize`) e `GET /itens/:id` com dados de entrega da campanha — E
- [ ] **B06** `POST /itens/:id/foto` e `GET /itens/:id/foto` (multer, 5 MB, JPEG/PNG, nome UUID) — I
- [ ] **B07** `DELETE /itens/:id` (só dono e só PENDENTE) — E
Front-end (Ronald)
- [ ] **F04** Tela "Cadastrar item" (protótipo), com foto opcional e mensagem "Item enviado para pré-triagem" — E
- [ ] **F05** Tela "Minhas doações" com status e instruções de entrega — E
- [ ] **J01** Integração: doador cria conta, cadastra item e vê na lista (testar juntos) — ambos

## Semana 3 · 23/11 a 27/11 — Operador faz a triagem (US03 e US04)
Back-end (Arthur)
- [ ] **B08** `GET /itens` para operador com filtros `campanhaId`, `status`, `categoria`, `estado` — E
- [ ] **B09** `PATCH /itens/:id/status` com as transições e o UPDATE condicional (409) — E
- [ ] **B10** `GET /parceiros` e `POST /parceiros` — E
- [ ] **B11** `GET /relatorios/inventario?formato=csv|json` (CSV UTF-8 com BOM, `;`, sem dados do doador) — I
Front-end (Ronald)
- [ ] **F06** Painel do operador: tabela, filtros e paginação — E
- [ ] **F07** Ações Aprovar / Recusar (motivo) / Encaminhar (parceiro) / Marcar recebido — E
- [ ] **F08** Tela simples de campanhas e parceiros (criar e editar) — I
- [ ] **F09** Botão "Exportar CSV" — I
- [ ] **J02** Integração do fluxo completo doador → operador → doador (testar juntos) — ambos

## Semana 4 · 30/11 a 04/12 — Fechamento e entregas
- [ ] **B12** Testes automatizados das transições de status (Vitest + Supertest) e limpeza de rotas — Arthur
- [ ] **F10** Estados de carregando/erro/vazio, responsividade no celular e acessibilidade básica — Ronald
- [ ] **J03** Teste de usabilidade com 3 a 5 pessoas (fase 1 do Plano de Validação): anotar onde travaram e corrigir o principal — ambos
- [ ] **J04** PoC com um organizador de campanha (fase 2): cronometrar a triagem com e sem o sistema — ambos
- [ ] **J05** Plano de Implantação (como subir com Docker Compose em uma máquina/hospedagem) e deploy final — Arthur
- [ ] **J06** Pitch em vídeo (demo do fluxo + problema + resultado da validação) — Ronald (roteiro: ambos)
- [ ] **J07** README final, `.env.example` revisado e repositório limpo — ambos

## Regras da dupla
- Reunião curta (15 min) 2 a 3 vezes por semana: o que fiz, o que farei, o que me trava.
- Cada tarefa vira um PR revisado pelo outro. Troquem as tarefas de lado no fim de cada semana para que os dois entendam o sistema inteiro (a banca costuma perguntar).
- Se uma tarefa atrasar mais de 2 dias, cortem escopo pela prioridade: primeiro **I** (Importante), nunca **E** (Essencial).
