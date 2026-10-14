import { SubscriptionInvoice, InvoiceDocument } from './invoice.model.js';
import { CreateInvoiceInput, UpdateInvoiceStatusInput } from '@smart-school/validation';
import { auditService } from '../audit/audit.service.js';
import { AppError } from '../../utils/appError.js';

export class InvoiceService {
  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await SubscriptionInvoice.countDocuments();
    const seq = String(count + 1).padStart(4, '0');
    return `INV-${year}-${seq}`;
  }

  async createInvoice(
    input: CreateInvoiceInput,
    schoolName: string,
    actor: { id: string; email: string; role: string }
  ): Promise<InvoiceDocument> {
    const invoiceNumber = await this.generateInvoiceNumber();
    const invoice = new SubscriptionInvoice({
      ...input,
      invoiceNumber,
      schoolName,
      dueDate: new Date(input.dueDate),
    });

    await invoice.save();

    await auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'billing.invoice_created',
      targetSchoolId: input.schoolId,
      targetSchoolName: schoolName,
      details: {
        invoiceNumber,
        amount: input.amount,
        plan: input.plan,
      },
    });

    return invoice;
  }

  async updateInvoiceStatus(
    invoiceId: string,
    input: UpdateInvoiceStatusInput,
    actor: { id: string; email: string; role: string }
  ): Promise<InvoiceDocument> {
    const invoice = await SubscriptionInvoice.findById(invoiceId);
    if (!invoice) {
      throw AppError.notFound('Invoice not found');
    }

    invoice.status = input.status;
    if (input.paymentMethod) invoice.paymentMethod = input.paymentMethod;
    if (input.notes) invoice.notes = input.notes;
    if (input.status === 'paid') {
      invoice.paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
    }

    await invoice.save();

    await auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'billing.invoice_status_updated',
      targetSchoolId: invoice.schoolId,
      targetSchoolName: invoice.schoolName,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        status: input.status,
        paymentMethod: input.paymentMethod,
      },
    });

    return invoice;
  }

  async listInvoices(params: {
    schoolId?: string;
    limit?: number;
    page?: number;
  }): Promise<{ items: InvoiceDocument[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (params.schoolId) query.schoolId = params.schoolId;

    const page = params.page || 1;
    const limit = Math.min(params.limit || 50, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      SubscriptionInvoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      SubscriptionInvoice.countDocuments(query),
    ]);

    return { items, total };
  }
}

export const invoiceService = new InvoiceService();
