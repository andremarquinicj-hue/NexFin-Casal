import { ReactNode } from "react";
export default function StatCard({label,value,hint,icon}:{label:string;value:string;hint?:string;icon?:ReactNode}){return <div className="stat-card"><div className="stat-top"><span>{label}</span>{icon}</div><strong>{value}</strong>{hint&&<small>{hint}</small>}</div>}
