"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, ArrowLeftRight, Landmark, CreditCard, CalendarRange, PiggyBank, Lightbulb, Settings, LogOut, Plus, Menu, X, WalletCards } from "lucide-react";
import { useAuth } from "./AuthProvider";
import QuickEntry from "./QuickEntry";
const nav=[["/dashboard","Visão geral",LayoutDashboard],["/movimentacoes","Movimentações",ArrowLeftRight],["/contas","Contas",Landmark],["/cartoes","Cartões",CreditCard],["/planejamento","Planejamento",CalendarRange],["/metas","Caixinhas",PiggyBank],["/insights","Economizar",Lightbulb],["/configuracoes","Configurações",Settings]] as const;
export default function AppShell({children,title,subtitle}:{children:React.ReactNode;title:string;subtitle?:string}){
 const {user,profile,loading,signOut}=useAuth(); const router=useRouter(); const path=usePathname(); const [quick,setQuick]=useState(false); const [mobile,setMobile]=useState(false);
 useEffect(()=>{if(!loading&&!user)router.replace("/login")},[loading,user,router]);
 if(loading||!user) return <main className="center-screen"><div className="spinner"/></main>;
 return <div className="app-shell">
   <aside className={`sidebar ${mobile?"open":""}`}>
    <div className="brand"><div className="brand-mark"><WalletCards size={22}/></div><div><strong>NexFin</strong><span>Finanças do casal</span></div></div>
    <button className="mobile-close" onClick={()=>setMobile(false)}><X/></button>
    <nav>{nav.map(([href,label,Icon])=><Link key={href} href={href} onClick={()=>setMobile(false)} className={path===href?"active":""}><Icon size={19}/><span>{label}</span></Link>)}</nav>
    <div className="sidebar-footer"><div className="avatar">{(profile?.name||user.email||"U").charAt(0).toUpperCase()}</div><div className="user-mini"><strong>{profile?.name||"Minha família"}</strong><span>{user.email}</span></div><button title="Sair" onClick={async()=>{await signOut();router.replace('/login')}}><LogOut size={18}/></button></div>
   </aside>
   <main className="main-area">
    <header className="topbar"><button className="menu-btn" onClick={()=>setMobile(true)}><Menu/></button><div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div><button className="primary-btn" onClick={()=>setQuick(true)}><Plus size={18}/> Novo lançamento</button></header>
    <div className="page-content">{children}</div>
   </main>
   <button className="fab" onClick={()=>setQuick(true)}><Plus/></button>
   {quick&&<QuickEntry onClose={()=>setQuick(false)}/>} 
 </div>
}
