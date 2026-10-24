"use client";

import React, { useState } from "react";
import { useDashboard } from "@/lib/dashboard-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/empty-state";
import { Check, MessageSquare, Search, AlertCircle, CreditCard } from "lucide-react";

export default function BillsPage() {
  const { state, toggleBillPaid, openViewerForMessage } = useDashboard();
  const [searchPayee, setSearchPayee] = useState("");

  if (!state.hasAnalysis || state.messages.length === 0) {
    return <EmptyState />;
  }

  // Calculate total across valid numeric amounts
  const monthlyTotal = state.bills.reduce((sum, b) => (b.amount ? sum + b.amount : sum), 0);
  const unpaidBills = state.bills.filter((b) => !b.isPaid);
  const unpaidTotal = unpaidBills.reduce((sum, b) => (b.amount ? sum + b.amount : sum), 0);

  const filteredBills = state.bills.filter((b) => {
    if (!searchPayee.trim()) return true;
    const q = searchPayee.toLowerCase();
    return b.payee.toLowerCase().includes(q) || (b.duePhrase || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Alert banner if pending unpaid dues exist */}
      {unpaidBills.length > 0 && (
        <Alert variant="warning">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <AlertTitle>Outstanding Payment Requests</AlertTitle>
            <AlertDescription>
              You have {unpaidBills.length} unpaid {unpaidBills.length === 1 ? "due" : "dues"} totaling ₹{unpaidTotal.toLocaleString("en-IN")}.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Running Monthly Total Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card interactive={false} className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-[var(--muted)] font-medium">Monthly Total</span>
            <p className="font-heading text-2xl font-bold font-mono text-[var(--foreground)]">
              ₹{monthlyTotal.toLocaleString("en-IN")}
            </p>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {state.bills.length} bills
          </Badge>
        </Card>

        <Card interactive={false} className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-[var(--muted)] font-medium">Outstanding Unpaid</span>
            <p className="font-heading text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              ₹{unpaidTotal.toLocaleString("en-IN")}
            </p>
          </div>
          <Badge variant={unpaidBills.length > 0 ? "urgent" : "neutral"} className="font-mono text-xs">
            {unpaidBills.length} pending
          </Badge>
        </Card>
      </div>

      {/* Payee Search InputGroup */}
      <div className="max-w-xs">
        <InputGroup>
          <InputGroupAddon align="start">
            <Search className="w-3.5 h-3.5 text-[var(--muted)]" />
          </InputGroupAddon>
          <InputGroupInput
            value={searchPayee}
            onChange={(e) => setSearchPayee(e.target.value)}
            placeholder="Search payee or due date..."
          />
        </InputGroup>
      </div>

      {/* Bills Table */}
      <Card interactive={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--background)]/60 border-b border-[var(--border-subtle)] font-mono text-[11px] text-[var(--muted)] uppercase">
              <tr>
                <th className="p-4 font-semibold">Payee</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Due Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--muted)]">
                    {searchPayee ? "No payment requests matched your search." : "No payment requests or bills detected in chat."}
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className={`hover:bg-[var(--card-bg-hover)] transition-colors ${
                      bill.isPaid ? "opacity-60" : ""
                    }`}
                  >
                    {/* Payee */}
                    <td className="p-4 font-mono font-medium text-[var(--foreground)]">
                      {bill.payee}
                    </td>

                    {/* Amount: "Amount not found" if null, NEVER 0 */}
                    <td className="p-4 font-mono font-bold text-sm text-[var(--foreground)]">
                      {bill.amount !== null ? (
                        `₹${bill.amount.toLocaleString("en-IN")}`
                      ) : (
                        <span className="text-xs italic text-[var(--muted)] font-normal">
                          Amount not found
                        </span>
                      )}
                    </td>

                    {/* Due */}
                    <td className="p-4 font-mono text-[var(--muted)]">
                      {bill.duePhrase || "Immediate"}
                    </td>

                    {/* Status & Paid Toggle */}
                    <td className="p-4">
                      <button
                        onClick={() => toggleBillPaid(bill.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                          bill.isPaid
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                        }`}
                      >
                        {bill.isPaid && <Check className="w-3 h-3 stroke-[2.5]" />}
                        <span>{bill.isPaid ? "Paid" : "Mark as paid"}</span>
                      </button>
                    </td>

                    {/* View Message Link */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openViewerForMessage(bill.source_message_ids[0])}
                        className="text-[var(--accent)] hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Total Row */}
            {filteredBills.length > 0 && (
              <tfoot className="bg-[var(--background)]/80 border-t-2 border-[var(--border-subtle)] font-mono text-xs">
                <tr>
                  <td className="p-4 font-bold text-[var(--foreground)]">Total Monthly Dues</td>
                  <td className="p-4 font-bold text-sm text-[var(--accent)]">
                    ₹{monthlyTotal.toLocaleString("en-IN")}
                  </td>
                  <td colSpan={3} className="p-4 text-right text-[var(--muted)]">
                    {state.bills.filter((b) => b.isPaid).length} of {state.bills.length} paid
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}
