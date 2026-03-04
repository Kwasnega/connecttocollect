"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
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
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { collection, query, where } from "firebase/firestore";
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

const COLORS = ['#1e293b', '#0ea5e9', '#6366f1', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const shipmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, "shipmentRequests"),
      where("requestorUid", "==", user.uid)
    );
  }, [firestore, user?.uid]);

  const { data: shipments, isLoading } = useCollection(shipmentsQuery);

  const stats = useMemo(() => {
    if (!shipments) return null;

    const total = shipments.length;
    const approved = shipments.filter(s => s.status === "Approved").length;
    const pending = shipments.filter(s => s.status === "Submitted" || s.status === "Pending").length;
    const rejected = shipments.filter(s => s.status === "Rejected").length;

    // Distribution by shipping mode
    const modeCounts = shipments.reduce((acc: any, s) => {
      const mode = s.shippingMode || "Other";
      acc[mode] = (acc[mode] || 0) + 1;
      return acc;
    }, {});

    const modeData = Object.entries(modeCounts).map(([name, value]) => ({ name, value }));

    // Status Data for BarChart
    const statusData = [
      { name: 'Approved', value: approved },
      { name: 'Pending', value: pending },
      { name: 'Rejected', value: rejected },
    ];

    // Cargo Type Data
    const typeCounts = shipments.reduce((acc: any, s) => {
      const type = s.cargoType || "General";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

    return { total, approved, pending, rejected, modeData, statusData, typeData };
  }, [shipments]);

  if (isUserLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Aggregating Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-10">
      <div className="max-w-7xl mx-auto space-y-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 p-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Command
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-primary uppercase tracking-tight flex items-center gap-4">
                <Activity className="w-10 h-10 text-accent" />
                Operational Analytics
              </h1>
              <p className="text-muted-foreground text-sm font-medium mt-2">Real-time maritime intelligence and manifest performance telemetry.</p>
            </div>
            <div className="bg-white px-6 py-4 rounded-3xl border shadow-sm hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Node Identifier</p>
              <p className="text-xs font-bold text-primary font-mono">{user?.uid.substring(0, 12).toUpperCase()}</p>
            </div>
          </div>
        </motion.div>

        {!stats || stats.total === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[3rem] p-20 text-center border-dashed border-2 border-primary/5">
            <Ship className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-2">No Registry Data Detected</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto font-medium">Initialize your first manifest to generate operational telemetry and performance insights.</p>
            <Link href="/manifest" className="mt-8 block">
              <Button className="h-12 px-8 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest">Start First Manifest</Button>
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <StatSummary icon={<Package />} label="Total Volume" value={stats.total} color="text-primary" />
              <StatSummary icon={<CheckCircle2 />} label="Clearance Rate" value={`${Math.round((stats.approved / stats.total) * 100)}%`} color="text-emerald-500" />
              <StatSummary icon={<Clock />} label="In Processing" value={stats.pending} color="text-amber-500" />
              <StatSummary icon={<XCircle />} label="Flagged Manifests" value={stats.rejected} color="text-rose-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Registry Status Breakdown</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-10 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.statusData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                      />
                      <Bar dataKey="value" fill="#1e293b" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <PieChartIcon className="w-5 h-5 text-accent" />
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Transit Mode Distribution</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-10 h-80 flex items-center">
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.modeData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.modeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-4 pl-10">
                    {stats.modeData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{entry.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-primary">{Math.round((entry.value / stats.total) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden lg:col-span-2">
                <CardHeader className="p-8 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Cargo Classification Matrix</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.typeData.map((type, idx) => (
                      <div key={type.name} className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{type.name} Registry</p>
                        <div className="flex items-end justify-between">
                          <p className="text-3xl font-black text-primary tracking-tighter">{type.value}</p>
                          <p className="text-[10px] font-bold text-accent mb-1">{Math.round((type.value / stats.total) * 100)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatSummary({ icon, label, value, color }: any) {
  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8 hover:scale-[1.02] transition-transform">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-slate-50 ${color}`}>{React.cloneElement(icon, { className: "w-5 h-5" })}</div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className={`text-2xl font-black tracking-tight ${color}`}>{value}</p>
        </div>
      </div>
    </Card>
  );
}