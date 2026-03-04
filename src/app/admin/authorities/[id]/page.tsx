
"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useDoc, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { 
  Loader2, 
  ArrowLeft, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  User,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { doc, query, collection, where, orderBy } from "firebase/firestore";
import Link from "next/link";

export default function AuthorityLogPage() {
  const { id } = useParams();
  const firestore = useFirestore();

  const adminRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, "users", id as string);
  }, [firestore, id]);

  const { data: admin, isLoading: isAdminLoading } = useDoc(adminRef);

  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !admin?.email) return null;
    return query(
      collection(firestore, "shipmentRequests"),
      where("inspectedBy", "==", admin.email),
      orderBy("inspectedAt", "desc")
    );
  }, [firestore, admin?.email]);

  const { data: logs, isLoading: isLogsLoading } = useCollection(logsQuery);

  if (isAdminLoading) return <LoadingNode />;

  const stats = {
    total: logs?.length || 0,
    approved: logs?.filter(l => l.status === 'Approved').length || 0,
    rejected: logs?.filter(l => l.status === 'Rejected').length || 0
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        <header>
          <Link href="/admin/authorities">
            <Button variant="ghost" className="mb-4 text-[10px] font-black uppercase tracking-widest p-0 h-auto hover:bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" /> Authority Ledger
            </Button>
          </Link>
          <div className="flex items-center gap-6">
            <div className="bg-primary p-4 rounded-3xl shadow-xl">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-primary uppercase tracking-tight">{admin?.displayName || 'Authority Node'}</h1>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-widest">{admin?.email}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Reviews" value={stats.total} icon={<History />} color="text-primary" />
          <StatCard label="Approvals" value={stats.approved} icon={<CheckCircle2 />} color="text-emerald-500" />
          <StatCard label="Rejections" value={stats.rejected} icon={<AlertCircle />} color="text-rose-500" />
        </div>

        <Card className="bg-white border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <CardHeader className="bg-slate-50 border-b p-8">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-primary" />
              <CardTitle className="text-xs font-black uppercase tracking-widest">Operational Audit Trail</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLogsLoading ? (
              <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : logs && logs.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none">
                    <TableHead className="px-10 text-[8px] font-black uppercase tracking-widest">Reference</TableHead>
                    <TableHead className="text-[8px] font-black uppercase tracking-widest">Decision</TableHead>
                    <TableHead className="text-[8px] font-black uppercase tracking-widest">Timestamp</TableHead>
                    <TableHead className="text-right pr-10 text-[8px] font-black uppercase tracking-widest">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id} className="border-b border-slate-50">
                      <TableCell className="px-10 font-mono text-[10px] font-bold">#{log.id.substring(0, 8).toUpperCase()}</TableCell>
                      <TableCell>
                        <Badge className={log.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px] font-bold text-slate-400">
                        {log.inspectedAt?.toDate?.() ? log.inspectedAt.toDate().toLocaleString() : new Date(log.inspectedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <Link href={`/shipment/${log.id}`}>
                          <Button variant="ghost" size="sm" className="text-[8px] font-black uppercase">Audit Manifest</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-20 text-center opacity-30 text-[10px] font-black uppercase">No registry actions recorded</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <Card className="bg-white p-8 rounded-3xl border-slate-100 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className={`text-3xl font-black ${color}`}>{value}</p>
        </div>
        <div className={`p-4 rounded-2xl bg-slate-50 ${color}`}>{React.cloneElement(icon, { className: "w-6 h-6" })}</div>
      </div>
    </Card>
  );
}

function LoadingNode() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Audit Ledger...</p>
    </div>
  );
}
