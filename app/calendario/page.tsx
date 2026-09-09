"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, Clock3 } from "lucide-react";
import AppShell from "@/components/AppShell";
import SettleTransactionModal from "@/components/SettleTransactionModal";
import Empty from "@/components/Empty";
import { useHouseholdData } from "@/components/useHouseholdData";
import { brl, monthKey, monthLabelFromKey, shiftMonthKey } from "@/lib/finance";
import { Transaction } from "@/lib/types";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function statusLabel(status: Transaction["status"]) {
  if (status === "paid") return "Pago";
  if (status === "received") return "Recebido";
  if (status === "planned") return "Previsto";
  if (status === "overdue") return "Atrasado";
  return "Cancelado";
}

export default function Calendario() {
  const { transactions, accounts, householdId } = useHouseholdData();
  const [selectedMonth, setSelectedMonth] = useState(monthKey());
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [settling, setSettling] = useState<Transaction | null>(null);

  const cashflow = useMemo(
    () => transactions.filter((t) => t.type !== "card" && t.type !== "transfer" && t.status !== "cancelled" && Boolean(t.dueDate)),
    [transactions]
  );

  const monthItems = useMemo(
    () => cashflow.filter((t) => t.dueDate.startsWith(selectedMonth)),
    [cashflow, selectedMonth]
  );

  const eventsByDay = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    monthItems.forEach((t) => {
      map[t.dueDate] ||= [];
      map[t.dueDate].push(t);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => a.description.localeCompare(b.description)));
    return map;
  }, [monthItems]);

  const calendarCells = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const first = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells: Array<number | null> = Array.from({ length: first.getDay() }, () => null);
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [selectedMonth]);

  const monthIncome = monthItems.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amountPlanned || 0), 0);
  const monthExpense = monthItems.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amountPlanned || 0), 0);
  const selectedItems = eventsByDay[selectedDate] || [];

  function moveMonth(delta: number) {
    const next = shiftMonthKey(selectedMonth, delta);
    setSelectedMonth(next);
    setSelectedDate(`${next}-01`);
  }

  return (
    <AppShell title="Calendário financeiro" subtitle="Veja em quais dias o dinheiro entra e sai durante o mês">
      <div className="calendar-toolbar">
        <button onClick={() => moveMonth(-1)}><ArrowLeft /></button>
        <div><span>Mês selecionado</span><strong>{monthLabelFromKey(selectedMonth)}</strong></div>
        <button onClick={() => moveMonth(1)}><ArrowRight /></button>
      </div>

      <div className="calendar-summary">
        <div className="panel calendar-summary-card income"><span><ArrowUpRight /> Entradas previstas</span><strong>{brl(monthIncome)}</strong></div>
        <div className="panel calendar-summary-card expense"><span><ArrowDownRight /> Saídas previstas</span><strong>{brl(monthExpense)}</strong></div>
        <div className="panel calendar-summary-card"><span><CalendarDays /> Compromissos no mês</span><strong>{monthItems.length}</strong></div>
      </div>

      <div className="calendar-layout">
        <section className="panel calendar-panel">
          <div className="calendar-weekdays">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">
            {calendarCells.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} className="calendar-day empty-day" />;
              const date = `${selectedMonth}-${String(day).padStart(2, "0")}`;
              const items = eventsByDay[date] || [];
              const income = items.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amountPlanned || 0), 0);
              const expense = items.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amountPlanned || 0), 0);
              const isSelected = selectedDate === date;
              const isToday = new Date().toISOString().slice(0, 10) === date;
              return (
                <button key={date} className={`calendar-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`} onClick={() => setSelectedDate(date)}>
                  <div className="calendar-day-head"><strong>{day}</strong>{items.length > 0 && <span>{items.length}</span>}</div>
                  <div className="calendar-day-events">
                    {items.slice(0, 3).map((item) => (
                      <span key={item.id} className={item.type === "income" ? "income-event" : "expense-event"}>{item.description}</span>
                    ))}
                    {items.length > 3 && <small>+ {items.length - 3} compromissos</small>}
                  </div>
                  {(income > 0 || expense > 0) && (
                    <div className="calendar-day-totals">
                      {income > 0 && <small className="positive-text">+{brl(income)}</small>}
                      {expense > 0 && <small className="negative-text">-{brl(expense)}</small>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="panel calendar-detail">
          <div className="panel-head">
            <div><span className="eyebrow">Dia selecionado</span><h2>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</h2><p>Pagamentos e recebimentos previstos para este dia.</p></div>
          </div>
          {selectedItems.length ? (
            <div className="calendar-detail-list">
              {selectedItems.map((item) => (
                <div className="calendar-detail-item" key={item.id}>
                  <div className={`calendar-event-icon ${item.type}`}>{item.type === "income" ? <ArrowUpRight /> : <ArrowDownRight />}</div>
                  <div className="tx-main"><strong>{item.description}</strong><span>{item.category}{item.installmentTotal ? ` · ${item.installmentNumber}/${item.installmentTotal}` : ""}</span><small className={`status ${item.status}`}>{statusLabel(item.status)}</small></div>
                  <strong>{brl(item.amountActual ?? item.amountPlanned)}</strong>
                  {item.status === "planned" && <button className="quick-settle-btn compact" onClick={() => setSettling(item)} title={item.type === "income" ? "Registrar recebimento" : "Registrar pagamento"}><CheckCircle2/><span>{item.type === "income" ? "Receber" : "Pagar"}</span></button>}
                </div>
              ))}
            </div>
          ) : <Empty text="Nenhum compromisso neste dia." />}
          <div className="calendar-legend">
            <div><Clock3 /><span>Previsto</span></div><div><CheckCircle2 /><span>Pago/recebido</span></div>
          </div>
        </aside>
      </div>
      {settling && <SettleTransactionModal tx={settling} accounts={accounts} householdId={householdId} onClose={() => setSettling(null)} />}
    </AppShell>
  );
}
