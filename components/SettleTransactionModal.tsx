"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { brl, isoDate, parseMoney } from "@/lib/finance";
import { settleFinancialTransaction } from "@/lib/firestore";
import { Transaction } from "@/lib/types";

export default function SettleTransactionModal({
  tx,
  accounts,
  householdId,
  onClose,
}:{
  tx:Transaction;
  accounts:{id:string;name:string;holder:string}[];
  householdId:string;
  onClose:()=>void;
}){
  const [actual,setActual]=useState(String(tx.amountPlanned).replace(".",","));
  const [date,setDate]=useState(isoDate(new Date()));
  const [accountId,setAccountId]=useState(tx.accountId||"");
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const isBank=tx.type==="income"||tx.type==="expense";

  async function submit(e:React.FormEvent){
    e.preventDefault();
    const value=parseMoney(actual);
    if(value<=0){setError("Informe o valor realizado.");return;}
    if(isBank&&!accountId){setError("Selecione a conta bancária.");return;}
    setSaving(true);setError("");
    try{
      await settleFinancialTransaction(householdId,tx.id,{actualAmount:value,actualDate:date,accountId});
      onClose();
    }catch(err){
      setError(err instanceof Error?err.message:"Não foi possível registrar o realizado.");
    }finally{setSaving(false)}
  }

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <form className="modal settle-modal" onSubmit={submit} onMouseDown={e=>e.stopPropagation()}>
      <div className="modal-head"><div><span className="eyebrow">Registrar realizado</span><h2>{tx.type==="income"?"Confirmar recebimento":"Confirmar pagamento"}</h2><p>{tx.description}</p></div><button type="button" onClick={onClose}><X/></button></div>
      <div className="planned-reference"><span>Valor provisionado</span><strong>{brl(tx.amountPlanned)}</strong></div>
      <div className="form-grid"><label>Valor realizado<input autoFocus required inputMode="decimal" value={actual} onChange={e=>setActual(e.target.value)}/></label><label>Data<input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label></div>
      {isBank&&<label>Conta bancária<select required value={accountId} onChange={e=>setAccountId(e.target.value)}><option value="">Selecione...</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.holder}</option>)}</select></label>}
      <div className="settle-impact"><CheckCircle2/><p>{isBank?`Ao confirmar, ${tx.type==="income"?"o valor será somado":"o valor será descontado"} do saldo da conta selecionada e o Dashboard será atualizado automaticamente.`:"O lançamento será marcado como realizado."}</p></div>
      {error&&<div className="error-box">{error}</div>}
      <button className="primary-btn wide" disabled={saving}>{saving?"Atualizando...":"Confirmar realizado"}</button>
    </form>
  </div>;
}
