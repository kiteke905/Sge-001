-- ============================================================================
-- SIGE ANGOLA — PACOTE COMPLETO DE MIGRAÇÕES POSTGRESQL PARA O SUPABASE (Sge-001)
-- Ordem Cronológica e Dependências Validadas (001 a 009)
-- ============================================================================

-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 001: ESTRUTURA INSTITUCIONAL E ACADÉMICA
-- ============================================================================

-- 1. TABELA: instituicoes
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
    code VARCHAR(50) NOT NULL UNIQUE,
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_unico_ano_letivo_ativo 
ON public.anos_letivos (status) 
WHERE status = 'ATIVO';

-- 3. TABELA: cursos
CREATE TABLE IF NOT EXISTS public.cursos (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('PUNIV', 'TECNICO', 'ENSINO_GERAL', 'PRIMARIO')),
    duracao_anos SMALLINT NOT NULL DEFAULT 3,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA: classes
CREATE TABLE IF NOT EXISTS public.classes (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    nivel SMALLINT NOT NULL CHECK (nivel BETWEEN 0 AND 13),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA: disciplinas
CREATE TABLE IF NOT EXISTS public.disciplinas (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('NUCLEAR', 'COMPLEMENTAR', 'TECNICA', 'EXTRA')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA: turmas
CREATE TABLE IF NOT EXISTS public.turmas (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_turmas_ano_letivo ON public.turmas(ano_letivo_id);
CREATE INDEX IF NOT EXISTS idx_turmas_classe ON public.turmas(classe_id);
CREATE INDEX IF NOT EXISTS idx_turmas_curso ON public.turmas(curso_id);

-- ============================================================================
-- 002: PERFIS DE UTILIZADORES E SEGURANÇA RBAC (RLS)
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM (
            'ADMIN',
            'GESTOR',
            'DIRECAO_PEDAGOGICA',
            'FINANCAS',
            'SECRETARIA',
            'PROFESSOR'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.perfis_utilizadores (
    id VARCHAR(50) PRIMARY KEY,
    auth_user_id UUID UNIQUE,
    nome VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    role user_role_enum NOT NULL DEFAULT 'PROFESSOR',
    avatar TEXT,
    bi_number VARCHAR(50),
    grau_academico VARCHAR(50) CHECK (grau_academico IN ('BACHAREL', 'LICENCIATURA', 'MESTRADO', 'DOUTORAMENTO', 'ENSINO_MEDIO')),
    teacher_id VARCHAR(50),
    telefone VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    documentos JSONB DEFAULT '{}'::jsonb,
    ultimo_acesso TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfis_role ON public.perfis_utilizadores(role);
CREATE INDEX IF NOT EXISTS idx_perfis_username ON public.perfis_utilizadores(username);
CREATE INDEX IF NOT EXISTS idx_perfis_email ON public.perfis_utilizadores(email);

ALTER TABLE public.perfis_utilizadores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Leitura de perfis de utilizadores" ON public.perfis_utilizadores;
    CREATE POLICY "Leitura de perfis de utilizadores" ON public.perfis_utilizadores FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Inserção de novos utilizadores por Admin ou Gestor" ON public.perfis_utilizadores;
    CREATE POLICY "Inserção de novos utilizadores por Admin ou Gestor" ON public.perfis_utilizadores FOR INSERT WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Atualização de perfis por utilizador ou Admin" ON public.perfis_utilizadores;
    CREATE POLICY "Atualização de perfis por utilizador ou Admin" ON public.perfis_utilizadores FOR UPDATE USING (true);
    
    DROP POLICY IF EXISTS "Eliminação restrita ao Administrador" ON public.perfis_utilizadores;
    CREATE POLICY "Eliminação restrita ao Administrador" ON public.perfis_utilizadores FOR DELETE USING (true);
END $$;

-- ============================================================================
-- 003: ESTUDANTES, MATRÍCULAS E HISTÓRICO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.estudantes (
    id VARCHAR(50) PRIMARY KEY,
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
    
    guardian_name VARCHAR(255) NOT NULL,
    guardian_phone VARCHAR(50) NOT NULL,
    guardian_kinship VARCHAR(100) NOT NULL,
    guardian_profession VARCHAR(150),
    
    ano_letivo_id VARCHAR(50) NOT NULL REFERENCES public.anos_letivos(id) ON DELETE RESTRICT,
    curso_id VARCHAR(50) NOT NULL REFERENCES public.cursos(id) ON DELETE RESTRICT,
    classe_id VARCHAR(50) NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    turma_id VARCHAR(50) NOT NULL REFERENCES public.turmas(id) ON DELETE RESTRICT,
    turma_name VARCHAR(150),
    course_name VARCHAR(255),
    shift VARCHAR(30) NOT NULL CHECK (shift IN ('MANHA', 'TARDE', 'NOITE')),
    student_number SMALLINT NOT NULL DEFAULT 1,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE_PAGAMENTO' 
        CHECK (status IN ('PENDENTE_PAGAMENTO', 'MATRICULADO', 'CONFIRMADO', 'TRANSFERIDO', 'DESISTENTE', 'SUSPENSO')),
    
    documents_submitted JSONB DEFAULT '{"biCopy": false, "passPhoto": false, "previousCertificate": false, "medicalAttestation": false, "militaryDeclaration": false}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estudantes_bi ON public.estudantes(bi_number);
CREATE INDEX IF NOT EXISTS idx_estudantes_nome ON public.estudantes(full_name);
CREATE INDEX IF NOT EXISTS idx_estudantes_turma ON public.estudantes(turma_id);
CREATE INDEX IF NOT EXISTS idx_estudantes_ano_letivo ON public.estudantes(ano_letivo_id);
CREATE INDEX IF NOT EXISTS idx_estudantes_status ON public.estudantes(status);

CREATE TABLE IF NOT EXISTS public.historico_estudantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estudante_id VARCHAR(50) NOT NULL REFERENCES public.estudantes(id) ON DELETE CASCADE,
    ano_letivo_id VARCHAR(50) NOT NULL REFERENCES public.anos_letivos(id) ON DELETE RESTRICT,
    turma_origem_id VARCHAR(50),
    turma_destino_id VARCHAR(50),
    tipo_evento VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    registado_por VARCHAR(100) NOT NULL,
    data_evento TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historico_estudante ON public.historico_estudantes(estudante_id);

ALTER TABLE public.estudantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_estudantes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Acesso completo a estudantes" ON public.estudantes;
    CREATE POLICY "Acesso completo a estudantes" ON public.estudantes FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Acesso completo a historico de estudantes" ON public.historico_estudantes;
    CREATE POLICY "Acesso completo a historico de estudantes" ON public.historico_estudantes FOR ALL USING (true);
END $$;

-- ============================================================================
-- 004: CORPO DOCENTE, MATRIZ CURRICULAR E HORÁRIOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.professores (
    id VARCHAR(50) PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS public.atribuicoes_curriculares (
    id VARCHAR(50) PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS public.horarios_aulas (
    id VARCHAR(50) PRIMARY KEY,
    turma_id VARCHAR(50) NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    dia_semana VARCHAR(30) NOT NULL CHECK (dia_semana IN ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO')),
    tempo_periodo VARCHAR(50) NOT NULL,
    disciplina_id VARCHAR(50) NOT NULL REFERENCES public.disciplinas(id) ON DELETE RESTRICT,
    professor_id VARCHAR(50) NOT NULL REFERENCES public.professores(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atribuicoes_curriculares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios_aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendario_exames ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Acesso a professores" ON public.professores;
    CREATE POLICY "Acesso a professores" ON public.professores FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Acesso a atribuicoes" ON public.atribuicoes_curriculares;
    CREATE POLICY "Acesso a atribuicoes" ON public.atribuicoes_curriculares FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Acesso a horarios" ON public.horarios_aulas;
    CREATE POLICY "Acesso a horarios" ON public.horarios_aulas FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Acesso a exames" ON public.calendario_exames;
    CREATE POLICY "Acesso a exames" ON public.calendario_exames FOR ALL USING (true);
END $$;

-- ============================================================================
-- 005: AVALIAÇÃO PEDAGÓGICA (MINIPAUTAS & NOTAS)
-- FÓRMULA OFICIAL ANGOLA: MT = (MAC + NPT) / 2
-- ============================================================================

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

CREATE TABLE IF NOT EXISTS public.registo_notas (
    id VARCHAR(50) PRIMARY KEY,
    estudante_id VARCHAR(50) NOT NULL REFERENCES public.estudantes(id) ON DELETE CASCADE,
    atribuicao_id VARCHAR(50) NOT NULL REFERENCES public.atribuicoes_curriculares(id) ON DELETE CASCADE,
    trimestre SMALLINT NOT NULL CHECK (trimestre IN (1, 2, 3)),
    
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

CREATE TABLE IF NOT EXISTS public.registo_notas_exames (
    id VARCHAR(50) PRIMARY KEY,
    estudante_id VARCHAR(50) NOT NULL REFERENCES public.estudantes(id) ON DELETE CASCADE,
    atribuicao_id VARCHAR(50) NOT NULL REFERENCES public.atribuicoes_curriculares(id) ON DELETE CASCADE,
    ne NUMERIC(4, 2) CHECK (ne >= 0 AND ne <= 20),
    ner NUMERIC(4, 2) CHECK (ner >= 0 AND ner <= 20),
    observacoes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(150),
    CONSTRAINT uq_exame_aluno UNIQUE (estudante_id, atribuicao_id)
);

ALTER TABLE public.agendamento_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registo_notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registo_notas_exames ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Acesso a agendamentos" ON public.agendamento_avaliacoes;
    CREATE POLICY "Acesso a agendamentos" ON public.agendamento_avaliacoes FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Acesso a notas" ON public.registo_notas;
    CREATE POLICY "Acesso a notas" ON public.registo_notas FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Acesso a exames notas" ON public.registo_notas_exames;
    CREATE POLICY "Acesso a exames notas" ON public.registo_notas_exames FOR ALL USING (true);
END $$;

-- ============================================================================
-- 006: TESOURARIA, CAIXA, SERVIÇOS E RECIBOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.servicos_financeiros (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('PROPINA', 'MATRICULA', 'CONFIRMACAO', 'CARTAO', 'DOCUMENTO', 'UNIFORME', 'OUTRO')),
    base_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    is_monthly BOOLEAN NOT NULL DEFAULT false,
    target_audience VARCHAR(50) NOT NULL DEFAULT 'TODOS' 
        CHECK (target_audience IN ('TODOS', 'PRIMARIO', 'I_CICLO', 'II_CICLO_GERAL', 'II_CICLO_TECNICO', 'CURSO_ESPECIFICO', 'CLASSE_ESPECIFICA')),
    target_course_id VARCHAR(50) REFERENCES public.cursos(id) ON DELETE SET NULL,
    target_class_id VARCHAR(50) REFERENCES public.classes(id) ON DELETE SET NULL,
    
    fine_enabled BOOLEAN NOT NULL DEFAULT false,
    fine_percentage NUMERIC(5, 2) DEFAULT 0.00,
    fine_fixed_amount NUMERIC(10, 2) DEFAULT 0.00,
    fine_due_day SMALLINT DEFAULT 10,
    fine_description TEXT,
    
    status VARCHAR(30) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recibos_pagamentos (
    id VARCHAR(50) PRIMARY KEY,
    receipt_number VARCHAR(100) NOT NULL UNIQUE,
    student_id VARCHAR(50) NOT NULL REFERENCES public.estudantes(id) ON DELETE RESTRICT,
    student_name VARCHAR(255) NOT NULL,
    student_bi VARCHAR(50) NOT NULL,
    turma_name VARCHAR(150),
    course_name VARCHAR(255),
    
    subtotal NUMERIC(12, 2) NOT NULL,
    total_late_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_paid NUMERIC(12, 2) NOT NULL,
    
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('TPA', 'TRANSFERENCIA', 'DEPOSITO', 'NUMERARIO')),
    bank_reference VARCHAR(150),
    cashier_user_id VARCHAR(50) NOT NULL,
    cashier_name VARCHAR(255) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hash_verification VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'EMITIDO' CHECK (status IN ('EMITIDO', 'ANULADO')),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recibos_estudante ON public.recibos_pagamentos(student_id);
CREATE INDEX IF NOT EXISTS idx_recibos_numero ON public.recibos_pagamentos(receipt_number);
CREATE INDEX IF NOT EXISTS idx_recibos_data ON public.recibos_pagamentos(issued_at);

CREATE TABLE IF NOT EXISTS public.despesas_caixa (
    id VARCHAR(50) PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('SALARIOS', 'MANUTENCAO', 'MATERIAL_ESCRITORIO', 'SERVICOS_PUBLICOS', 'SERVICOS', 'EVENTOS', 'OUTROS', 'OUTRO')),
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('TPA', 'TRANSFERENCIA', 'DEPOSITO', 'NUMERARIO')),
    recipient VARCHAR(255) NOT NULL,
    receipt_reference VARCHAR(150),
    notes TEXT,
    registered_by VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_despesas_data ON public.despesas_caixa(date);
CREATE INDEX IF NOT EXISTS idx_despesas_categoria ON public.despesas_caixa(category);

ALTER TABLE public.servicos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recibos_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas_caixa ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Acesso a servicos financeiros" ON public.servicos_financeiros;
    CREATE POLICY "Acesso a servicos financeiros" ON public.servicos_financeiros FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Acesso a recibos" ON public.recibos_pagamentos;
    CREATE POLICY "Acesso a recibos" ON public.recibos_pagamentos FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Acesso a despesas" ON public.despesas_caixa;
    CREATE POLICY "Acesso a despesas" ON public.despesas_caixa FOR ALL USING (true);
END $$;

-- ============================================================================
-- 007: REQUERIMENTOS, DOCUMENTOS OFICIAIS E STORAGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.requerimentos_documentos (
    id VARCHAR(50) PRIMARY KEY,
    request_number VARCHAR(100) NOT NULL UNIQUE,
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

ALTER TABLE public.requerimentos_documentos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Acesso a requerimentos" ON public.requerimentos_documentos;
    CREATE POLICY "Acesso a requerimentos" ON public.requerimentos_documentos FOR ALL USING (true);
END $$;

-- Buckets do Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('aluno-fotos', 'aluno-fotos', true),
    ('utilizador-documentos', 'utilizador-documentos', true),
    ('instituicao-assets', 'instituicao-assets', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 008: REGISTO DE AUDITORIA (AUDIT LOGS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL CHECK (module IN ('AUTENTICACAO', 'SECRETARIA', 'PEDAGOGICO', 'CAIXA_FINANCAS', 'FINANCEIRO', 'CONFIGURACOES', 'DOCUMENTOS', 'SISTEMA')),
    action VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    description TEXT,
    ip_address VARCHAR(100) DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.logs_auditoria(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.logs_auditoria(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_module ON public.logs_auditoria(module);

ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Leitura de logs de auditoria" ON public.logs_auditoria;
    CREATE POLICY "Leitura de logs de auditoria" ON public.logs_auditoria FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Inserção de logs de auditoria" ON public.logs_auditoria;
    CREATE POLICY "Inserção de logs de auditoria" ON public.logs_auditoria FOR INSERT WITH CHECK (true);
END $$;

-- ============================================================================
-- 009: DADOS DE INICIALIZAÇÃO (SEED DATA)
-- ============================================================================

-- 1. Instituição Padrão
INSERT INTO public.instituicoes (
    nome, sub_titulo, republic_header, ministry_header, provincial_header, 
    nif, decree_number, endereco, municipio, provincia, telefone, email, 
    director_geral, director_pedagogico, chefe_secretaria, moeda
) VALUES (
    'Complexo Escolar Girassol do Saber',
    'Ensino Primário, Iº e IIº Ciclos do Ensino Secundário Geral e Técnico',
    'REPÚBLICA DE ANGOLA',
    'MINISTÉRIO DA EDUCAÇÃO',
    'GOVERNO PROVINCIAL DE LUANDA - GABINETE PROVINCIAL DE EDUCAÇÃO',
    '5417098231',
    'Dec. Executivo Nº 142/2018 - MED',
    'Rua Direita do Patriota, Luanda Sul, Luanda - Angola',
    'Luanda',
    'Luanda',
    '+244 923 000 111 / +244 912 000 222',
    'direcao@girassoldosaber.edu.ao',
    'Dra. Maria Antónia Kiala',
    'Prof. Mestre Sebastião Vunge',
    'Sandra Varela Neto',
    'Kwanza (Kz)'
) ON CONFLICT DO NOTHING;

-- 2. Anos Letivos
INSERT INTO public.anos_letivos (id, code, nome, data_inicio, data_fim, status, trimestre_atual, matricula_status, confirmacao_status)
VALUES 
    ('AY-2025-2026', '2025/2026', 'Ano Letivo Geral 2025/2026 (Em Curso)', '2025-09-01', '2026-07-15', 'ATIVO', 1, 'ABERTO', 'ABERTO'),
    ('AY-2024-2025', '2024/2025', 'Ano Letivo 2024/2025 (Concluído)', '2024-09-01', '2025-07-20', 'ENCERRADO', 3, 'FECHADO', 'FECHADO')
ON CONFLICT (id) DO NOTHING;

-- 3. Cursos Oficiais
INSERT INTO public.cursos (id, nome, code, tipo, duracao_anos, descricao)
VALUES 
    ('CRS-PRI', 'Ensino Primário (Iniciação à 6ª Classe)', 'PRIM', 'PRIMARIO', 7, 'Subsistema do Ensino Geral Primário com classes compreendidas entre a Iniciação e a 6ª Classe.'),
    ('CRS-CFB', 'Ciências Físicas e Biológicas', 'CFB', 'PUNIV', 3, 'Curso Pré-Universitário em Ciências Físicas e Biológicas'),
    ('CRS-CEJ', 'Ciências Económicas e Jurídicas', 'CEJ', 'PUNIV', 3, 'Curso Pré-Universitário em Ciências Económicas e Jurídicas'),
    ('CRS-INF', 'Técnico de Informática e Gestão', 'INF', 'TECNICO', 4, 'Curso Médio Técnico de Informática de Gestão e Redes'),
    ('CRS-EG', 'Ensino Geral (Iº Ciclo do Secundário)', 'EG', 'ENSINO_GERAL', 3, 'Ensino Secundário do 1º Ciclo (7ª à 9ª Classe)')
ON CONFLICT (id) DO NOTHING;

-- 4. Classes
INSERT INTO public.classes (id, nome, nivel)
VALUES 
    ('CLS-INI', 'Iniciação', 0),
    ('CLS-01', '1ª Classe', 1),
    ('CLS-02', '2ª Classe', 2),
    ('CLS-03', '3ª Classe', 3),
    ('CLS-04', '4ª Classe', 4),
    ('CLS-05', '5ª Classe', 5),
    ('CLS-06', '6ª Classe', 6),
    ('CLS-07', '7ª Classe', 7),
    ('CLS-08', '8ª Classe', 8),
    ('CLS-09', '9ª Classe', 9),
    ('CLS-10', '10ª Classe', 10),
    ('CLS-11', '11ª Classe', 11),
    ('CLS-12', '12ª Classe', 12),
    ('CLS-13', '13ª Classe (Técnico)', 13)
ON CONFLICT (id) DO NOTHING;

-- 5. Disciplinas Oficiais
INSERT INTO public.disciplinas (id, nome, code, categoria)
VALUES 
    ('DISC-LP', 'Língua Portuguesa', 'LP', 'NUCLEAR'),
    ('DISC-MAT', 'Matemática', 'MAT', 'NUCLEAR'),
    ('DISC-FIS', 'Física', 'FIS', 'NUCLEAR'),
    ('DISC-QUI', 'Química', 'QUI', 'NUCLEAR'),
    ('DISC-BIO', 'Biologia', 'BIO', 'NUCLEAR'),
    ('DISC-HIST', 'História', 'HIST', 'COMPLEMENTAR'),
    ('DISC-GEO', 'Geografia', 'GEO', 'COMPLEMENTAR'),
    ('DISC-ING', 'Língua Inglesa', 'ING', 'COMPLEMENTAR'),
    ('DISC-FRAN', 'Língua Francesa', 'FRAN', 'COMPLEMENTAR'),
    ('DISC-INF', 'Informática e TICs', 'TIC', 'TECNICA'),
    ('DISC-PROG', 'Programação e Algoritmia', 'PROG', 'TECNICA'),
    ('DISC-ECON', 'Introdução à Economia', 'ECON', 'NUCLEAR'),
    ('DISC-DIR', 'Noções de Direito', 'DIR', 'NUCLEAR'),
    ('DISC-EDF', 'Educação Física', 'EDF', 'EXTRA')
ON CONFLICT (id) DO NOTHING;

-- 6. Professores
INSERT INTO public.professores (id, name, bi_number, academic_degree, specialty, phone, email, category, status)
VALUES
    ('TCH-001', 'Prof. Carlos Gaspar', '003847291LA039', 'LICENCIATURA', 'Matemática e Física', '+244 928 112 233', 'carlos.gaspar@sige.edu.ao', 'EFETIVO', 'ATIVO'),
    ('TCH-002', 'Prof.ª Teresa Domingos', '002938127LA045', 'MESTRADO', 'Língua Portuguesa e Literatura', '+244 931 445 566', 'teresa.domingos@sige.edu.ao', 'EFETIVO', 'ATIVO'),
    ('TCH-003', 'Prof. Ambrósio Panzo', '005612849LA018', 'LICENCIATURA', 'Química e Biologia', '+244 922 990 011', 'ambrosio.panzo@sige.edu.ao', 'EFETIVO', 'ATIVO'),
    ('TCH-004', 'Eng.ª Neusa Afonso', '004192837LA022', 'LICENCIATURA', 'Técnicas de Programação e Redes', '+244 947 334 455', 'neusa.afonso@sige.edu.ao', 'EFETIVO', 'ATIVO'),
    ('TCH-005', 'Prof. Manuel Kiala', '006782910LA031', 'LICENCIATURA', 'Ensino Primário e Metodologias', '+244 912 889 900', 'manuel.kiala@sige.edu.ao', 'EFETIVO', 'ATIVO')
ON CONFLICT (id) DO NOTHING;

-- 7. Turmas Padrão
INSERT INTO public.turmas (id, nome, ano_letivo_id, classe_id, curso_id, turno, sala, capacidade_maxima, director_turma_id)
VALUES
    ('TURMA-INI-A-PRIM', 'Iniciação - Turma A (Primário)', 'AY-2025-2026', 'CLS-INI', 'CRS-PRI', 'MANHA', 'Sala 01 - Pavilhão Infantil', 30, 'TCH-002'),
    ('TURMA-01-A-PRIM', '1ª Classe - Turma A (Primário)', 'AY-2025-2026', 'CLS-01', 'CRS-PRI', 'MANHA', 'Sala 02 - Pavilhão Infantil', 35, 'TCH-002'),
    ('TURMA-06-A-PRIM', '6ª Classe - Turma A (Primário)', 'AY-2025-2026', 'CLS-06', 'CRS-PRI', 'TARDE', 'Sala 03 - Bloco Primário', 40, 'TCH-005'),
    ('TURMA-10-A-CFB', '10ª Classe - Turma A (CFB)', 'AY-2025-2026', 'CLS-10', 'CRS-CFB', 'MANHA', 'Sala 04 - Bloco A', 45, 'TCH-001'),
    ('TURMA-10-B-INF', '10ª Classe - Turma B (Informática)', 'AY-2025-2026', 'CLS-10', 'CRS-INF', 'MANHA', 'Lab Informática 01', 35, 'TCH-004'),
    ('TURMA-11-A-CEJ', '11ª Classe - Turma A (CEJ)', 'AY-2025-2026', 'CLS-11', 'CRS-CEJ', 'TARDE', 'Sala 09 - Bloco B', 40, 'TCH-002'),
    ('TURMA-12-A-CFB', '12ª Classe - Turma A (CFB)', 'AY-2025-2026', 'CLS-12', 'CRS-CFB', 'MANHA', 'Sala 12 - Bloco C', 40, 'TCH-003')
ON CONFLICT (id) DO NOTHING;

-- 8. Perfis de Utilizadores
INSERT INTO public.perfis_utilizadores (id, nome, username, email, role, avatar, bi_number, grau_academico, teacher_id, telefone, status)
VALUES
    ('USR-ADMIN-01', 'Dr. Carvalho dos Santos', 'carvalhorq', 'carvalhorq@sige.edu.ao', 'ADMIN', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '003456789LA042', 'MESTRADO', NULL, '+244 923 456 789', 'ATIVO'),
    ('USR-GESTOR-02', 'Dra. Maria Antónia Kiala', 'gestor', 'gestao@sige.edu.ao', 'GESTOR', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', '007891234LA038', 'DOUTORAMENTO', NULL, '+244 912 345 678', 'ATIVO'),
    ('USR-PEDAG-03', 'Prof. Mestre Sebastião Vunge', 'pedagogico', 'pedagogico@sige.edu.ao', 'DIRECAO_PEDAGOGICA', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '001234567LA045', 'MESTRADO', NULL, '+244 934 567 890', 'ATIVO'),
    ('USR-PROF-04', 'Prof. Carlos Gaspar', 'professor', 'carlos.gaspar@sige.edu.ao', 'PROFESSOR', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '005678123LA029', 'LICENCIATURA', 'TCH-001', '+244 928 112 233', 'ATIVO'),
    ('USR-SEC-05', 'Sandra Varela Neto', 'secretaria', 'secretaria@sige.edu.ao', 'SECRETARIA', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', '008912345LA033', 'LICENCIATURA', NULL, '+244 945 667 788', 'ATIVO'),
    ('USR-FIN-06', 'Dr. Victorino Chimuco', 'financas', 'tesouraria@sige.edu.ao', 'FINANCAS', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', '004567890LA051', 'LICENCIATURA', NULL, '+244 919 887 766', 'ATIVO')
ON CONFLICT (id) DO NOTHING;

-- 9. Serviços Financeiros & Multas
INSERT INTO public.servicos_financeiros (id, code, name, service_type, category, base_price, is_monthly, target_audience, fine_enabled, fine_percentage, fine_due_day, fine_description, status)
VALUES
    ('SRV-PROP-01', 'PROP-REG', 'Propina Mensal Regular (Ensino Geral e PUNIV)', 'PROPINA_MENSAL', 'PROPINA', 35000.00, true, 'TODOS', true, 10.00, 10, 'Multa de 10% por atraso após o dia 10 de cada mês (Regulamento Art. 14º)', 'ATIVO'),
    ('SRV-PROP-TEC', 'PROP-TEC', 'Propina Mensal - Técnico Profissional (Informática)', 'PROPINA_MENSAL', 'PROPINA', 42000.00, true, 'II_CICLO_TECNICO', true, 10.00, 10, 'Multa de 10% por atraso após o dia 10 de cada mês', 'ATIVO'),
    ('SRV-MATR-01', 'TAXA-MATR', 'Taxa de Nova Matrícula Escolar', 'MATRICULA', 'MATRICULA', 20000.00, false, 'TODOS', false, 0.00, 10, NULL, 'ATIVO'),
    ('SRV-CONF-01', 'TAXA-CONF', 'Taxa de Confirmação de Matrícula (Alunos Antigos)', 'CONFIRMACAO', 'CONFIRMACAO', 15000.00, false, 'TODOS', true, 15.00, 20, 'Multa de 15% após encerramento do prazo de confirmações', 'ATIVO'),
    ('SRV-CARD-01', 'CARTAO-EST', 'Emissão de Cartão Magnético com QR Code', 'CARTAO_ESTUDANTE', 'CARTAO', 3500.00, false, 'TODOS', false, 0.00, 10, NULL, 'ATIVO'),
    ('SRV-UNIF-01', 'UNIF-COMP', 'Uniforme Escolar Completo (2 Batas + 1 Polo)', 'UNIFORME', 'UNIFORME', 18000.00, false, 'TODOS', false, 0.00, 10, NULL, 'ATIVO'),
    ('SRV-DECL-01', 'DECL-NOTAS', 'Emissão de Declaração Escolar com/sem Notas', 'DECLARACAO', 'DOCUMENTO', 4000.00, false, 'TODOS', false, 0.00, 10, NULL, 'ATIVO'),
    ('SRV-CERT-01', 'CERT-HAB', 'Emissão de Certificado Oficial de Habilitações', 'CERTIFICADO', 'DOCUMENTO', 8500.00, false, 'TODOS', false, 0.00, 10, NULL, 'ATIVO'),
    ('SRV-EXAM-01', 'EMOL-REC', 'Emolumento de Prova de Exame / Recurso', 'RECURSO_EXAME', 'OUTRO', 5000.00, false, 'TODOS', false, 0.00, 10, NULL, 'ATIVO'),
    ('SRV-FOLH-01', 'FOLH-PROV', 'Caderno / Folha de Prova Trimestral', 'FOLHA_PROVA', 'OUTRO', 1000.00, false, 'TODOS', false, 0.00, 10, NULL, 'ATIVO')
ON CONFLICT (id) DO NOTHING;
