"use client";
import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Landmark, Plus, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import Empty from "@/components/Empty";
import StatCard from "@/components/StatCard";
import { useHouseholdData } from "@/components/useHouseholdData";
import { brl, monthKey, parseMoney } from "@/lib/finance";
import { createItem, removeItem } from "@/lib/firestore";

export default function Contas(){
 const {accounts,transactions,householdId}=useHouseholdData();
 const [open,setOpen]=useState(false);const [name,setName]=useState("");const [bank,setBank]=useState("");const [holder,setHolder]=useState("");const [balance,setBalance]=useState("");
 const mk=monthKey();
 const accountFlow=useMemo(()=>{const result:Record<string,{income:number;expense:number}>={};accounts.forEach(a=>result[a.id]={income:0,expense:0});transactions.filter(t=>t.paidDate?.startsWith(mk)&&t.accountId&&(t.status==="received"||t.status==="paid")).forEach(t=>{if(!result[t.accountId!])result[t.accountId!]={income:0,expense:0};const amount=t.amountActual??t.amountPlanned;if(t.type==="income")result[t.accountId!].income+=amount;else if(t.type==="expense")result[t.accountId!].expense+=amount;});return result},[accounts,transactions,mk]);
 const totalBalance=accounts.reduce((s,a)=>s+Number(a.balance||0),0);
 const totalIncome=Object.values(accountFlow).reduce((s,x)=>s+x.income,0);
 const totalExpense=Object.values(accountFlow).reduce((s,x)=>s+x.expense,0);
 async function save(e:React.FormEvent){e.preventDefault();await createItem(householdId,"accounts",{name,bank,holder,balance:parseMoney(balance)});setOpen(false);setName("");setBank("");setHolder("");setBalance("")}
 return <AppShell title="Contas bancárias" subtitle="Saldos reais atualizados pelos recebimentos e pagamentos">
  <div className="stats-grid three"><StatCard label="Saldo consolidado" value={brl(totalBalance)} hint={`${accounts.length} conta${accounts.length===1?"":"s"} cadastrada${accounts.length===1?"":"s"}`} icon={<Landmark/>}/><StatCard label="Entradas realizadas no mês" value={brl(totalIncome)} hint="Valores efetivamente recebidos" icon={<ArrowUpRight/>}/><StatCard label="Saídas realizadas no mês" value={brl(totalExpense)} hint="Valores efetivamente pagos" icon={<ArrowDownRight/>}/></div>
  <div className="section-actions"><div><strong>Contas do casal</strong><span>{brl(totalBalance)}</span></div><button className="soft-btn" onClick={()=>setOpen(!open)}><Plus/>Adicionar conta</button></div>
  {open&&<form className="inline-form panel" onSubmit={save}><label>Nome<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Conta principal"/></label><label>Banco<input required value={bank} onChange={e=>setBank(e.target.value)} placeholder="Nubank"/></label><label>Titular<input required value={holder} onChange={e=>setHolder(e.target.value)} placeholder="André"/></label><label>Saldo atual<input required inputMode="decimal" value={balance} onChange={e=>setBalance(e.target.value)} placeholder="0,00"/></label><button className="primary-btn">Salvar</button></form>}
  <div className="cards-grid">{accounts.map(a=>{const flow=accountFlow[a.id]||{income:0,expense:0};return <article className="bank-card bank-card-v13" key={a.id}><div className="bank-icon"><Landmark/></div><button className="delete-float" onClick={()=>confirm("Excluir conta? Os lançamentos vinculados não serão excluídos.")&&removeItem(householdId,"accounts",a.id)}><Trash2/></button><span>{a.bank}</span><h3>{a.name}</h3><p>{a.holder}</p><strong>{brl(a.balance)}</strong><small>Saldo atual</small><div className="account-flow"><div className="account-in"><span><ArrowUpRight/> Entradas no mês</span><strong>{brl(flow.income)}</strong></div><div className="account-out"><span><ArrowDownRight/> Saídas no mês</span><strong>{brl(flow.expense)}</strong></div></div></article>})}{!accounts.length&&<div className="panel"><Empty text="Nenhuma conta bancária cadastrada."/></div>}</div>
 </AppShell>
}
