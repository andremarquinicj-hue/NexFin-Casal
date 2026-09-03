"use client";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { listenCollection } from "@/lib/firestore";
import { Account, Card, Goal, Transaction } from "@/lib/types";
export function useHouseholdData(){
 const {profile}=useAuth(); const [transactions,setTransactions]=useState<Transaction[]>([]); const [accounts,setAccounts]=useState<Account[]>([]); const [cards,setCards]=useState<Card[]>([]); const [goals,setGoals]=useState<Goal[]>([]); const [loading,setLoading]=useState(true);
 useEffect(()=>{ if(!profile?.householdId){setLoading(false);return;} setLoading(true); const unsubs=[listenCollection<Transaction>(profile.householdId,"transactions",setTransactions),listenCollection<Account>(profile.householdId,"accounts",setAccounts),listenCollection<Card>(profile.householdId,"cards",setCards),listenCollection<Goal>(profile.householdId,"goals",setGoals)]; const t=setTimeout(()=>setLoading(false),350); return()=>{clearTimeout(t);unsubs.forEach(u=>u());};},[profile?.householdId]);
 return {transactions,accounts,cards,goals,loading,householdId:profile?.householdId||""};
}
