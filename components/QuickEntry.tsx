"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useHouseholdData } from "./useHouseholdData";
import { createItem } from "@/lib/firestore";
import { addMonths, isoDate } from "@/lib/finance";
export default function QuickEntry({onClose}:{onClose:()=>void}){
 const {profile,user}=useAuth(); const {cards,accounts}=useHouseholdData();
 const [type,setType]=useState<"expense"|"income"|"card">("expense"); const [description,setDescription]=useState(""); const [amount,setAmount]=useState(""); const [category,setCategory]=useState("Casa"); const [date,setDate]=useState(isoDate(new Date())); const [mode,setMode]=useState<"single"|"monthly"|"installments">("single"); const [parts,setParts]=useState(2); const [cardId,setCardId]=useState(""); const [accountId,setAccountId]=useState(""); const [saving,setSaving]=useState(false);
 async function save(e:React.FormEvent){e.preventDefault();if(!profile?.householdId)return;setSaving(true);const value=Number(amount.replace(",",".")); const total=mode==="installments"?Math.max(2,parts):mode==="monthly"?24:1; const group=mode!=="single"?crypto.randomUUID():undefined; try{for(let i=0;i<total;i++){await createItem(profile.householdId,"transactions",{description,amountPlanned:value,type,status:"planned",category,dueDate:addMonths(date,i),recurrence:mode==="monthly"?"monthly":"none",recurrenceGroupId:mode==="monthly"?group:null,installmentGroupId:mode==="installments"?group:null,installmentNumber:mode==="installments"?i+1:null,installmentTotal:mode==="installments"?total:null,cardId:type==="card"?(cardId||null):null,accountId:type!=="card"?(accountId||null):null,createdBy:user?.uid||""});}onClose();}finally{setSaving(false)}}
 return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal" onSubmit={save} onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><h2>Novo lançamento</h2><p>Registre em poucos segundos.</p></div><button type="button" onClick={onClose}><X/></button></div>
 <div className="segmented">{[["expense","Despesa"],["income","Entrada"],["card","Cartão"]].map(([v,l])=><button type="button" key={v} className={type===v?"selected":""} onClick={()=>setType(v as typeof type)}>{l}</button>)}</div>
 <label>Descrição<input required value={description} onChange={e=>setDescription(e.target.value)} placeholder={type==="income"?"Ex.: Salário":"Ex.: Financiamento do carro"}/></label>
 <div className="form-grid"><label>Valor previsto<input required inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0,00"/></label><label>Vencimento / recebimento<input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label></div>
 <label>Categoria<select value={category} onChange={e=>setCategory(e.target.value)}>{["Casa","Mercado","Veículo","Saúde","Lazer","Educação","Assinaturas","Salário","Investimentos","Outros"].map(x=><option key={x}>{x}</option>)}</select></label>
 {type==="card"?<label>Cartão<select required value={cardId} onChange={e=>setCardId(e.target.value)}><option value="">Selecione...</option>{cards.map(c=><option key={c.id} value={c.id}>{c.name} · {c.holder}</option>)}</select></label>:<label>Conta bancária (opcional)<select value={accountId} onChange={e=>setAccountId(e.target.value)}><option value="">Não informar</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.holder}</option>)}</select></label>}
 <label>Repetição<select value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="single">Somente este lançamento</option><option value="monthly">Recorrente mensal — provisionar 24 meses</option><option value="installments">Compra/conta parcelada</option></select></label>
 {mode==="installments"&&<label>Número de parcelas<input type="number" min="2" max="120" value={parts} onChange={e=>setParts(Number(e.target.value))}/></label>}
 <button className="primary-btn wide" disabled={saving}>{saving?"Salvando...":"Salvar lançamento"}</button></form></div>
}
