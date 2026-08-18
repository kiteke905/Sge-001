import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DocumentRequest } from '../types';

export const documentsService = {
  async getRequests(): Promise<DocumentRequest[] | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('requerimentos_documentos')
          .select('*')
          .order('requested_at', { ascending: false });

        if (error) {
          console.warn('Erro ao carregar requerimentos do Supabase:', error.message);
          return null;
        }

        if (data) {
          return data.map(r => ({
            id: r.id,
            requestNumber: r.request_number,
            protocolNumber: r.protocol_number,
            studentId: r.student_id,
            studentName: r.student_name,
            studentBi: r.student_bi,
            turmaName: r.turma_name,
            courseName: r.course_name,
            documentType: r.document_type,
            type: r.document_type,
            purpose: r.purpose,
            requestDate: r.request_date,
            requestedAt: r.requested_at,
            deliveryEstimateDate: r.delivery_estimate_date,
            status: r.status,
            issuedAt: r.issued_at,
            issuedBy: r.issued_by,
            feePaid: r.fee_paid,
            notes: r.notes,
          }));
        }
      } catch (err) {
        console.warn('Erro ao carregar requerimentos do Supabase:', err);
      }
    }
    return null;
  },

  async upsertRequest(req: DocumentRequest): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('requerimentos_documentos').upsert({
          id: req.id,
          request_number: req.requestNumber,
          protocol_number: req.protocolNumber || null,
          student_id: req.studentId,
          student_name: req.studentName,
          student_bi: req.studentBi || null,
          turma_name: req.turmaName || null,
          course_name: req.courseName || null,
          document_type: req.documentType || req.type,
          purpose: req.purpose,
          request_date: req.requestDate,
          requested_at: req.requestedAt || new Date().toISOString(),
          delivery_estimate_date: req.deliveryEstimateDate || null,
          status: req.status,
          issued_at: req.issuedAt || null,
          issued_by: req.issuedBy || null,
          fee_paid: req.feePaid || false,
          notes: req.notes || null,
          updated_at: new Date().toISOString(),
        });
        return !error;
      } catch (err) {
        console.warn('Exceção ao persistir requerimento:', err);
        return false;
      }
    }
    return true;
  }
};
