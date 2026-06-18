import type { LineItem } from "@/lib/data";
import { formatMoney, formatDate } from "@/lib/utils";
import { BrandMark } from "@/components/brand-mark";

type InvoicePaperClient = {
  name: string;
  company: string | null;
  email: string | null;
  address: string | null;
};

type InvoicePaperProps = {
  businessName: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  invoiceNumber: string | null;
  issuedOn: string | null;
  dueOn: string | null;
  status: string;
  client: InvoicePaperClient | null;
  lineItems: LineItem[];
  taxRate: number;
  notes: string | null;
};

export function InvoicePaper({
  businessName,
  businessEmail,
  businessAddress,
  invoiceNumber,
  issuedOn,
  dueOn,
  status,
  client,
  lineItems,
  taxRate,
  notes,
}: InvoicePaperProps) {
  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.rate, 0);
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax;

  return (
    <div className="print-area rounded-2xl bg-white p-8 text-slate-900 shadow-sm sm:p-10">
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark height={44} />
          <div className="min-w-0">
            <p className="text-lg font-bold">{businessName || "Your business"}</p>
            {businessEmail ? <p className="text-sm text-slate-500">{businessEmail}</p> : null}
            {businessAddress ? <p className="whitespace-pre-line text-sm text-slate-500">{businessAddress}</p> : null}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight">INVOICE</p>
          {invoiceNumber ? <p className="text-sm text-slate-500">{invoiceNumber}</p> : null}
          <p className="mt-2 text-xs text-slate-500">Issued {formatDate(issuedOn)}</p>
          {dueOn ? <p className="text-xs text-slate-500">Due {formatDate(dueOn)}</p> : null}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to</p>
        {client ? (
          <div className="mt-1 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">{client.name}</p>
            {client.company ? <p>{client.company}</p> : null}
            {client.email ? <p>{client.email}</p> : null}
            {client.address ? <p className="whitespace-pre-line">{client.address}</p> : null}
          </div>
        ) : (
          <p className="mt-1 text-sm text-slate-400">No client selected</p>
        )}
      </div>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="py-2 font-semibold">Description</th>
            <th className="py-2 text-right font-semibold">Qty</th>
            <th className="py-2 text-right font-semibold">Rate</th>
            <th className="py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-center text-slate-400">
                No line items
              </td>
            </tr>
          ) : (
            lineItems.map((li, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-2.5 text-slate-700">{li.description}</td>
                <td className="py-2.5 text-right tabular-nums text-slate-700">{li.quantity}</td>
                <td className="py-2.5 text-right tabular-nums text-slate-700">{formatMoney(li.rate)}</td>
                <td className="py-2.5 text-right font-medium tabular-nums text-slate-900">{formatMoney(li.quantity * li.rate)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-[220px] space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatMoney(subtotal)}</span>
          </div>
          {taxRate > 0 ? (
            <div className="flex justify-between text-slate-500">
              <span>Tax ({taxRate}%)</span>
              <span className="tabular-nums">{formatMoney(tax)}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-bold text-slate-900">
            <span>Total</span>
            <span className="tabular-nums">{formatMoney(total)}</span>
          </div>
        </div>
      </div>

      {notes ? (
        <div className="mt-8 border-t border-slate-200 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{notes}</p>
        </div>
      ) : null}

      {status === "paid" ? (
        <p className="mt-6 inline-block rounded-md border-2 border-emerald-500 px-3 py-1 text-sm font-bold uppercase tracking-wide text-emerald-600">
          Paid
        </p>
      ) : null}
    </div>
  );
}
