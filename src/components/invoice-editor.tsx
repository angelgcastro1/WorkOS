"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import type { Client, Invoice } from "@/lib/data";
import { createInvoice, updateInvoice } from "@/app/actions";
import { Card, CardContent } from "@/components/ui";
import { cn, formatMoney } from "@/lib/utils";

type Row = { description: string; quantity: number; rate: number };

const fieldClass =
  "w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const labelClass = "mb-1 block text-xs font-medium text-muted-foreground";

type Props = { clients: Client[]; invoice?: Invoice; defaultNumber: string };

export function InvoiceEditor({ clients, invoice, defaultNumber }: Props) {
  const [rows, setRows] = useState<Row[]>(
    invoice && invoice.lineItems.length > 0
      ? invoice.lineItems.map((li) => ({ description: li.description, quantity: li.quantity, rate: li.rate }))
      : [{ description: "", quantity: 1, rate: 0 }],
  );
  const [taxRate, setTaxRate] = useState<number>(invoice?.taxRate ?? 0);

  const subtotal = rows.reduce((s, r) => s + r.quantity * r.rate, 0);
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax;

  const updateRow = (i: number, patch: Partial<Row>) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((prev) => [...prev, { description: "", quantity: 1, rate: 0 }]);
  const removeRow = (i: number) => setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const action = invoice ? updateInvoice : createInvoice;

  return (
    <form action={action} className="space-y-4">
      {invoice ? <input type="hidden" name="id" value={invoice.id} /> : null}
      <input type="hidden" name="line_items" value={JSON.stringify(rows)} />
      <input type="hidden" name="tax_rate" value={String(taxRate)} />

      <Card>
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Invoice number</label>
            <input name="invoice_number" defaultValue={invoice?.invoiceNumber ?? defaultNumber} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Client</label>
            {clients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clients yet —{" "}
                <Link href="/clients" className="text-primary hover:underline">
                  add one
                </Link>
                .
              </p>
            ) : (
              <select name="client_id" defaultValue={invoice?.clientId ?? ""} className={fieldClass}>
                <option value="">— Select client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` (${c.company})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select name="status" defaultValue={invoice?.status ?? "draft"} className={fieldClass}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Due date</label>
            <input name="due_on" type="date" defaultValue={invoice?.dueOn ?? ""} className={fieldClass} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="hidden grid-cols-[1fr_70px_100px_100px_32px] gap-2 text-xs font-medium text-muted-foreground sm:grid">
            <span>Description</span>
            <span>Qty</span>
            <span>Rate</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[1fr_70px_100px_100px_32px]">
              <input
                value={r.description}
                onChange={(e) => updateRow(i, { description: e.target.value })}
                placeholder="Description"
                className={cn(fieldClass, "col-span-2 sm:col-span-1")}
              />
              <input
                type="number"
                min="0"
                value={r.quantity}
                onChange={(e) => updateRow(i, { quantity: Number(e.target.value) || 0 })}
                className={fieldClass}
                aria-label="Quantity"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={r.rate}
                onChange={(e) => updateRow(i, { rate: Number(e.target.value) || 0 })}
                className={fieldClass}
                aria-label="Rate"
              />
              <span className="text-right text-sm font-medium tabular-nums">{formatMoney(r.quantity * r.rate)}</span>
              <button
                type="button"
                onClick={() => removeRow(i)}
                aria-label="Remove line"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground/60 transition hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Add line
          </button>

          <div className="ml-auto w-full max-w-xs space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                Tax
                <input
                  type="number"
                  min="0"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                  className="w-14 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-right text-xs outline-none focus:border-primary"
                  aria-label="Tax rate %"
                />
                %
              </span>
              <span className="tabular-nums">{formatMoney(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(total)}</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes / payment terms</label>
            <textarea name="notes" defaultValue={invoice?.notes ?? ""} rows={2} placeholder="e.g. Payment due within 14 days. Thank you!" className={cn(fieldClass, "resize-y")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
        >
          Save invoice
        </button>
        <Link href="/invoices" className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-muted">
          Cancel
        </Link>
      </div>
    </form>
  );
}
