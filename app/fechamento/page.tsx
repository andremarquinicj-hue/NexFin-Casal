"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, CircleDollarSign, RefreshCw, ReceiptText, WalletCards } from "lucide-react";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import Empty from "@/components/Empty";
import { useHouseholdData } from "@/components/useHouseholdData";
import { useAuth } from "@/components/AuthProvider";
import { brl, isSpendingDetail, monthKey, monthLabelFromKey, shiftMonthKey, summarize } from "@/lib/finance";
import { saveMonthlyClosing } from "@/lib/firestore";
import { MonthlyClosing } from "@/lib/types";

function timestampLabel(value: unknown) {
  if (!value) return "";
  try {
    const possible = value as { toDate?: () => Date; seconds?: number };
    const date = possible.toDate ? possible.toDate() : possible.seconds ? new Date(possible.seconds * 1000) : new Date(String(value));
    return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch { return ""; }
}

export default function Fechamento() {
  const { transactions, accounts, monthlyClosings, householdId } = useHouseholdData();
  const { profile } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(monthKey());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const monthItems = useMemo(() => transactions.filter((t) => t.dueDate?.startsWith(selectedMonth)), [transactions, selectedMonth]);
  const cashflowItems = useMemo(() => monthItems.filter((t) => t.type !== "card" && t.status !== "cancelled"), [monthItems]);
  const sum = useMemo(() => summarize(monthItems), [monthItems]);
  const bankBalance = accounts.reduce((total, account) => total + Number(account.balance || 0), 0);
  const pendingCount = cashflowItems.filter((t) => t.status === "planned" || t.status === "overdue").length;
  const closing = monthlyClosings.find((item) => item.month === selectedMonth);

  const categories = useMemo(() => {
    const grouped = new Map<string, number>();
    monthItems.filter(isSpendingDetail).forEach((t) => {
      grouped.set(t.category, (grouped.get(t.category) || 0) + Number(t.amountActual ?? t.amountPlanned ?? 0));
    });
    return [...grouped.entries()].map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [monthItems]);

  const history = useMemo(() => [...monthlyClosings].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 8), [monthlyClosings]);

  async function closeMonth() {
    setSaving(true);
    setMessage("");
    try {
      await saveMonthlyClosing(householdId, selectedMonth, {
        incomePlanned: sum.incomePlanned,
        incomeActual: sum.incomeActual,
        expensePlanned: sum.expensePlanned,
        expenseActual: sum.expenseActual,
        plannedBalance: sum.plannedBalance,
        actualBalance: sum.actualBalance,
        pendingExpenses: sum.pending,
        pendingIncome: sum.incomePending,
        bankBalance,
        transactionCount: cashflowItems.length,
        pendingCount,
        accountBalances: accounts.map((account) => ({ id: account.id, name: account.name, balance: Number(account.balance || 0) })),
        closedBy: profile?.uid || "",
      });
      setMessage(closing ? "Fechamento atualizado com os valores atuais." : "Mês fechado e fotografia financeira salva com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o fechamento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Fechamento mensal" subtitle="Salve uma fotografia financeira de cada mês e acompanhe a evolução do casal">
      <div className="closing-header">
        <div className="calendar-toolbar">
          <button onClick={() => setSelectedMonth(shiftMonthKey(selectedMonth, -1))}><ArrowLeft /></button>
          <div><span>Mês selecionado</span><strong>{monthLabelFromKey(selectedMonth)}</strong></div>
          <button onClick={() => setSelectedMonth(shiftMonthKey(selectedMonth, 1))}><ArrowRight /></button>
        </div>
        <div className={`closing-status ${closing ? "closed" : "open"}`}>
          {closing ? <CheckCircle2 /> : <ReceiptText />}
          <div><span>{closing ? "Mês fechado" : "Mês em aberto"}</span><strong>{closing ? `Última atualização: ${timestampLabel(closing.updatedAt || closing.createdAt)}` : "Ainda não existe fotografia salva"}</strong></div>
        </div>
      </div>

      <div className="stats-grid closing-stats">
        <StatCard label="Entradas" value={brl(sum.incomeActual)} hint={`Previsto: ${brl(sum.incomePlanned)}`} icon={<ArrowUpRight />} />
        <StatCard label="Despesas" value={brl(sum.expenseActual)} hint={`Previsto: ${brl(sum.expensePlanned)}`} icon={<ArrowDownRight />} />
        <StatCard label="Resultado realizado" value={brl(sum.actualBalance)} hint={`Previsto: ${brl(sum.plannedBalance)}`} icon={<CircleDollarSign />} />
        <StatCard label="Saldo atual em contas" value={brl(bankBalance)} hint={`${accounts.length} conta(s) cadastrada(s)`} icon={<WalletCards />} />
      </div>

      <div className="closing-layout">
        <section className="panel closing-main-card">
          <div className="panel-head">
            <div><span className="eyebrow">Resumo para fechamento</span><h2>{monthLabelFromKey(selectedMonth)}</h2><p>O fechamento registra uma fotografia dos números. Ele não apaga lançamentos nem impede correções posteriores.</p></div>
          </div>

          <div className="closing-comparison">
            <div><span>Receitas previstas</span><strong>{brl(sum.incomePlanned)}</strong><small>Realizado {brl(sum.incomeActual)}</small></div>
            <div><span>Despesas previstas</span><strong>{brl(sum.expensePlanned)}</strong><small>Realizado {brl(sum.expenseActual)}</small></div>
            <div><span>Resultado previsto</span><strong className={sum.plannedBalance >= 0 ? "positive-text" : "negative-text"}>{brl(sum.plannedBalance)}</strong><small>Realizado {brl(sum.actualBalance)}</small></div>
            <div><span>Pendências</span><strong>{pendingCount}</strong><small>{brl(sum.pending)} a pagar · {brl(sum.incomePending)} a receber</small></div>
          </div>

          {pendingCount > 0 && (
            <div className="closing-warning">
              <ReceiptText />
              <div><strong>Este mês ainda possui {pendingCount} lançamento(s) pendente(s).</strong><span>Você pode fechar mesmo assim. Se depois der baixa ou corrigir algum valor, use “Atualizar fechamento” para salvar uma nova fotografia.</span></div>
            </div>
          )}

          {message && <div className="success-box">{message}</div>}
          <button className="primary-btn closing-action" disabled={saving || !householdId} onClick={closeMonth}>
            {closing ? <RefreshCw /> : <CheckCircle2 />}{saving ? "Salvando..." : closing ? "Atualizar fechamento" : "Fechar este mês"}
          </button>
        </section>

        <section className="panel">
          <div className="panel-head"><div><h2>Composição das despesas</h2><p>Detalhamento por categoria, incluindo compras individuais dos cartões sem duplicar a fatura.</p></div></div>
          {categories.length ? (
            <div className="closing-category-list">
              {categories.map((item) => {
                const total = categories.reduce((sumValue, category) => sumValue + category.value, 0);
                const pct = total ? item.value / total * 100 : 0;
                return <div key={item.category}><div><span>{item.category}</span><strong>{brl(item.value)}</strong></div><div className="progress"><i style={{ width: `${pct}%` }} /></div></div>;
              })}
            </div>
          ) : <Empty text="Nenhuma despesa neste mês." />}
        </section>
      </div>

      <section className="panel closing-history">
        <div className="panel-head"><div><h2>Histórico de fechamentos</h2><p>Fotografias salvas dos meses anteriores.</p></div></div>
        {history.length ? (
          <div className="closing-history-list">
            <div className="closing-history-head"><span>Mês</span><span>Entradas reais</span><span>Despesas reais</span><span>Resultado</span><span>Saldo em contas</span></div>
            {history.map((item: MonthlyClosing) => (
              <button key={item.id} onClick={() => setSelectedMonth(item.month)} className="closing-history-row">
                <strong>{monthLabelFromKey(item.month)}</strong>
                <span>{brl(item.incomeActual)}</span>
                <span>{brl(item.expenseActual)}</span>
                <strong className={item.actualBalance >= 0 ? "positive-text" : "negative-text"}>{brl(item.actualBalance)}</strong>
                <span>{brl(item.bankBalance)}</span>
              </button>
            ))}
          </div>
        ) : <Empty text="Faça o primeiro fechamento para começar o histórico mensal." />}
      </section>
    </AppShell>
  );
}
