"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Trash2, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import Empty from "@/components/Empty";
import StatCard from "@/components/StatCard";
import { useHouseholdData } from "@/components/useHouseholdData";
import { brl, isoDate, monthKey, monthLabelFromKey, parseMoney, shiftMonthKey, summarize } from "@/lib/finance";
import { removeFinancialTransaction, settleFinancialTransaction } from "@/lib/firestore";
import { Transaction } from "@/lib/types";

export default function Mov(){
 const {transactions,accounts,householdId}=useHouseholdData();
 const [filter,setFilter]=useState("all");
 const [selectedMonth,setSelectedMonth]=useState(monthKey());
 const [settling,setSettling]=useState<Transaction|null>(null);
 const items=useMemo(()=>transactions.filter(t=>{
   if(!t.dueDate?.startsWith(selectedMonth) || t.type==="card") return false;
   if(filter==="all") return true;
   if(filter==="card") return t.isCardInvoice===true;
   return t.type===filter;
 }).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)),[transactions,filter,selectedMonth]);
 const monthItems=useMemo(()=>transactions.filter(t=>t.dueDate?.startsWith(selectedMonth)&&t.type!=="card"),[transactions,selectedMonth]);
 const sum=summarize(monthItems);
 return <AppShell title="Movimentações" subtitle="Planejado e realizado, sem misturar as duas etapas">
  <div className="month-toolbar"><button onClick={()=>setSelectedMonth(shiftMonthKey(selectedMonth,-1))}><ArrowLeft/></button><div><span>Mês selecionado</span><strong>{monthLabelFromKey(selectedMonth)}</strong></div><button onClick={()=>setSelectedMonth(shiftMonthKey(selectedMonth,1))}><ArrowRight/></button></div>
  <div className="stats-grid movements-stats"><StatCard label="Entradas previstas" value={brl(sum.incomePlanned)} hint={`${brl(sum.incomeActual)} recebido`} /><StatCard label="Despesas previstas" value={brl(sum.expensePlanned)} hint={`${brl(sum.expenseActual)} pago`} /><StatCard label="Saldo previsto" value={brl(sum.plannedBalance)} hint={`Realizado: ${brl(sum.actualBalance)}`} /><StatCard label="Ainda a pagar" value={brl(sum.pending)} hint={`${brl(sum.incomePending)} ainda a receber`} /></div>
  <div className="filter-tabs">{[["all","Todos"],["income","Entradas"],["expense","Despesas"],["card","Faturas de cartão"]].map(([v,l])=><button key={v} onClick={()=>setFilter(v)} className={filter===v?"active":""}>{l}</button>)}</div>
  <section className="panel table-panel">{items.length?<div className="data-table"><div className="table-head"><span>Descrição</span><span>Vencimento</span><span>Status</span><span>Previsto</span><span>Realizado</span><span>Ações</span></div>{items.map(t=><div className="table-row" key={t.id}><div><strong>{t.description}</strong><small>{t.category}{t.installmentTotal?` · ${t.installmentNumber}/${t.installmentTotal}`:""}</small></div><span>{new Date(t.dueDate+"T12:00").toLocaleDateString("pt-BR")}</span><span className={`status ${t.status}`}>{t.status==="planned"?"Previsto":t.status==="paid"?"Pago":t.status==="received"?"Recebido":t.status}</span><strong>{brl(t.amountPlanned)}</strong><div className="actual-cell"><strong>{t.amountActual!=null?brl(t.amountActual):"—"}</strong>{t.paidDate&&<small>{new Date(t.paidDate+"T12:00").toLocaleDateString("pt-BR")}</small>}</div><div className="row-actions">{t.status==="planned"&&<button className="settle-action" title={t.type==="income"?"Registrar recebimento":"Registrar pagamento"} onClick={()=>setSettling(t)}><CheckCircle2/></button>}<button title="Excluir" onClick={()=>confirm("Excluir este lançamento?")&&removeFinancialTransaction(householdId,t.id)}><Trash2/></button></div></div>)}</div>:<Empty text="Nenhum lançamento neste mês."/>}</section>
  {settling&&<SettleModal tx={settling} accounts={accounts} householdId={householdId} onClose={()=>setSettling(null)}/>} 
 </AppShell>
}

function SettleModal({tx,accounts,householdId,onClose}:{tx:Transaction;accounts:{id:string;name:string;holder:string}[];householdId:string;onClose:()=>void}){
 const [actual,setActual]=useState(String(tx.amountPlanned).replace(".",","));
 const [date,setDate]=useState(isoDate(new Date()));
 const [accountId,setAccountId]=useState(tx.accountId||"");
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const isBank=tx.type==="income"||tx.type==="expense";
 async function submit(e:React.FormEvent){e.preventDefault();const value=parseMoney(actual);if(value<=0){setError("Informe o valor realizado.");return;}if(isBank&&!accountId){setError("Selecione a conta bancária.");return;}setSaving(true);setError("");try{await settleFinancialTransaction(householdId,tx.id,{actualAmount:value,actualDate:date,accountId});onClose();}catch(err){setError(err instanceof Error?err.message:"Não foi possível registrar o realizado.");}finally{setSaving(false)}}
 return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal settle-modal" onSubmit={submit} onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">Registrar realizado</span><h2>{tx.type==="income"?"Confirmar recebimento":"Confirmar pagamento"}</h2><p>{tx.description}</p></div><button type="button" onClick={onClose}><X/></button></div><div className="planned-reference"><span>Valor provisionado</span><strong>{brl(tx.amountPlanned)}</strong></div><div className="form-grid"><label>Valor realizado<input autoFocus required inputMode="decimal" value={actual} onChange={e=>setActual(e.target.value)}/></label><label>Data<input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label></div>{isBank&&<label>Conta bancária<select required value={accountId} onChange={e=>setAccountId(e.target.value)}><option value="">Selecione...</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.holder}</option>)}</select></label>}<div className="settle-impact"><CheckCircle2/><p>{isBank?`Ao confirmar, ${tx.type==="income"?"o valor será somado":"o valor será descontado"} do saldo da conta selecionada e o Dashboard será atualizado automaticamente.`:"A compra será marcada como realizada e passará a compor os valores reais do Dashboard."}</p></div>{error&&<div className="error-box">{error}</div>}<button className="primary-btn wide" disabled={saving}>{saving?"Atualizando...":"Confirmar realizado"}</button></form></div>
}
