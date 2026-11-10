/** Teslimde fatura kaydı. Gerçek e-Arşiv/e-Fatura sağlayıcı yok (ücretli). */

export const INVOICE_STATUSES = ["kesilecek", "kesildi", "iptal", "duzeltme_gerekli"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_KINDS = ["e_arsiv", "e_fatura"] as const;
export type InvoiceKind = (typeof INVOICE_KINDS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

export function invoiceAlarmAt(deliveredAt: Date): Date {
  return new Date(deliveredAt.getTime() + 5 * DAY_MS);
}

export function invoiceDeadlineAt(deliveredAt: Date): Date {
  return new Date(deliveredAt.getTime() + 7 * DAY_MS);
}

export function invoiceNeedsAlarm(deliveredAt: Date | string, now = new Date()) {
  const delivered = new Date(deliveredAt);
  return now.getTime() >= invoiceAlarmAt(delivered).getTime() && now.getTime() < invoiceDeadlineAt(delivered).getTime();
}

export function invoicePastDeadline(deliveredAt: Date | string, now = new Date()) {
  return now.getTime() >= invoiceDeadlineAt(new Date(deliveredAt)).getTime();
}

export type InvoiceIssueInput = {
  orderId: string;
  netKurus: number;
  vatKurus: number;
  grossKurus: number;
  buyerName: string;
  /** Alıcı VKN varsa; TCKN alanımız yok. */
  buyerTaxId?: string;
};

export type InvoiceIssueResult = {
  faturaNo: string;
  uuid: string;
  tur: InvoiceKind;
  kesimZamani: string;
};

export interface EInvoiceProvider {
  lookupRecipient(taxId: string): Promise<InvoiceKind>;
  issue(input: InvoiceIssueInput): Promise<InvoiceIssueResult>;
}

/** TODO: ücretli e-Arşiv/e-Fatura entegratörü bağlanınca bu arayüzü uygulayın. Canlıda çağrılmaz. */
export class InvoiceProviderNotConfigured implements EInvoiceProvider {
  async lookupRecipient(): Promise<InvoiceKind> {
    return "e_arsiv";
  }

  async issue(): Promise<InvoiceIssueResult> {
    throw new Error("e-Arşiv/e-Fatura sağlayıcı bağlı değil (ücretli servis; TODO)");
  }
}

export const DEFAULT_INVOICE_PROVIDER: EInvoiceProvider = new InvoiceProviderNotConfigured();
