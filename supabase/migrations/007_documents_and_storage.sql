-- ============================================================================
-- SIGE ANGOLA — MIGRAÇÃO 007: REQUERIMENTOS, DOCUMENTOS OFICIAIS E STORAGE
-- ============================================================================

-- 1. TABELA: requerimentos_documentos
CREATE TABLE IF NOT EXISTS public.requerimentos_documentos (
    id VARCHAR(50) PRIMARY KEY, -- ex: "REQ-2025-0010"
    request_number VARCHAR(100) NOT NULL UNIQUE, -- ex: "REQ-2025-0010"
    protocol_number VARCHAR(100),
    student_id VARCHAR(50) NOT NULL REFERENCES public.estudantes(id) ON DELETE RESTRICT,
    student_name VARCHAR(255) NOT NULL,
    student_bi VARCHAR(50),
    turma_name VARCHAR(150),
    course_name VARCHAR(255),
    document_type VARCHAR(50) NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    delivery_estimate_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_PROCESSAMENTO', 'PRONTO', 'ENTREGUE')),
    issued_at TIMESTAMPTZ,
    issued_by VARCHAR(150),
    fee_paid BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requerimentos_estudante ON public.requerimentos_documentos(student_id);
CREATE INDEX IF NOT EXISTS idx_requerimentos_status ON public.requerimentos_documentos(status);

-- 2. CONFIGURAÇÃO DE BUCKETS DO SUPABASE STORAGE
-- Criar buckets para Fotos dos Alunos, Documentos Anexos e Logotipo da Instituição
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('aluno-fotos', 'aluno-fotos', true),
    ('utilizador-documentos', 'utilizador-documentos', true),
    ('instituicao-assets', 'instituicao-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.requerimentos_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso a requerimentos de documentos" ON public.requerimentos_documentos FOR ALL USING (true);
