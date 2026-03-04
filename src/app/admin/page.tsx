
"use client";

import React, { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Database,
  Activity,
  Zap,
  ShieldCheck,
  LogOut,
  Users,
  Shield,
  ArrowRight,
  Terminal,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { collection, query, doc, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { NotificationsPopover } from "@/components/notifications-popover";

export default function AdminDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const adminDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: adminData, isLoading: isAdminDocLoading } = useDoc(adminDocRef);

  // High-Authority Check
  const isMasterAdmin = user?.email === "admin@company.com";
  const isInspectorEmail = user?.email?.includes("admin") || user?.email === "inspector@shlcs.com" || isMasterAdmin;
  const hasAdminAccess = !isUserLoading && (isInspectorEmail || adminData?.role === 'admin');

  useEffect(() => {
    if (mounted) {
      if (!isUserLoading && !isAdminDocLoading && !hasAdminAccess && user) {
        router.push("/dashboard");
      }
      if (!isUserLoading && !user) {
        router.push("/login");
      }
    }
  }, [hasAdminAccess, isUserLoading, isAdminDocLoading, router, user, mounted]);

  const recentShipmentsQuery = useMemoFirebase(() => {
    if (!firestore || !hasAdminAccess) return null;
    return query(collection(firestore, "shipmentRequests"), orderBy("submissionDateTime", "desc"));
  }, [firestore, hasAdminAccess]);

  const { data: shipments, isLoading: isCollectionLoading } = useCollection(recentShipmentsQuery);

  if (!mounted || isUserLoading || isAdminDocLoading) return <AdminSkeleton />;
  if (!hasAdminAccess) return null;

  const stats = {
    total: shipments?.length || 0,
    pending: shipments?.filter(s => s.status === "Submitted" || s.status === "Pending").length || 0,
    impact: {
      queueReduction: "84%",
      efficiency: "99.9%"
    }
  };

  const displayName = adminData?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Authorized Node';

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-primary font-sans flex flex-col overflow-hidden">
      {/* Header - Glassmorphism Command HUD */}
      <header className="bg-primary/95 backdrop-blur-xl border-b border-white/5 text-white sticky top-0 z-50 shadow-xl h-16 sm:h-20 shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="bg-accent p-1.5 sm:p-2 rounded-lg shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[6px] sm:text-[8px] font-black uppercase text-accent tracking-[0.2em] leading-none truncate">CONNECT TO COLLECT</p>
              <h1 className="text-xs sm:text-lg font-black uppercase tracking-tight mt-0.5 sm:mt-1 truncate">Command Center</h1>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center flex-1 min-w-0">
            <div className="bg-white/5 px-6 py-2 rounded-2xl border border-white/10 backdrop-blur-sm">
              <p className="text-[8px] font-black text-accent uppercase tracking-[0.2em] text-center mb-0.5">Authority Node</p>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-tight truncate">{displayName}</span>
                <Badge className={cn("text-[7px] h-4 uppercase font-black px-1.5 border-none", isMasterAdmin ? "bg-amber-500 text-primary" : "bg-blue-500 text-white")}>
                  {isMasterAdmin ? "Master Admin" : "Inspector"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <NotificationsPopover isAdmin />
            <Button 
              variant="outline" 
              onClick={() => signOut(auth)}
              className="h-9 sm:h-10 border-white/20 bg-white/5 text-white text-[8px] sm:text-[9px] font-black uppercase px-3 sm:px-6 rounded-lg sm:rounded-xl hover:bg-rose-600 transition-all"
            >
              <LogOut className="w-3.5 h-3.5 sm:mr-2" />
              <span className="hidden xs:inline">Terminate</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-10 max-w-[1600px] mx-auto w-full no-scrollbar">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Welcome, {displayName}</h2>
            <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Operational summary for your active session.</p>
          </div>
          <Badge variant="outline" className="bg-white border-slate-200 text-[8px] sm:text-[10px] font-black uppercase px-3 sm:px-4 py-1.5 rounded-lg sm:rounded-xl shadow-sm">
            <Zap className="w-3 h-3 mr-2 text-amber-500" /> Registry Live
          </Badge>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Link href="/admin/authorities" className={cn("group transition-all", !isMasterAdmin && "opacity-50 pointer-events-none")}>
            <NavCard icon={<Shield className="text-amber-500" />} label="Authority" description="Personnel" />
          </Link>
          <Link href="/admin/clients" className="group transition-all">
            <NavCard icon={<Users className="text-blue-500" />} label="Clients" description="Commercial" />
          </Link>
          <Link href="/admin/metrics" className="group transition-all">
            <NavCard icon={<BarChart3 className="text-emerald-500" />} label="Metrics" description="Real-time Analytics" />
          </Link>
          <Link href="/admin/logs" className="group transition-all">
            <NavCard icon={<Terminal className="text-slate-500" />} label="Logs" description="Audit Trails" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
             <AdminStat label="Total Records" value={stats.total} icon={<Database className="text-blue-500" />} />
             <AdminStat label="Review Queue" value={stats.pending} icon={<Activity className="text-amber-500" />} />
             <div className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-[2rem] border border-slate-200 shadow-sm text-center sm:col-span-2 lg:col-span-1">
                <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Queue Mitigation</p>
                <p className="text-3xl sm:text-4xl font-black text-emerald-500 tracking-tighter">{stats.impact.queueReduction}</p>
                <p className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase mt-2">Efficiency: {stats.impact.efficiency}</p>
             </div>
          </div>

          <div className="lg:col-span-3">
            <Card className="bg-white border-slate-200 rounded-xl sm:rounded-[2rem] overflow-hidden shadow-sm">
              <CardHeader className="bg-slate-50 border-b p-4 sm:p-8 flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-[10px] sm:text-sm font-black uppercase tracking-widest">Audit Queue</CardTitle>
                  <CardDescription className="text-[7px] sm:text-[9px] font-bold uppercase mt-0.5">Live Manifest Feed</CardDescription>
                </div>
                <Badge className="bg-primary text-white text-[7px] sm:text-[8px] font-black px-2 sm:px-3 py-1 rounded-md">Live</Badge>
              </CardHeader>
              <div className="overflow-x-auto no-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-none">
                      <TableHead className="px-4 sm:px-8 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">ID</TableHead>
                      <TableHead className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Consignor</TableHead>
                      <TableHead className="text-right pr-4 sm:pr-8 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isCollectionLoading ? (
                      [1, 2, 3].map(i => <TableRow key={i}><TableCell colSpan={3} className="p-4 sm:p-8"><Skeleton className="h-10 w-full" /></TableCell></TableRow>)
                    ) : shipments && shipments.length > 0 ? (
                      shipments.slice(0, 10).map(s => (
                        <TableRow key={s.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                          <TableCell className="px-4 sm:px-8">
                            <p className="font-mono text-[9px] sm:text-[10px] font-bold">#{s.id.substring(0, 8).toUpperCase()}</p>
                            <RegistryStatus status={s.status} />
                          </TableCell>
                          <TableCell className="text-[10px] sm:text-[11px] font-bold text-primary max-w-[100px] truncate">{s.consignorName}</TableCell>
                          <TableCell className="text-right pr-4 sm:pr-8">
                            <Link href={`/admin/${s.id}`}>
                              <Button size="sm" variant="outline" className="h-8 sm:h-9 rounded-lg sm:rounded-xl text-[8px] font-black uppercase px-3 sm:px-4 hover:bg-primary hover:text-white transition-all">Review</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={3} className="text-center py-16 opacity-30 text-[9px] font-black uppercase">Queue Empty</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavCard({ icon, label, description }: any) {
  return (
    <div className="bg-white p-4 sm:p-8 rounded-xl sm:rounded-[2rem] border border-slate-200 shadow-sm transition-all hover:border-primary group-hover:shadow-lg h-full cursor-pointer">
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="bg-slate-50 p-2 sm:p-3.5 rounded-lg sm:rounded-2xl border border-slate-100 shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest truncate">{label}</p>
          <p className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase mt-0.5 truncate">{description}</p>
        </div>
        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-auto text-slate-200 group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
}

function AdminStat({ label, value, icon }: any) {
  return (
    <Card className="bg-white border-slate-200 rounded-xl sm:rounded-[2rem] p-4 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</p>
          <p className="text-xl sm:text-3xl font-black text-primary">{value}</p>
        </div>
        <div className="bg-slate-50 p-2 sm:p-4 rounded-lg sm:rounded-2xl border border-slate-100 shrink-0">{icon}</div>
      </div>
    </Card>
  );
}

function RegistryStatus({ status }: any) {
  const styles: any = {
    Submitted: "bg-blue-50 text-blue-600 border-blue-100",
    Pending: "bg-amber-50 text-amber-600 border-amber-100",
    Approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Rejected: "bg-rose-50 text-rose-600 border-rose-100"
  };
  return (
    <Badge variant="outline" className={cn("text-[6px] font-black uppercase px-1.5 py-0.5 border rounded-md mt-1", styles[status] || styles.Pending)}>{status}</Badge>
  );
}

function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Authenticating Authority...</p>
    </div>
  );
}
