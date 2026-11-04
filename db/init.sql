-- Executado automaticamente na PRIMEIRA subida do banco (volume pgdata vazio).
-- Para recriar do zero: docker compose down -v && docker compose up -d

CREATE TYPE perfil_usuario     AS ENUM ('DOADOR', 'OPERADOR');
CREATE TYPE tipo_parceiro      AS ENUM ('LABORATORIO_UFOP', 'POSTO_DESCARTE', 'ASSISTENCIA_TECNICA');
CREATE TYPE categoria_item     AS ENUM ('ROUPAS', 'ELETRONICOS', 'ALIMENTOS');
CREATE TYPE estado_conservacao AS ENUM ('NOVO', 'BOM', 'USADO', 'DEFEITUOSO');
CREATE TYPE status_item        AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO', 'ENCAMINHADO', 'RECEBIDO');

CREATE TABLE usuario (
  id                integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome              varchar(120) NOT NULL,
  email             varchar(254) NOT NULL UNIQUE,
  senha_hash        varchar(255) NOT NULL,
  perfil            perfil_usuario NOT NULL DEFAULT 'DOADOR',
  aceitou_termos_em timestamptz NOT NULL,
  criado_em         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campanha (
  id                 integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome               varchar(120) NOT NULL,
  descricao          text,
  data_inicio        date NOT NULL,
  data_fim           date NOT NULL,
  ativa              boolean NOT NULL DEFAULT true,
  local_coleta       varchar(255) NOT NULL,
  horario_coleta     varchar(150) NOT NULL,
  instrucoes_entrega text,
  criado_em          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_campanha_datas CHECK (data_fim >= data_inicio)
);

CREATE TABLE parceiro (
  id      integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome    varchar(120) NOT NULL,
  tipo    tipo_parceiro NOT NULL,
  contato varchar(150)
);

CREATE TABLE item_doacao (
  id                 integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  campanha_id        integer NOT NULL REFERENCES campanha(id) ON DELETE RESTRICT,
  doador_id          integer NOT NULL REFERENCES usuario(id)  ON DELETE RESTRICT,
  categoria          categoria_item NOT NULL,
  descricao          varchar(300) NOT NULL,
  quantidade         integer NOT NULL,
  estado_conservacao estado_conservacao NOT NULL,
  data_validade      date,
  foto_arquivo       varchar(100),
  status             status_item NOT NULL DEFAULT 'PENDENTE',
  motivo_recusa      varchar(200),
  parceiro_id        integer REFERENCES parceiro(id) ON DELETE RESTRICT,
  avaliado_por       integer REFERENCES usuario(id)  ON DELETE RESTRICT,
  avaliado_em        timestamptz,
  criado_em          timestamptz NOT NULL DEFAULT now(),
  atualizado_em      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_item_quantidade CHECK (quantidade BETWEEN 1 AND 9999),
  CONSTRAINT ck_item_validade   CHECK (categoria <> 'ALIMENTOS' OR data_validade IS NOT NULL),
  CONSTRAINT ck_item_parceiro   CHECK (status <> 'ENCAMINHADO' OR parceiro_id IS NOT NULL)
);

CREATE INDEX ix_item_campanha_status ON item_doacao (campanha_id, status);
CREATE INDEX ix_item_doador          ON item_doacao (doador_id);

-- Dados de exemplo para desenvolvimento (troque os textos entre colchetes)
INSERT INTO parceiro (nome, tipo, contato) VALUES
  ('Laboratório de Hardware (UFOP)', 'LABORATORIO_UFOP', '[contato]'),
  ('[Posto de descarte de eletrônicos]', 'POSTO_DESCARTE', '[contato]');

INSERT INTO campanha (nome, descricao, data_inicio, data_fim, local_coleta, horario_coleta, instrucoes_entrega) VALUES
  ('Campanha do Agasalho', 'Arrecadação de roupas e eletrônicos', '2026-11-03', '2026-12-31',
   '[endereço do ponto de coleta]', 'Seg–Sex, 14h–18h', 'Leve os itens em uma caixa ou sacola fechada.');
