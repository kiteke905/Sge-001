import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FinancialService, PaymentReceipt, ExpenseRecord } from '../types';

export const paymentsService = {
  // Financial Services Catalog
  async getFinancialServices(): Promise<FinancialService[] | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('servicos_financeiros').select('*');
        if (!error && data && data.length > 0) {
          return data.map(s => ({
            id: s.id,
            code: s.code,
            name: s.name,
            serviceType: s.service_type,
            category: s.category,
            basePrice: Number(s.base_price),
            description: s.description,
            isMonthly: s.is_monthly,
            targetAudience: s.target_audience,
            targetCourseId: s.target_course_id,
            targetClassId: s.target_class_id,
            fineEnabled: s.fine_enabled,
            finePercentage: Number(s.fine_percentage || 0),
            fineFixedAmount: Number(s.fine_fixed_amount || 0),
            fineDueDay: s.fine_due_day || 10,
            fineDescription: s.fine_description,
            status: s.status,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Erro ao carregar serviços financeiros:', err);
      }
    }
    return null;
  },

  async upsertFinancialService(service: FinancialService): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('servicos_financeiros').upsert({
          id: service.id,
          code: service.code,
          name: service.name,
          service_type: service.serviceType,
          category: service.category,
          base_price: service.basePrice,
          description: service.description,
          is_monthly: service.isMonthly,
          target_audience: service.targetAudience,
          target_course_id: service.targetCourseId || null,
          target_class_id: service.targetClassId || null,
          fine_enabled: service.fineEnabled,
          fine_percentage: service.finePercentage,
          fine_fixed_amount: service.fineFixedAmount,
          fine_due_day: service.fineDueDay,
          fine_description: service.fineDescription,
          status: service.status,
          updated_at: new Date().toISOString(),
        });
        return !error;
      } catch (err) {
        console.warn('Exceção ao persistir serviço financeiro:', err);
        return false;
      }
    }
    return true;
  },

  async deleteFinancialService(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('servicos_financeiros').delete().eq('id', id);
      } catch (err) {
        console.warn('Erro ao deletar serviço financeiro:', err);
      }
    }
  },

  // Receipts
  async getReceipts(): Promise<PaymentReceipt[] | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('recibos_pagamentos')
          .select('*')
          .order('issued_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(r => ({
            id: r.id,
            receiptNumber: r.receipt_number,
            studentId: r.student_id,
            studentName: r.student_name,
            studentBi: r.student_bi,
            turmaName: r.turma_name,
            courseName: r.course_name,
            items: r.items || [],
            subtotal: Number(r.subtotal),
            totalLateFee: Number(r.total_late_fee),
            totalPaid: Number(r.total_paid),
            paymentMethod: r.payment_method,
            bankReference: r.bank_reference,
            cashierUserId: r.cashier_user_id,
            cashierName: r.cashier_name,
            issuedAt: r.issued_at,
            hashVerification: r.hash_verification,
            status: r.status,
          }));
        }
      } catch (err) {
        console.warn('Erro ao carregar recibos do Supabase:', err);
      }
    }
    return null;
  },

  async upsertReceipt(receipt: PaymentReceipt): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('recibos_pagamentos').upsert({
          id: receipt.id,
          receipt_number: receipt.receiptNumber,
          student_id: receipt.studentId,
          student_name: receipt.studentName,
          student_bi: receipt.studentBi,
          turma_name: receipt.turmaName,
          course_name: receipt.courseName,
          subtotal: receipt.subtotal,
          total_late_fee: receipt.totalLateFee,
          total_paid: receipt.totalPaid,
          payment_method: receipt.paymentMethod,
          bank_reference: receipt.bankReference || null,
          cashier_user_id: receipt.cashierUserId,
          cashier_name: receipt.cashierName,
          issued_at: receipt.issuedAt,
          hash_verification: receipt.hashVerification,
          status: receipt.status,
          items: receipt.items,
        });
        return !error;
      } catch (err) {
        console.warn('Exceção ao persistir recibo:', err);
        return false;
      }
    }
    return true;
  },

  // Expenses
  async getExpenses(): Promise<ExpenseRecord[] | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('despesas_caixa')
          .select('*')
          .order('date', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(e => ({
            id: e.id,
            description: e.description,
            category: e.category,
            amount: Number(e.amount),
            date: e.date,
            paymentMethod: e.payment_method,
            recipient: e.recipient,
            receiptReference: e.receipt_reference,
            notes: e.notes,
            registeredBy: e.registered_by,
          }));
        }
      } catch (err) {
        console.warn('Erro ao obter despesas do Supabase:', err);
      }
    }
    return null;
  },

  async insertExpense(expense: ExpenseRecord): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('despesas_caixa').insert({
          id: expense.id,
          description: expense.description,
          category: expense.category,
          amount: expense.amount,
          date: expense.date,
          payment_method: expense.paymentMethod,
          recipient: expense.recipient,
          receipt_reference: expense.receiptReference || null,
          notes: expense.notes || null,
          registered_by: expense.registeredBy,
        });
        return !error;
      } catch (err) {
        console.warn('Exceção ao registrar despesa:', err);
        return false;
      }
    }
    return true;
  }
};
