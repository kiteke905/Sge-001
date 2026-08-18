-- ============================================================================
-- SIGE ANGOLA — MIGRAÇÃO 009: DADOS DE DEMONSTRAÇÃO E INICIALIZAÇÃO (SEED DATA)
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
    ('AY-2025-2026', '2025/2026', 'Ano Letivo 2025/2026 (Em Curso)', '2025-09-01', '2026-06-30', 'ATIVO', 2, 'ABERTO', 'ABERTO'),
    ('AY-2024-2025', '2024/2025', 'Ano Letivo 2024/2025 (Concluído)', '2024-09-01', '2025-06-30', 'ENCERRADO', 3, 'FECHADO', 'FECHADO')
ON CONFLICT (id) DO NOTHING;

-- 3. Cursos Oficiais
INSERT INTO public.cursos (id, nome, code, tipo, duracao_anos, descricao)
VALUES 
    ('CRS-CFB', 'Ciências Físicas e Biológicas', 'CFB', 'PUNIV', 3, 'Curso Pré-Universitário em Ciências Físicas e Biológicas'),
    ('CRS-CEJ', 'Ciências Económicas e Jurídicas', 'CEJ', 'PUNIV', 3, 'Curso Pré-Universitário em Ciências Económicas e Jurídicas'),
    ('CRS-INF', 'Técnico de Informática', 'INF', 'TECNICO', 4, 'Curso Médio Técnico de Informática de Gestão e Redes'),
    ('CRS-EG', 'Ensino Geral (Iº Ciclo)', 'EG', 'ENSINO_GERAL', 3, 'Ensino Secundário do 1º Ciclo (7ª à 9ª Classe)')
ON CONFLICT (id) DO NOTHING;

-- 4. Classes
INSERT INTO public.classes (id, nome, nivel)
VALUES 
    ('CLS-7', '7ª Classe', 7),
    ('CLS-8', '8ª Classe', 8),
    ('CLS-9', '9ª Classe', 9),
    ('CLS-10', '10ª Classe', 10),
    ('CLS-11', '11ª Classe', 11),
    ('CLS-12', '12ª Classe', 12),
    ('CLS-13', '13ª Classe (Técnico)', 13)
ON CONFLICT (id) DO NOTHING;

-- 5. Disciplinas
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
