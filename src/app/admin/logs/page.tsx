
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { 
  ArrowLeft, 
  Terminal, 
  Search, 
  Loader2, 
  Clock,
  User,
  ExternalLink,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { collection, query, doc, orderBy, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function AdminLogsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const adminDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: adminData, isLoading: isAdminDocLoading } = useDoc(adminDocRef);

  const isMasterAdmin = user?.email === "admin@company.com";
  const isInspectorEmail = user?.email?.includes("admin") || user?.email === "inspector@shlcs.com" || isMasterAdmin;
  const hasAdminAccess = !isUserLoading && (isInspectorEmail || adminData?.role === 'admin');

  useEffect(() => {
    if (mounted && !isUserLoading && !isAdminDocLoading && !hasAdminAccess) {
      router.push("/dashboard");
    }
  }, [mounted, isUserLoading, isAdminDocLoading, hasAdminAccess, router]);

  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !hasAdminAccess) return null;
    // Audit trail of shipment request status changes and inspections
    return query(
      collection(firestore, "shipmentRequests"),
      orderBy("inspectedAt", "desc"),
      limit(50)
    );
  }, [firestore, hasAdminAccess]);

  const { data: logs, isLoading } = useCollection(logsQuery);

  const filteredLogs = React.useMemo(() => {
    if (!logs) return [];
    const s = searchTerm.toLowerCase();
    // Only show logs that have been inspected
    return logs.filter(l => l.inspectedAt && (
      l.id.toLowerCase().includes(s) || 
      (l.inspectedBy?.toLowerCase() || '').includes(s) ||
      (l.status?.toLowerCase() || '').includes(s)
    ));
  }, [logs, searchTerm]);

  if (!mounted || isUserLoading || isLoading || isAdminDocLoading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Establishing Audit Handshake...</p>
      </div>
    );
  }

  const formatTimestamp = (ts: any) => {
    if (!ts) return "---";
    if (ts.toDate) return ts.toDate().toLocaleString();
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link href="/admin">
            <Button variant="ghost" className="mb-4 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white p-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Command Center
            </Button>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-primary uppercase tracking-tight flex items-center gap-4">
                <Terminal className="w-10 h-10 text-slate-500" />
                System Logs
              </h1>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Immutable Audit Trail of Inspector Decisions</p>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input 
                placeholder="Audit ID or Inspector..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-12 w-64 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
              />
            </div>
          </div>
        </motion.div>

        <Card className="bg-white border-none shadow-sm rounded-[3rem] overflow-hidden">
          <CardHeader className="bg-slate-50 border-b p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-primary" />
                <CardTitle className="text-xs font-black uppercase tracking-widest">Global Activity Ledger</CardTitle>
              </div>
              <Badge className="bg-primary text-white text-[8px] font-black px-3 py-1 rounded-md">Registry Finalized</Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-none">
                  <TableHead className="px-10 text-[8px] font-black uppercase tracking-widest">Timestamp</TableHead>
                  <TableHead className="text-[8px] font-black uppercase tracking-widest">Authority Node</TableHead>
                  <TableHead className="text-[8px] font-black uppercase tracking-widest">Action</TableHead>
                  <TableHead className="text-[8px] font-black uppercase tracking-widest">Reference</TableHead>
                  <TableHead className="text-right pr-10 text-[8px] font-black uppercase tracking-widest">Audit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map(log => (
                  <TableRow key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-10">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {formatTimestamp(log.inspectedAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-[10px] font-black text-primary uppercase truncate max-w-[150px]">{log.inspectedBy || "Unknown Node"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5",
                        log.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      )}>
                        {log.status === 'Approved' ? 'Clearance Granted' : 'Registry Flagged'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] font-bold">#{log.id.substring(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="text-right pr-10">
                      <Link href={`/admin/${log.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-[8px] font-black uppercase hover:bg-primary hover:text-white transition-all">
                          Inspect <ExternalLink className="w-2.5 h-2.5 ml-2" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-24">
                      <History className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase text-slate-300">Audit Ledger Empty</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <CardHeader className="bg-slate-50 border-t p-6 text-center">
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">SHLCS Immutable Record Node v2026.1</p>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
