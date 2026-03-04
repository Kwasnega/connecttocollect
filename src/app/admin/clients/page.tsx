
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  ArrowLeft, 
  Users, 
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, doc } from "firebase/firestore";
import Link from "next/link";

export default function ClientRegistryPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const adminDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: adminData, isLoading: isAdminDocLoading } = useDoc(adminDocRef);

  // Synchronized authority check for global registry oversight
  const isMasterAdmin = user?.email === "admin@company.com";
  const isInspectorEmail = user?.email?.includes("admin") || user?.email === "inspector@shlcs.com" || isMasterAdmin;
  const hasAdminAccess = !isUserLoading && (isInspectorEmail || adminData?.role === 'admin');

  useEffect(() => {
    if (!isUserLoading && !isAdminDocLoading && !hasAdminAccess && user) {
      router.push("/dashboard");
    }
  }, [hasAdminAccess, isUserLoading, isAdminDocLoading, router, user]);

  const clientQuery = useMemoFirebase(() => {
    if (!firestore || !hasAdminAccess) return null;
    // Querying all users where role is client
    return query(collection(firestore, "users"), where("role", "==", "client"));
  }, [firestore, hasAdminAccess]);

  const { data: clients, isLoading } = useCollection(clientQuery);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const s = searchTerm.toLowerCase();
    return clients.filter(u => 
      (u.displayName?.toLowerCase() || '').includes(s) || 
      (u.email?.toLowerCase() || '').includes(s)
    );
  }, [clients, searchTerm]);

  if (isUserLoading || isLoading) return <LoadingNode />;

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Link href="/admin">
              <Button variant="ghost" className="mb-4 text-[10px] font-black uppercase tracking-widest p-0 h-auto hover:bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Command
              </Button>
            </Link>
            <h1 className="text-3xl font-black text-primary uppercase tracking-tight flex items-center gap-4">
              <Users className="w-10 h-10 text-blue-500" />
              Client Registry
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase mt-2 tracking-widest">Global Vault of Commercial Entities</p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
            <input 
              placeholder="Lookup Entity Identifier..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-12 w-80 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
            />
          </div>
        </div>

        <Card className="bg-white border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-none">
                  <TableHead className="px-10 text-[8px] font-black uppercase tracking-widest">Entity ID</TableHead>
                  <TableHead className="text-[8px] font-black uppercase tracking-widest">Display Identity</TableHead>
                  <TableHead className="text-[8px] font-black uppercase tracking-widest">Contact Node</TableHead>
                  <TableHead className="text-right pr-10 text-[8px] font-black uppercase tracking-widest">Verification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map(u => (
                  <TableRow key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <TableCell className="px-10 font-mono text-[9px] font-bold">ID_{u.uid?.substring(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="text-[11px] font-bold text-primary">{u.displayName || 'Unidentified entity'}</TableCell>
                    <TableCell className="text-[10px] font-bold text-slate-400">{u.email}</TableCell>
                    <TableCell className="text-right pr-10">
                      <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0.5 border-blue-100 bg-blue-50 text-blue-600">Verified Identity</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredClients.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 opacity-30 text-[10px] font-black uppercase">Client registry node empty</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden p-4 space-y-4">
            {filteredClients.map(u => (
              <div key={u.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-primary truncate">{u.displayName}</p>
                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase truncate">{u.email}</p>
                  </div>
                  <Badge className="text-[7px] font-black uppercase bg-blue-50 text-blue-600 border-blue-100">Client</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function LoadingNode() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Client Registry...</p>
    </div>
  );
}
