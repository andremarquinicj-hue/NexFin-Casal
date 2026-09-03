"use client";

import { useMemo, useState } from "react";
import { CreditCard, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import Empty from "@/components/Empty";
import { useHouseholdData } from "@/components/useHouseholdData";
import { brl, monthKey, monthLabelFromKey, parseMoney } from "@/lib/finance";
import { createCardPurchase, createItem, removeItem } from "@/lib/firestore";
import { Card, Transaction } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";

export default function Cartoes() {
  const { cards, transactions, householdId } = useHouseholdData();
  const { profile } = useAuth();
  const [openCard, setOpenCard] = useState(false);
  const [purchaseCard, setPurchaseCard] = useState<Card | null>(null);
  const [form, setForm] = useState({ name: "", bank: "", holder: "", limit: "", closingDay: "28", dueDay: "7" });

  const currentMonth = monthKey();
  const invoiceTransactions = useMemo(
    () => transactions.filter((t) => t.isCardInvoice === true && t.invoiceMonth === currentMonth && t.status !== "cancelled"),
    [transactions, currentMonth]
  );

  const currentMonthPurchases = useMemo(
    () => transactions.filter((t) => t.type === "card" && t.invoiceMonth === currentMonth && t.status !== "cancelled"),
    [transactions, currentMonth]
  );

  const spentByCard = useMemo(() => {
    const map: Record<string, number> = {};
    invoiceTransactions.forEach((t) => {
      const key = t.sourceCardId || t.cardId || "";
      map[key] = (map[key] || 0) + Number(t.amountPlanned || 0);
    });
    return map;
  }, [invoiceTransactions]);

  const activePurchasesByCard = useMemo(() => {
    const grouped: Record<string, Record<string, Transaction[]>> = {};
    transactions
      .filter((t) => t.type === "card" && t.status !== "cancelled")
      .forEach((t) => {
        const cardId = t.sourceCardId || t.cardId || "";
        if (!cardId || !t.installmentGroupId) return;
        grouped[cardId] ||= {};
        grouped[cardId][t.installmentGroupId] ||= [];
        grouped[cardId][t.installmentGroupId].push(t);
      });
    return grouped;
  }, [transactions]);

  async function saveCard(e: React.FormEvent) {
    e.preventDefault();
    await createItem(householdId, "cards", {
      ...form,
      limit: Number(form.limit.replace(",", ".")),
      closingDay: Number(form.closingDay),
      dueDay: Number(form.dueDay),
    });
    setForm({ name: "", bank: "", holder: "", limit: "", closingDay: "28", dueDay: "7" });
    setOpenCard(false);
  }

  return (
    <AppShell title="Cartões" subtitle="Cadastre compras parceladas e deixe a fatura do mês ser lançada automaticamente">
      <div className="section-actions">
        <div>
          <strong>Faturas previstas no mês</strong>
          <span>{brl(invoiceTransactions.reduce((s, t) => s + Number(t.amountPlanned || 0), 0))}</span>
        </div>
        <button className="soft-btn" onClick={() => setOpenCard(!openCard)}><Plus />Adicionar cartão</button>
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
          const invoiceValue = spentByCard[c.id] || 0;
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
                <div><small>Fatura prevista</small><strong>{brl(invoiceValue)}</strong></div>
                <div><small>Limite disponível</small><strong>{brl(Math.max(0, c.limit - invoiceValue))}</strong></div>
              </div>
              <div className="progress dark"><i style={{ width: `${Math.min(100, c.limit ? invoiceValue / c.limit * 100 : 0)}%` }} /></div>
              <small>Fecha dia {c.closingDay} · vence dia {c.dueDay}</small>
              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="soft-btn" onClick={() => setPurchaseCard(c)}><ShoppingBag />Nova compra</button>
              </div>
              <div style={{ marginTop: 12 }}>
                <small style={{ color: "#c7d2eb", display: "block", marginBottom: 6 }}>Compras parceladas ativas</small>
                {activeGroups.length ? (
                  <div className="transaction-list">
                    {activeGroups.slice(0, 3).map((group) => {
                      const first = group[0];
                      const nextPending = group.find((item) => item.status !== "cancelled" && item.status !== "paid");
                      return (
                        <div className="transaction-row" key={first.installmentGroupId} style={{ borderColor: "rgba(255,255,255,.08)" }}>
                          <div className="tx-main">
                            <strong style={{ color: "white" }}>{first.description}</strong>
                            <span>{first.installmentNumber}/{first.installmentTotal} agora · próxima {nextPending ? `${nextPending.installmentNumber}/${nextPending.installmentTotal}` : "finalizada"}</span>
                          </div>
                          <strong>{brl(first.amountPlanned)}</strong>
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
            const invoiceItems = currentMonthPurchases.filter((t) => (t.sourceCardId || t.cardId) === card.id);
            const invoiceTotal = invoiceItems.reduce((sum, item) => sum + Number(item.amountPlanned || 0), 0);
            return (
              <section className="panel" key={`invoice-${card.id}`}>
                <div className="panel-head">
                  <div>
                    <h2>Fatura de {monthLabelFromKey(currentMonth)} · {card.name}</h2>
                    <p>Cada gasto do cartão entra aqui com a respectiva parcela e o sistema já lança automaticamente a fatura do mês em Movimentações.</p>
                  </div>
                  <button className="soft-btn" onClick={() => setPurchaseCard(card)}><Plus />Adicionar compra</button>
                </div>
                {invoiceItems.length ? (
                  <div className="data-table">
                    <div className="table-head" style={{ minWidth: 700, gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
                      <span>Compra</span>
                      <span>Categoria</span>
                      <span>Parcela</span>
                      <span>Valor</span>
                    </div>
                    {invoiceItems.map((item) => (
                      <div className="table-row" key={item.id} style={{ minWidth: 700, gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
                        <div>
                          <strong>{item.description}</strong>
                          <small>Vence em {new Date(`${item.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}</small>
                        </div>
                        <span>{item.category}</span>
                        <span>{item.installmentNumber}/{item.installmentTotal}</span>
                        <strong>{brl(item.amountPlanned)}</strong>
                      </div>
                    ))}
                    <div className="table-row" style={{ minWidth: 700, gridTemplateColumns: "2fr 1fr 1fr 1fr", background: "#f8fafc", fontWeight: 800 }}>
                      <div><strong>Total da fatura</strong><small>Valor que aparecerá em Movimentações</small></div>
                      <span>—</span>
                      <span>—</span>
                      <strong>{brl(invoiceTotal)}</strong>
                    </div>
                  </div>
                ) : (
                  <Empty text="Nenhuma compra cadastrada para esta fatura ainda." />
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
    </AppShell>
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const preview = useMemo(() => {
    const total = parseMoney(form.totalAmount);
    const installments = Math.max(1, Number(form.installments || 1));
    return total > 0 ? total / installments : 0;
  }, [form.totalAmount, form.installments]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
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
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cadastrar a compra.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">Compra no cartão</span>
            <h2>{card.name}</h2>
            <p>Cadastre o valor total e o número de parcelas. O NexFin lança automaticamente a fatura do cartão em Movimentações.</p>
          </div>
          <button type="button" onClick={onClose}><X /></button>
        </div>

        <div className="form-grid">
          <label>Descrição
            <input required autoFocus value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: Mercado, tênis, farmácia..." />
          </label>
          <label>Categoria
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {[
                "Compras",
                "Mercado",
                "Lazer",
                "Casa",
                "Saúde",
                "Educação",
                "Veículo",
                "Assinaturas",
                "Outros",
              ].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>Valor total
            <input required inputMode="decimal" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} placeholder="0,00" />
          </label>
          <label>Parcelas
            <input required inputMode="numeric" value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value })} placeholder="1" />
          </label>
          <label>Data da compra
            <input type="date" required value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
          </label>
          <label>Observações
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opcional" />
          </label>
        </div>

        <div className="planned-reference">
          <span>Prévia por parcela</span>
          <strong>{brl(preview)}</strong>
        </div>
        <div className="settle-impact">
          <ShoppingBag />
          <p>Ao salvar, o NexFin criará as parcelas futuras desta compra e somará automaticamente a parcela do mês na fatura do cartão. Assim, em Movimentações aparecerá a fatura mensal pronta para pagamento.</p>
        </div>
        {error && <div className="error-box">{error}</div>}
        <button className="primary-btn wide" disabled={saving}>{saving ? "Salvando..." : "Salvar compra"}</button>
      </form>
    </div>
  );
}
