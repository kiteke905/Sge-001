-- ============================================================================
-- SIGE ANGOLA — MIGRAÇÃO 003: ESTUDANTES, MATRÍCULAS E HISTÓRICO
-- ============================================================================

-- 1. TABELA: estudantes
CREATE TABLE IF NOT EXISTS public.estudantes (
    id VARCHAR(50) PRIMARY KEY, -- ex: "EST-2025-001"
    full_name VARCHAR(255) NOT NULL,
    bi_number VARCHAR(50) NOT NULL UNIQUE,
    birth_date DATE NOT NULL,
    gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
    naturality VARCHAR(100) NOT NULL DEFAULT 'Luanda',
    province VARCHAR(100) NOT NULL DEFAULT 'Luanda',
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    photo_url TEXT,
    
    -- Encarregado de Educação
    guardian_name VARCHAR(255) NOT NULL,
    guardian_phone VARCHAR(50) NOT NULL,
    guardian_kinship VARCHAR(100) NOT NULL,
    guardian_profession VARCHAR(150),
    
    -- Alocação Académica
    ano_letivo_id VARCHAR(50) NOT NULL REFERENCES public.anos_letivos(id) ON DELETE RESTRICT,
    curso_id VARCHAR(50) NOT NULL REFERENCES public.cursos(id) ON DELETE RESTRICT,
    classe_id VARCHAR(50) NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    turma_id VARCHAR(50) NOT NULL REFERENCES public.turmas(id) ON DELETE RESTRICT,
    turma_name VARCHAR(150),
    course_name VARCHAR(255),
    shift VARCHAR(30) NOT NULL CHECK (shift IN ('MANHA', 'TARDE', 'NOITE')),
    student_number SMALLINT NOT NULL DEFAULT 1,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Estado da Matrícula
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE_PAGAMENTO' 
        CHECK (status IN ('PENDENTE_PAGAMENTO', 'MATRICULADO', 'CONFIRMADO', 'TRANSFERIDO', 'DESISTENTE', 'SUSPENSO')),
    
    -- Checklist de Documentação
    documents_submitted JSONB DEFAULT '{"biCopy": false, "passPhoto": false, "previousCertificate": false, "medicalAttestation": false, "militaryDeclaration": false}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para buscas ultrarrápidas
CREATE INDEX IF NOT EXISTS idx_estudantes_bi ON public.estudantes(bi_number);
CREATE INDEX IF NOT EXISTS idx_estudantes_nome ON public.estudantes(full_name);
CREATE INDEX IF NOT EXISTS idx_estudantes_turma ON public.estudantes(turma_id);
CREATE INDEX IF NOT EXISTS idx_estudantes_ano_letivo ON public.estudantes(ano_letivo_id);
CREATE INDEX IF NOT EXISTS idx_estudantes_status ON public.estudantes(status);

-- 2. TABELA: historico_estudantes (Para transferências, mudanças de turma e registos escolares)
CREATE TABLE IF NOT EXISTS public.historico_estudantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estudante_id VARCHAR(50) NOT NULL REFERENCES public.estudantes(id) ON DELETE CASCADE,
    ano_letivo_id VARCHAR(50) NOT NULL REFERENCES public.anos_letivos(id) ON DELETE RESTRICT,
    turma_origem_id VARCHAR(50),
    turma_destino_id VARCHAR(50),
    tipo_evento VARCHAR(100) NOT NULL, -- 'MATRICULA_INICIAL', 'CONFIRMACAO', 'MUDANCA_TURMA', 'TRANSFERENCIA', 'DESISTENCIA'
    descricao TEXT NOT NULL,
    registado_por VARCHAR(100) NOT NULL,
    data_evento TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historico_estudante ON public.historico_estudantes(estudante_id);

-- RLS
ALTER TABLE public.estudantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_estudantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso completo a estudantes para utilizadores autenticados" 
ON public.estudantes FOR ALL USING (true);

CREATE POLICY "Acesso completo a histórico de estudantes para utilizadores autenticados" 
ON public.historico_estudantes FOR ALL USING (true);
