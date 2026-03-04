
"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { 
  ArrowLeft, 
  Activity, 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Loader2, 
  Ship,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, query, doc } from "firebase/firestore";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const COLORS = ['#1e293b', '#0ea5e9', '#6366f1', '#f59e0b', '#ef4444'];

export default function AdminMetricsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
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

  const isMasterAdmin = user?.email === "admin@company.com";
  const isInspectorEmail = user?.email?.includes("admin") || user?.email === "inspector@shlcs.com" || isMasterAdmin;
  const hasAdminAccess = !isUserLoading && (isInspectorEmail || adminData?.role === 'admin');

  useEffect(() => {
    if (mounted && !isUserLoading && !isAdminDocLoading && !hasAdminAccess && user) {
      router.push("/dashboard");
    }
  }, [mounted, isUserLoading, isAdminDocLoading, hasAdminAccess, router, user]);

  const allShipmentsQuery = useMemoFirebase(() => {
    if (!firestore || !hasAdminAccess) return null;
    return query(collection(firestore, "shipmentRequests"));
  }, [firestore, hasAdminAccess]);

  const { data: shipments, isLoading } = useCollection(allShipmentsQuery);

  const stats = useMemo(() => {
    if (!shipments) return null;

    const total = shipments.length;
    const approved = shipments.filter(s => s.status === "Approved").length;
    const pending = shipments.filter(s => s.status === "Submitted" || s.status === "Pending").length;
    const rejected = shipments.filter(s => s.status === "Rejected").length;

    const portCounts = shipments.reduce((acc: any, s) => {
      const port = s.originPort || "Other";
      acc[port] = (acc[port] || 0) + 1;
      return acc;
    }, {});

    const portData = Object.entries(portCounts).map(([name, value]) => ({ name, value }));

    const statusData = [
      { name: 'Approved', value: approved },
      { name: 'Pending', value: pending },
      { name: 'Rejected', value: rejected },
    ];

    return { total, approved, pending, rejected, portData, statusData };
  }, [shipments]);

  if (!mounted || isUserLoading || isLoading || isAdminDocLoading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Aggregating Global Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/admin">
            <Button variant="ghost" className="mb-4 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white p-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Command Center
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-primary uppercase tracking-tight flex items-center gap-4">
                <BarChart3 className="w-10 h-10 text-emerald-500" />
                Impact Metrics
              </h1>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Global Operational Telemetry & Registry Performance</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatNode icon={<Package />} label="Global Volume" value={stats?.total || 0} color="text-primary" />
          <StatNode icon={<CheckCircle2 />} label="Clearance Velocity" value={stats?.total ? `${Math.round((stats.approved / stats.total) * 100)}%` : "0%"} color="text-emerald-500" />
          <StatNode icon={<Clock />} label="Audit Queue" value={stats?.pending || 0} color="text-amber-500" />
          <StatNode icon={<XCircle />} label="Registry Flags" value={stats?.rejected || 0} color="text-rose-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Card className="bg-white border-none shadow-sm rounded-[3rem] overflow-hidden">
            <CardHeader className="p-10 border-b bg-slate-50">
               <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-primary" />
                  <CardTitle className="text-xs font-black uppercase tracking-widest">Clearance Distribution</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-10 h-80">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.statusData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                    />
                    <Bar dataKey="value" fill="#1e293b" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
               </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm rounded-[3rem] overflow-hidden">
            <CardHeader className="p-10 border-b bg-slate-50">
               <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <CardTitle className="text-xs font-black uppercase tracking-widest">Origin Node Activity</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-10 h-80 flex items-center">
               <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.portData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats?.portData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="w-1/2 space-y-4 pl-10">
                  {stats?.portData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-primary">{entry.value}</span>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatNode({ icon, label, value, color }: any) {
  return (
    <Card className="bg-white border-none shadow-sm rounded-[2rem] p-8 hover:-translate-y-1 transition-transform">
      <div className="flex items-center gap-5">
        <div className={cn("p-4 rounded-2xl bg-slate-50", color)}>{React.cloneElement(icon, { className: "w-6 h-6" })}</div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className={cn("text-3xl font-black tracking-tighter", color)}>{value}</p>
        </div>
      </div>
    </Card>
  );
}
