"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarRange, CheckCircle2, CreditCard, Pencil, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import Empty from "@/components/Empty";
import { useHouseholdData } from "@/components/useHouseholdData";
import { brl, cardInvoiceSchedule, monthKey, monthLabelFromKey, parseMoney, shiftMonthKey } from "@/lib/finance";
import { createCardPurchase, createItem, removeCardPurchaseGroup, removeItem, updateCardSettings } from "@/lib/firestore";
import { Card, Transaction } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";

export default function Cartoes() {
  const { cards, transactions, householdId } = useHouseholdData();
  const { profile } = useAuth();
  const [openCard, setOpenCard] = useState(false);
  const [purchaseCard, setPurchaseCard] = useState<Card | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [futureCard, setFutureCard] = useState<Card | null>(null);
  const [selectedInvoiceMonth, setSelectedInvoiceMonth] = useState(monthKey());
  const [form, setForm] = useState({ name: "", bank: "", holder: "", limit: "", closingDay: "28", dueDay: "7" });

  const currentMonth = monthKey();
  const allInvoiceTransactions = useMemo(
    () => transactions.filter((t) => t.isCardInvoice === true && t.status !== "cancelled"),
    [transactions]
  );
  const allCardPurchases = useMemo(
    () => transactions.filter((t) => t.type === "card" && t.status !== "cancelled"),
    [transactions]
  );

  const selectedInvoiceTransactions = useMemo(
    () => allInvoiceTransactions.filter((t) => t.invoiceMonth === selectedInvoiceMonth),
    [allInvoiceTransactions, selectedInvoiceMonth]
  );
  const selectedMonthPurchases = useMemo(
    () => allCardPurchases.filter((t) => t.invoiceMonth === selectedInvoiceMonth),
    [allCardPurchases, selectedInvoiceMonth]
  );

  const invoiceByCardMonth = useMemo(() => {
    const map: Record<string, Transaction> = {};
    allInvoiceTransactions.forEach((t) => {
      const cardId = t.sourceCardId || t.cardId || "";
      if (!cardId || !t.invoiceMonth) return;
      map[`${cardId}:${t.invoiceMonth}`] = t;
    });
    return map;
  }, [allInvoiceTransactions]);

  const invoiceAmountByCardMonth = useMemo(() => {
    const map: Record<string, number> = {};
    allInvoiceTransactions.forEach((t) => {
      const cardId = t.sourceCardId || t.cardId || "";
      if (!cardId || !t.invoiceMonth) return;
      map[`${cardId}:${t.invoiceMonth}`] = Number(t.amountPlanned || 0);
    });
    return map;
  }, [allInvoiceTransactions]);

  const committedByCard = useMemo(() => {
    const map: Record<string, number> = {};
    allCardPurchases.forEach((t) => {
      const cardId = t.sourceCardId || t.cardId || "";
      if (!cardId || !t.invoiceMonth) return;
      const invoice = invoiceByCardMonth[`${cardId}:${t.invoiceMonth}`];
      // A compra compromete o limite enquanto a fatura correspondente ainda não foi paga.
      if (invoice?.status === "paid" || invoice?.status === "cancelled") return;
      map[cardId] = (map[cardId] || 0) + Number(t.amountPlanned || 0);
    });
    return map;
  }, [allCardPurchases, invoiceByCardMonth]);

  const openInvoiceMonthsByCard = useMemo(() => {
    const map: Record<string, string[]> = {};
    allInvoiceTransactions.forEach((t) => {
      const cardId = t.sourceCardId || t.cardId || "";
      if (!cardId || !t.invoiceMonth || t.status === "paid" || t.status === "cancelled") return;
      map[cardId] ||= [];
      if (!map[cardId].includes(t.invoiceMonth)) map[cardId].push(t.invoiceMonth);
    });
    Object.values(map).forEach((months) => months.sort());
    return map;
  }, [allInvoiceTransactions]);

  const activePurchasesByCard = useMemo(() => {
    const grouped: Record<string, Record<string, Transaction[]>> = {};
    allCardPurchases.forEach((t) => {
      const cardId = t.sourceCardId || t.cardId || "";
      if (!cardId || !t.installmentGroupId) return;
      grouped[cardId] ||= {};
      grouped[cardId][t.installmentGroupId] ||= [];
      grouped[cardId][t.installmentGroupId].push(t);
    });
    return grouped;
  }, [allCardPurchases]);

  async function saveCard(e: React.FormEvent) {
    e.preventDefault();
    await createItem(householdId, "cards", {
      ...form,
      limit: parseMoney(form.limit),
      closingDay: Number(form.closingDay),
      dueDay: Number(form.dueDay),
    });
    setForm({ name: "", bank: "", holder: "", limit: "", closingDay: "28", dueDay: "7" });
    setOpenCard(false);
  }

  const selectedMonthTotal = selectedInvoiceTransactions.reduce((s, t) => s + Number(t.amountPlanned || 0), 0);

  return (
    <AppShell title="Cartões" subtitle="Faturas atuais e futuras, compras parceladas e limite comprometido em um só lugar">
      <div className="section-actions">
        <div>
          <strong>Faturas de {monthLabelFromKey(selectedInvoiceMonth)}</strong>
          <span>{brl(selectedMonthTotal)}</span>
        </div>
        <button className="soft-btn" onClick={() => setOpenCard(!openCard)}><Plus />Adicionar cartão</button>
      </div>

      <div className="month-toolbar" style={{ marginBottom: 18 }}>
        <button type="button" onClick={() => setSelectedInvoiceMonth(shiftMonthKey(selectedInvoiceMonth, -1))}><ArrowLeft /></button>
        <div><span>Fatura visualizada</span><strong>{monthLabelFromKey(selectedInvoiceMonth)}</strong></div>
        <button type="button" onClick={() => setSelectedInvoiceMonth(shiftMonthKey(selectedInvoiceMonth, 1))}><ArrowRight /></button>
      </div>

      {openCard && (
        <form className="inline-form panel" onSubmit={saveCard}>
          {([
            ["name", "Nome do cartão"],
            ["bank", "Banco"],
            ["holder", "Titular"],
            ["limit", "Limite"],
            ["closingDay", "Dia fechamento"],
            ["dueDay", "Dia vencimento"],
          ] as const).map(([k, l]) => (
            <label key={k}>{l}<input required value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>
          ))}
          <button className="primary-btn">Salvar</button>
        </form>
      )}

      <div className="cards-grid">
        {cards.map((c) => {
          const selectedInvoiceValue = invoiceAmountByCardMonth[`${c.id}:${selectedInvoiceMonth}`] || 0;
          const committedValue = committedByCard[c.id] || 0;
          const availableLimit = Math.max(0, Number(c.limit || 0) - committedValue);
          const openMonths = openInvoiceMonthsByCard[c.id] || [];
          const nextOpenMonth = openMonths.find((key) => key >= currentMonth) || openMonths[0] || "";
          const nextOpenValue = nextOpenMonth ? (invoiceAmountByCardMonth[`${c.id}:${nextOpenMonth}`] || 0) : 0;
          const followingMonth = shiftMonthKey(selectedInvoiceMonth, 1);
          const followingValue = invoiceAmountByCardMonth[`${c.id}:${followingMonth}`] || 0;
          const grouped = Object.values(activePurchasesByCard[c.id] || {});
          const activeGroups = grouped
            .map((group) => [...group].sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0)))
            .sort((a, b) => a[0].description.localeCompare(b[0].description));

          return (
            <article className="credit-card-ui" key={c.id}>
              <button className="delete-float" onClick={() => confirm("Excluir cartão?") && removeItem(householdId, "cards", c.id)}><Trash2 /></button>
              <div className="cc-top"><CreditCard /><span>{c.bank}</span></div>
              <h3>{c.name}</h3>
              <p>{c.holder}</p>
              <div className="limit-row">
                <div><small>Fatura de {monthLabelFromKey(selectedInvoiceMonth)}</small><strong>{brl(selectedInvoiceValue)}</strong></div>
                <div><small>Limite disponível</small><strong>{brl(availableLimit)}</strong></div>
              </div>
              <div className="progress dark"><i style={{ width: `${Math.min(100, c.limit ? committedValue / c.limit * 100 : 0)}%` }} /></div>
              <div className="card-limit-summary">
                <span>Limite comprometido: <b>{brl(committedValue)}</b></span>
                {nextOpenMonth && <span>Próxima em aberto: <b>{monthLabelFromKey(nextOpenMonth)} · {brl(nextOpenValue)}</b></span>}
                {followingValue > 0 && followingMonth !== nextOpenMonth && <span>Fatura seguinte: <b>{monthLabelFromKey(followingMonth)} · {brl(followingValue)}</b></span>}
              </div>
              <small>Fecha dia {c.closingDay} · vence dia {c.dueDay}</small>
              <div className="card-actions-v18">
                <button type="button" className="soft-btn" onClick={() => setPurchaseCard(c)}><ShoppingBag />Nova compra</button>
                <button type="button" className="soft-btn" onClick={() => setFutureCard(c)}><CalendarRange />Próximas faturas</button>
                <button type="button" className="soft-btn" onClick={() => setEditingCard(c)}><Pencil />Editar cartão</button>
              </div>
              <div style={{ marginTop: 12 }}>
                <small style={{ color: "#c7d2eb", display: "block", marginBottom: 6 }}>Compras parceladas ativas</small>
                {activeGroups.length ? (
                  <div className="transaction-list">
                    {activeGroups.slice(0, 3).map((group) => {
                      const first = group[0];
                      const nextPending = group.find((item) => {
                        if (!item.invoiceMonth) return true;
                        const invoice = invoiceByCardMonth[`${c.id}:${item.invoiceMonth}`];
                        return invoice?.status !== "paid" && invoice?.status !== "cancelled";
                      });
                      return (
                        <div className="transaction-row" key={first.installmentGroupId} style={{ borderColor: "rgba(255,255,255,.08)" }}>
                          <div className="tx-main">
                            <strong style={{ color: "white" }}>{first.description}</strong>
                            <span>{nextPending ? `${nextPending.installmentNumber}/${nextPending.installmentTotal} · ${monthLabelFromKey(nextPending.invoiceMonth || currentMonth)}` : "Compra finalizada"}</span>
                          </div>
                          <strong>{brl(nextPending?.amountPlanned || first.amountPlanned)}</strong>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <small style={{ color: "#afbad6" }}>Nenhuma compra lançada ainda.</small>
                )}
              </div>
            </article>
          );
        })}
        {!cards.length && <div className="panel"><Empty text="Nenhum cartão cadastrado." /></div>}
      </div>

      {cards.length > 0 && (
        <div style={{ marginTop: 18, display: "grid", gap: 18 }}>
          {cards.map((card) => {
            const invoiceItems = selectedMonthPurchases.filter((t) => (t.sourceCardId || t.cardId) === card.id);
            const invoiceTotal = invoiceItems.reduce((sum, item) => sum + Number(item.amountPlanned || 0), 0);
            return (
              <section className="panel" key={`invoice-${card.id}-${selectedInvoiceMonth}`}>
                <div className="panel-head">
                  <div>
                    <h2>Fatura de {monthLabelFromKey(selectedInvoiceMonth)} · {card.name}</h2>
                    <p>Use as setas acima para consultar setembro, outubro e os próximos meses. As compras futuras também entram no cálculo do limite disponível.</p>
                  </div>
                  <button className="soft-btn" onClick={() => setPurchaseCard(card)}><Plus />Adicionar compra</button>
                </div>
                {invoiceItems.length ? (
                  <div className="data-table">
                    <div className="table-head" style={{ minWidth: 760, gridTemplateColumns: "2fr 1fr 1fr 1fr 60px" }}>
                      <span>Compra</span>
                      <span>Categoria</span>
                      <span>Parcela</span>
                      <span>Valor</span>
                      <span></span>
                    </div>
                    {invoiceItems.map((item) => (
                      <div className="table-row" key={item.id} style={{ minWidth: 760, gridTemplateColumns: "2fr 1fr 1fr 1fr 60px" }}>
                        <div>
                          <strong>{item.description}</strong>
                          <small>Vence em {new Date(`${item.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}</small>
                        </div>
                        <span>{item.category}</span>
                        <span>{item.installmentNumber}/{item.installmentTotal}</span>
                        <strong>{brl(item.amountPlanned)}</strong>
                        <button
                          type="button"
                          className="invoice-delete-btn"
                          title="Excluir compra e parcelas futuras"
                          onClick={async()=>{
                            if(!item.installmentGroupId) return;
                            if(confirm(`Excluir ${item.description} e todas as parcelas desta compra?`)) await removeCardPurchaseGroup(householdId,item.installmentGroupId);
                          }}
                        ><Trash2/></button>
                      </div>
                    ))}
                    <div className="table-row" style={{ minWidth: 760, gridTemplateColumns: "2fr 1fr 1fr 1fr 60px", background: "#f8fafc", fontWeight: 800 }}>
                      <div><strong>Total da fatura</strong><small>Valor que aparecerá em Movimentações</small></div>
                      <span>—</span>
                      <span>—</span>
                      <strong>{brl(invoiceTotal)}</strong>
                      <span></span>
                    </div>
                  </div>
                ) : (
                  <Empty text={`Nenhuma compra cadastrada para a fatura de ${monthLabelFromKey(selectedInvoiceMonth)}.`} />
                )}
              </section>
            );
          })}
        </div>
      )}

      {purchaseCard && (
        <PurchaseModal
          card={purchaseCard}
          householdId={householdId}
          createdBy={profile?.uid || ""}
          onClose={() => setPurchaseCard(null)}
        />
      )}

      {editingCard && (
        <EditCardModal
          card={editingCard}
          householdId={householdId}
          committedValue={committedByCard[editingCard.id] || 0}
          onClose={() => setEditingCard(null)}
        />
      )}

      {futureCard && (
        <FutureInvoicesModal
          card={futureCard}
          purchases={allCardPurchases}
          invoices={allInvoiceTransactions}
          currentMonth={currentMonth}
          onOpenMonth={(key) => { setSelectedInvoiceMonth(key); setFutureCard(null); }}
          onClose={() => setFutureCard(null)}
        />
      )}
    </AppShell>
  );
}

function EditCardModal({ card, householdId, committedValue, onClose }: { card: Card; householdId: string; committedValue: number; onClose: () => void; }) {
  const [form, setForm] = useState({
    limit: String(card.limit || 0).replace(".", ","),
    closingDay: String(card.closingDay || 28),
    dueDay: String(card.dueDay || 7),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const newLimit = parseMoney(form.limit);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newLimit < 0) { setError("Informe um limite válido."); return; }
    setSaving(true);
    setError("");
    try {
      await updateCardSettings(householdId, card.id, {
        limit: form.limit,
        closingDay: form.closingDay,
        dueDay: form.dueDay,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o cartão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">Configurações do cartão</span>
            <h2>{card.name}</h2>
            <p>Atualize limite, fechamento e vencimento sem precisar excluir o cartão.</p>
          </div>
          <button type="button" onClick={onClose}><X /></button>
        </div>

        <div className="form-grid">
          <label>Limite total
            <input required inputMode="decimal" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} />
          </label>
          <label>Dia de fechamento
            <input required type="number" min="1" max="31" value={form.closingDay} onChange={(e) => setForm({ ...form, closingDay: e.target.value })} />
          </label>
          <label>Dia de vencimento
            <input required type="number" min="1" max="31" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} />
          </label>
          <div className="card-edit-summary">
            <span>Comprometido atualmente</span>
            <strong>{brl(committedValue)}</strong>
            <small>Disponível após alteração: {brl(Math.max(0, newLimit - committedValue))}</small>
          </div>
        </div>

        <div className="notice">
          O novo <b>dia de vencimento</b> será aplicado às faturas abertas já provisionadas. O novo <b>dia de fechamento</b> passa a valer para compras lançadas daqui para frente, sem mover compras antigas de uma fatura para outra.
        </div>
        {error && <div className="error-box">{error}</div>}
        <button className="primary-btn wide" disabled={saving}>{saving ? "Atualizando..." : "Salvar alterações"}</button>
      </form>
    </div>
  );
}

function FutureInvoicesModal({ card, purchases, invoices, currentMonth, onOpenMonth, onClose }: { card: Card; purchases: Transaction[]; invoices: Transaction[]; currentMonth: string; onOpenMonth: (key: string) => void; onClose: () => void; }) {
  const cardPurchases = useMemo(
    () => purchases.filter((t) => (t.sourceCardId || t.cardId) === card.id && Boolean(t.invoiceMonth) && (t.invoiceMonth || "") >= currentMonth),
    [purchases, card.id, currentMonth]
  );
  const cardInvoices = useMemo(
    () => invoices.filter((t) => (t.sourceCardId || t.cardId) === card.id && Boolean(t.invoiceMonth)),
    [invoices, card.id]
  );
  const months = useMemo(() => {
    const keys = Array.from(new Set(cardPurchases.map((t) => t.invoiceMonth || "").filter(Boolean))).sort();
    return keys.slice(0, 12);
  }, [cardPurchases]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal future-invoices-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">Próximos meses</span>
            <h2>Faturas futuras · {card.name}</h2>
            <p>Veja quais despesas já estão comprometidas em cada fatura antes do vencimento.</p>
          </div>
          <button type="button" onClick={onClose}><X /></button>
        </div>

        {months.length ? (
          <div className="future-invoice-list">
            {months.map((key) => {
              const items = cardPurchases.filter((t) => t.invoiceMonth === key).sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0));
              const invoice = cardInvoices.find((t) => t.invoiceMonth === key);
              const total = items.reduce((sum, item) => sum + Number(item.amountPlanned || 0), 0);
              const dueDate = invoice?.dueDate || cardInvoiceSchedule(card, `${key}-01`, key).dueDate;
              return (
                <section className="future-invoice-month" key={key}>
                  <div className="future-invoice-head">
                    <div>
                      <span>{monthLabelFromKey(key)}</span>
                      <strong>{brl(total)}</strong>
                      <small>Vencimento {new Date(`${dueDate}T12:00:00`).toLocaleDateString("pt-BR")}</small>
                    </div>
                    <button type="button" className="soft-btn" onClick={() => onOpenMonth(key)}>Abrir fatura</button>
                  </div>
                  <div className="future-invoice-items">
                    {items.map((item) => (
                      <div key={item.id}>
                        <div>
                          <strong>{item.description}</strong>
                          <small>{item.category} · parcela {item.installmentNumber}/{item.installmentTotal}</small>
                        </div>
                        <strong>{brl(item.amountPlanned)}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <Empty text="Nenhuma despesa já provisionada nas próximas faturas deste cartão." />
        )}
      </div>
    </div>
  );
}

function PurchaseModal({ card, householdId, createdBy, onClose }: { card: Card; householdId: string; createdBy: string; onClose: () => void; }) {
  const [form, setForm] = useState({
    description: "",
    totalAmount: "",
    installments: "1",
    purchaseDate: new Date().toISOString().slice(0, 10),
    category: "Compras",
    notes: "",
  });
  const [invoiceMonthOverride, setInvoiceMonthOverride] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const installmentPreview = useMemo(() => {
    const total = parseMoney(form.totalAmount);
    const installments = Math.max(1, Number(form.installments || 1));
    return total > 0 ? total / installments : 0;
  }, [form.totalAmount, form.installments]);

  const autoSchedule = useMemo(() => cardInvoiceSchedule(card, form.purchaseDate), [card, form.purchaseDate]);
  const schedule = useMemo(
    () => cardInvoiceSchedule(card, form.purchaseDate, invoiceMonthOverride || undefined),
    [card, form.purchaseDate, invoiceMonthOverride]
  );
  const invoiceOptions = useMemo(() => {
    const base = autoSchedule.invoiceMonth;
    return [0, 1, 2].map((offset) => shiftMonthKey(base, offset));
  }, [autoSchedule.invoiceMonth]);

  useEffect(() => setReviewing(false), [form.description, form.totalAmount, form.installments, form.purchaseDate, form.category, form.notes, invoiceMonthOverride]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const total = parseMoney(form.totalAmount);
    if (total <= 0) { setError("Informe o valor total da compra."); return; }
    if (!reviewing) { setReviewing(true); return; }

    setSaving(true);
    try {
      await createCardPurchase(householdId, {
        cardId: card.id,
        description: form.description,
        totalAmount: form.totalAmount,
        installments: form.installments,
        purchaseDate: form.purchaseDate,
        category: form.category,
        notes: form.notes,
        createdBy,
        firstInvoiceMonth: schedule.invoiceMonth,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cadastrar a compra.");
    } finally {
      setSaving(false);
    }
  }

  const dueLabel = new Date(`${schedule.dueDate}T12:00:00`).toLocaleDateString("pt-BR");
  const closingLabel = new Date(`${schedule.closingDate}T12:00:00`).toLocaleDateString("pt-BR");

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">Compra no cartão</span>
            <h2>{card.name}</h2>
            <p>O NexFin calcula a fatura pela data da compra, fechamento e vencimento do cartão. Antes de gravar, você confirma o mês.</p>
          </div>
          <button type="button" onClick={onClose}><X /></button>
        </div>

        <div className="form-grid">
          <label>Descrição
            <input required autoFocus value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: Mercado, tênis, farmácia..." />
          </label>
          <label>Categoria
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {["Compras","Mercado","Lazer","Casa","Saúde","Educação","Veículo","Assinaturas","Outros"].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>Valor total
            <input required inputMode="decimal" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} placeholder="0,00" />
          </label>
          <label>Parcelas
            <input required inputMode="numeric" min="1" max="120" type="number" value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value })} />
          </label>
          <label>Data da compra
            <input type="date" required value={form.purchaseDate} onChange={(e) => { setForm({ ...form, purchaseDate: e.target.value }); setInvoiceMonthOverride(""); }} />
          </label>
          <label>Observações
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opcional" />
          </label>
        </div>

        <div className="card-invoice-preview">
          <div>
            <span>Fatura calculada</span>
            <strong>{schedule.invoiceLabel}</strong>
            <small>Fecha em {closingLabel} · vence em {dueLabel}</small>
          </div>
          <div>
            <span>Parcela estimada</span>
            <strong>{brl(installmentPreview)}</strong>
            <small>{Math.max(1, Number(form.installments || 1))}x</small>
          </div>
        </div>

        <label>Em qual fatura a 1ª parcela virá?
          <select value={invoiceMonthOverride || autoSchedule.invoiceMonth} onChange={(e) => setInvoiceMonthOverride(e.target.value)}>
            {invoiceOptions.map((key) => <option key={key} value={key}>{monthLabelFromKey(key)}</option>)}
          </select>
          <small className="field-help">O NexFin já sugere automaticamente. Se o app do banco mostrar outra fatura — especialmente no dia do fechamento — você pode ajustar antes de confirmar.</small>
        </label>

        {schedule.onClosingDay && invoiceMonthOverride === "" && (
          <div className="warning-box">Esta compra foi informada no mesmo dia do fechamento. A operadora pode jogar a compra para esta fatura ou para a próxima conforme o horário de processamento. Confirme no aplicativo do cartão.</div>
        )}

        {reviewing ? (
          <div className="invoice-confirm-box">
            <CheckCircle2 />
            <div>
              <strong>Confirme antes de lançar</strong>
              <p>Esta compra entrará na fatura de <b>{schedule.invoiceLabel}</b>, com vencimento em <b>{dueLabel}</b>. {Number(form.installments || 1) > 1 ? `As próximas ${Math.max(0, Number(form.installments || 1) - 1)} parcelas serão lançadas nas faturas seguintes.` : "É uma compra em 1x."}</p>
            </div>
          </div>
        ) : (
          <div className="notice">Confira o mês da fatura acima. Ao continuar, o NexFin mostrará uma confirmação final antes de gravar.</div>
        )}

        {error && <div className="error-box">{error}</div>}
        <button className="primary-btn wide" disabled={saving}>{saving ? "Salvando..." : reviewing ? `Confirmar na fatura de ${schedule.invoiceLabel}` : "Revisar fatura antes de salvar"}</button>
      </form>
    </div>
  );
}
