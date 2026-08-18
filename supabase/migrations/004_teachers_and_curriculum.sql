-- ============================================================================
-- SIGE ANGOLA — MIGRAÇÃO 004: CORPO DOCENTE, MATRIZ CURRICULAR E HORÁRIOS
-- ============================================================================

-- 1. TABELA: professores
CREATE TABLE IF NOT EXISTS public.professores (
    id VARCHAR(50) PRIMARY KEY, -- ex: "TCH-001"
    name VARCHAR(255) NOT NULL,
    bi_number VARCHAR(50) NOT NULL UNIQUE,
    academic_degree VARCHAR(50) NOT NULL CHECK (academic_degree IN ('BACHAREL', 'LICENCIATURA', 'MESTRADO', 'DOUTORAMENTO')),
    specialty VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'EFETIVO' CHECK (category IN ('EFETIVO', 'COLABORADOR', 'CONTRATADO')),
    status VARCHAR(30) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA: atribuicoes_curriculares (Vincula Turma + Disciplina + Professor)
CREATE TABLE IF NOT EXISTS public.atribuicoes_curriculares (
    id VARCHAR(50) PRIMARY KEY, -- ex: "ASG-10A-MAT"
    ano_letivo_id VARCHAR(50) NOT NULL REFERENCES public.anos_letivos(id) ON DELETE CASCADE,
    turma_id VARCHAR(50) NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    disciplina_id VARCHAR(50) NOT NULL REFERENCES public.disciplinas(id) ON DELETE RESTRICT,
    professor_id VARCHAR(50) NOT NULL REFERENCES public.professores(id) ON DELETE RESTRICT,
    horas_semanais SMALLINT NOT NULL DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_turma_disciplina UNIQUE (ano_letivo_id, turma_id, disciplina_id)
);

CREATE INDEX IF NOT EXISTS idx_atribuicoes_turma ON public.atribuicoes_curriculares(turma_id);
CREATE INDEX IF NOT EXISTS idx_atribuicoes_prof ON public.atribuicoes_curriculares(professor_id);

-- 3. TABELA: horarios_aulas (Timetable)
CREATE TABLE IF NOT EXISTS public.horarios_aulas (
    id VARCHAR(50) PRIMARY KEY,
    turma_id VARCHAR(50) NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    dia_semana VARCHAR(30) NOT NULL CHECK (dia_semana IN ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO')),
    tempo_periodo VARCHAR(50) NOT NULL, -- ex: "07:30 - 08:15"
    disciplina_id VARCHAR(50) NOT NULL REFERENCES public.disciplinas(id) ON DELETE RESTRICT,
    professor_id VARCHAR(50) NOT NULL REFERENCES public.professores(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA: calendario_exames
CREATE TABLE IF NOT EXISTS public.calendario_exames (
    id VARCHAR(50) PRIMARY KEY,
    ano_letivo_id VARCHAR(50) NOT NULL REFERENCES public.anos_letivos(id) ON DELETE CASCADE,
    trimestre SMALLINT NOT NULL CHECK (trimestre IN (1, 2, 3)),
    turma_id VARCHAR(50) NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    disciplina_id VARCHAR(50) NOT NULL REFERENCES public.disciplinas(id) ON DELETE RESTRICT,
    data_exame DATE NOT NULL,
    hora_exame VARCHAR(30) NOT NULL,
    sala VARCHAR(50) NOT NULL,
    professor_vigilante_id VARCHAR(50) REFERENCES public.professores(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atribuicoes_curriculares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios_aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendario_exames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso a professores" ON public.professores FOR ALL USING (true);
CREATE POLICY "Acesso a atribuições curriculares" ON public.atribuicoes_curriculares FOR ALL USING (true);
CREATE POLICY "Acesso a horários" ON public.horarios_aulas FOR ALL USING (true);
CREATE POLICY "Acesso a exames" ON public.calendario_exames FOR ALL USING (true);
