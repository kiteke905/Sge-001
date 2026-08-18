-- ============================================================================
-- SIGE ANGOLA — MIGRAÇÃO 001: ESTRUTURA INSTITUCIONAL E ESTRUTURA ACADÉMICA
-- ============================================================================

-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA: instituicao
CREATE TABLE IF NOT EXISTS public.instituicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    sub_titulo VARCHAR(255),
    logo_url TEXT,
    republic_header VARCHAR(255) DEFAULT 'REPÚBLICA DE ANGOLA',
    ministry_header VARCHAR(255) DEFAULT 'MINISTÉRIO DA EDUCAÇÃO',
    provincial_header VARCHAR(255) DEFAULT 'GOVERNO PROVINCIAL DE LUANDA - GABINETE PROVINCIAL DE EDUCAÇÃO',
    nif VARCHAR(50) NOT NULL,
    decree_number VARCHAR(100),
    endereco TEXT NOT NULL,
    municipio VARCHAR(100) DEFAULT 'Luanda',
    provincia VARCHAR(100) DEFAULT 'Luanda',
    telefone VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    director_geral VARCHAR(255),
    director_pedagogico VARCHAR(255),
    chefe_secretaria VARCHAR(255),
    moeda VARCHAR(50) DEFAULT 'Kwanza (Kz)',
    configuracoes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA: anos_letivos
CREATE TABLE IF NOT EXISTS public.anos_letivos (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE, -- ex: "2025/2026"
    nome VARCHAR(100),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANEADO' CHECK (status IN ('PLANEADO', 'ATIVO', 'ENCERRADO')),
    trimestre_atual SMALLINT NOT NULL DEFAULT 1 CHECK (trimestre_atual IN (1, 2, 3)),
    matricula_data_inicio DATE,
    matricula_data_fim DATE,
    matricula_status VARCHAR(20) DEFAULT 'FECHADO' CHECK (matricula_status IN ('ABERTO', 'FECHADO')),
    confirmacao_data_inicio DATE,
    confirmacao_data_fim DATE,
    confirmacao_status VARCHAR(20) DEFAULT 'FECHADO' CHECK (confirmacao_status IN ('ABERTO', 'FECHADO')),
    mes_inicio VARCHAR(50) DEFAULT 'Setembro',
    meses_propinas JSONB DEFAULT '["Setembro", "Outubro", "Novembro", "Dezembro", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir que apenas um ano letivo esteja ATIVO por instituição
CREATE UNIQUE INDEX IF NOT EXISTS idx_unico_ano_letivo_ativo 
ON public.anos_letivos (status) 
WHERE status = 'ATIVO';

-- 3. TABELA: cursos
CREATE TABLE IF NOT EXISTS public.cursos (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE, -- ex: "CFB", "INF", "CEJ"
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('PUNIV', 'TECNICO', 'ENSINO_GERAL', 'PRIMARIO')),
    duracao_anos SMALLINT NOT NULL DEFAULT 3,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA: classes
CREATE TABLE IF NOT EXISTS public.classes (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL, -- ex: "10ª Classe"
    nivel SMALLINT NOT NULL CHECK (nivel BETWEEN 1 AND 13),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA: disciplinas
CREATE TABLE IF NOT EXISTS public.disciplinas (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE, -- ex: "MAT", "LP", "FIS"
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('NUCLEAR', 'COMPLEMENTAR', 'TECNICA', 'EXTRA')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA: turmas
CREATE TABLE IF NOT EXISTS public.turmas (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(150) NOT NULL, -- ex: "10ª A (CFB)"
    ano_letivo_id VARCHAR(50) NOT NULL REFERENCES public.anos_letivos(id) ON DELETE CASCADE,
    classe_id VARCHAR(50) NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    curso_id VARCHAR(50) NOT NULL REFERENCES public.cursos(id) ON DELETE RESTRICT,
    turno VARCHAR(30) NOT NULL CHECK (turno IN ('MANHA', 'TARDE', 'NOITE')),
    sala VARCHAR(50) NOT NULL,
    capacidade_maxima SMALLINT NOT NULL DEFAULT 45,
    director_turma_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_turmas_ano_letivo ON public.turmas(ano_letivo_id);
CREATE INDEX IF NOT EXISTS idx_turmas_classe ON public.turmas(classe_id);
CREATE INDEX IF NOT EXISTS idx_turmas_curso ON public.turmas(curso_id);
