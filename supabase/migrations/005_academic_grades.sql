-- ============================================================================
-- SIGE ANGOLA — MIGRAÇÃO 005: AVALIAÇÃO PEDAGÓGICA (MINIPAUTAS & NOTAS)
-- FÓRMULA OFICIAL ANGOLA: MT = MAC * 50% + NPT * 50% = (MAC + NPT) / 2
-- ============================================================================

-- 1. TABELA: agendamento_avaliacoes
CREATE TABLE IF NOT EXISTS public.agendamento_avaliacoes (
    id VARCHAR(50) PRIMARY KEY,
    atribuicao_id VARCHAR(50) NOT NULL REFERENCES public.atribuicoes_curriculares(id) ON DELETE CASCADE,
    trimestre SMALLINT NOT NULL CHECK (trimestre IN (1, 2, 3)),
    mac_data DATE NOT NULL,
    npt_data DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_agendamento_trimestre UNIQUE (atribuicao_id, trimestre)
);

-- 2. TABELA: registo_notas (Trimestrais)
CREATE TABLE IF NOT EXISTS public.registo_notas (
    id VARCHAR(50) PRIMARY KEY,
    estudante_id VARCHAR(50) NOT NULL REFERENCES public.estudantes(id) ON DELETE CASCADE,
    atribuicao_id VARCHAR(50) NOT NULL REFERENCES public.atribuicoes_curriculares(id) ON DELETE CASCADE,
    trimestre SMALLINT NOT NULL CHECK (trimestre IN (1, 2, 3)),
    
    -- Notas (Escala de 0 a 20 valores)
    mac NUMERIC(4, 2) NOT NULL CHECK (mac >= 0 AND mac <= 20),
    npt NUMERIC(4, 2) NOT NULL CHECK (npt >= 0 AND npt <= 20),
    mt NUMERIC(4, 2) GENERATED ALWAYS AS (ROUND((mac * 0.5 + npt * 0.5), 2)) STORED,
    
    observacoes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(150) NOT NULL,
    CONSTRAINT uq_nota_aluno_trimestre UNIQUE (estudante_id, atribuicao_id, trimestre)
);

CREATE INDEX IF NOT EXISTS idx_notas_estudante ON public.registo_notas(estudante_id);
CREATE INDEX IF NOT EXISTS idx_notas_atribuicao ON public.registo_notas(atribuicao_id);
CREATE INDEX IF NOT EXISTS idx_notas_trimestre ON public.registo_notas(trimestre);

-- 3. TABELA: registo_notas_exames (Para classes com exame)
CREATE TABLE IF NOT EXISTS public.registo_notas_exames (
    id VARCHAR(50) PRIMARY KEY,
    estudante_id VARCHAR(50) NOT NULL REFERENCES public.estudantes(id) ON DELETE CASCADE,
    atribuicao_id VARCHAR(50) NOT NULL REFERENCES public.atribuicoes_curriculares(id) ON DELETE CASCADE,
    ne NUMERIC(4, 2) CHECK (ne >= 0 AND ne <= 20),    -- Nota de Exame
    ner NUMERIC(4, 2) CHECK (ner >= 0 AND ner <= 20), -- Nota de Exame de Recurso
    observacoes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(150),
    CONSTRAINT uq_exame_aluno UNIQUE (estudante_id, atribuicao_id)
);

-- RLS
ALTER TABLE public.agendamento_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registo_notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registo_notas_exames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso a agendamentos de avaliação" ON public.agendamento_avaliacoes FOR ALL USING (true);
CREATE POLICY "Acesso a registos de notas" ON public.registo_notas FOR ALL USING (true);
CREATE POLICY "Acesso a notas de exames" ON public.registo_notas_exames FOR ALL USING (true);
