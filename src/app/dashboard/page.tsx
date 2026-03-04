
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth, useDoc } from "@/firebase";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Plus, 
  Package, 
  Clock, 
  CheckCircle2, 
  LogOut,
  LayoutDashboard,
  Ship,
  Search,
  ArrowUpRight,
  Archive,
  BarChart3,
  Menu,
  ShieldCheck,
  Zap,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { collection, query, where, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { NotificationsPopover } from "@/components/notifications-popover";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  // Identity Guard: Redirect admins away from client dashboard
  const isAdmin = useMemo(() => {
    if (!user) return false;
    return (
      user.email?.includes("admin") || 
      user.email === "inspector@shlcs.com" || 
      user.email === "admin@company.com" ||
      userData?.role === 'admin'
    );
  }, [user, userData]);

  useEffect(() => {
    if (mounted && !isUserLoading && !isUserDataLoading) {
      if (!user) {
        router.replace("/login");
        return;
      }
      if (isAdmin) {
        router.replace("/admin");
        return;
      }
    }
  }, [user, isUserLoading, isUserDataLoading, router, mounted, isAdmin]);

  const shipmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || isAdmin) return null;
    return query(
      collection(firestore, "shipmentRequests"),
      where("requestorUid", "==", user.uid)
    );
  }, [firestore, user?.uid, isAdmin]);

  const { data: rawShipments, isLoading: isShipmentsLoading } = useCollection(shipmentsQuery);

  const shipments = useMemo(() => {
    if (!rawShipments) return [];
    return [...rawShipments].sort((a, b) => 
      new Date(b.submissionDateTime || 0).getTime() - new Date(a.submissionDateTime || 0).getTime()
    );
  }, [rawShipments]);

  const filteredShipments = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return shipments.filter(s => 
      s.id.toLowerCase().includes(q) ||
      s.consigneeName?.toLowerCase().includes(q)
    );
  }, [shipments, searchQuery]);

  const stats = {
    total: shipments.length,
    pending: shipments.filter(s => s.status === "Submitted" || s.status === "Pending").length,
    approved: shipments.filter(s => s.status === "Approved").length,
  };

  const SidebarNav = ({ mobile = false }) => (
    <nav className={cn("space-y-1", mobile ? "px-2" : "px-3")}>
      <NavItem icon={<LayoutDashboard />} label="My Ledger" active isOpen={mobile || isSidebarOpen} />
      <Link href="/manifest" onClick={() => setIsMobileMenuOpen(false)}>
        <NavItem icon={<Plus />} label="New Manifest" isOpen={mobile || isSidebarOpen} />
      </Link>
      <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
        <NavItem icon={<UserCircle />} label="My Identity" isOpen={mobile || isSidebarOpen} />
      </Link>
      <Link href="/archive" onClick={() => setIsMobileMenuOpen(false)}>
        <NavItem icon={<Archive />} label="Registry Archive" isOpen={mobile || isSidebarOpen} />
      </Link>
      <Link href="/analytics" onClick={() => setIsMobileMenuOpen(false)}>
        <NavItem icon={<BarChart3 />} label="My Intelligence" isOpen={mobile || isSidebarOpen} />
      </Link>
    </nav>
  );

  const isConfirmedClient = mounted && !isUserLoading && !isUserDataLoading && !isAdmin && user;

  if (!isConfirmedClient) return <DashboardSkeleton />;

  const displayName = userData?.displayName || user.displayName || user.email?.split('@')[0] || 'Authorized Node';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-primary flex overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="hidden lg:flex bg-white border-r border-slate-200 relative z-50 flex-col shadow-sm"
      >
        <div className="h-20 flex items-center px-6 shrink-0 justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-primary p-2 rounded-xl shrink-0">
              <Ship className="w-5 h-5 text-white" />
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-tighter truncate">CONNECT TO COLLECT</p>
                <p className="text-[8px] font-bold text-accent uppercase tracking-widest">CLIENT NODE</p>
              </div>
            )}
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400">
            <Menu className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 py-6">
          <SidebarNav />
        </div>

        <div className="p-4 border-t border-slate-100">
          <Button 
            variant="ghost" 
            className="w-full h-10 text-slate-400 hover:text-rose-600 rounded-lg justify-start px-3"
            onClick={() => signOut(auth)}
          >
            <LogOut className="w-4 h-4 mr-3" />
            {isSidebarOpen && <span className="text-[10px] font-black uppercase">Terminate</span>}
          </Button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Glassmorphism optimized */}
        <header className="h-16 sm:h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 bg-white border-none">
                  <div className="h-20 flex items-center px-6 border-b border-slate-100 bg-primary text-white">
                    <div className="flex items-center gap-3">
                      <Ship className="w-6 h-6 text-accent" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-tighter">CONNECT TO COLLECT</p>
                        <p className="text-[8px] font-bold text-accent/80 uppercase tracking-widest">NATIONAL REGISTRY</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-6">
                    <SidebarNav mobile />
                  </div>
                  <div className="absolute bottom-0 w-full p-6 border-t border-slate-50">
                     <Button 
                        variant="outline" 
                        className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border-rose-100 text-rose-600 hover:bg-rose-50"
                        onClick={() => signOut(auth)}
                      >
                        <LogOut className="w-4 h-4 mr-2" /> Terminate Session
                      </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="overflow-hidden max-w-[180px] sm:max-w-none">
              <h1 className="text-xs sm:text-lg font-black uppercase text-primary tracking-tight truncate">Welcome, {displayName}</h1>
              <p className="text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1 hidden xs:block">Registry Ledger Node</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hidden sm:flex">
                    <ShieldCheck className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-primary text-white border-none p-4 rounded-2xl max-w-xs shadow-2xl">
                   <div className="flex items-start gap-3">
                      <Zap className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">System Integrity Panel</p>
                        <p className="text-[9px] font-medium text-white/60 mt-1 leading-relaxed">
                          Your session is secured by SHA-256 protocols.
                        </p>
                      </div>
                   </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input 
                type="text" 
                placeholder="Lookup ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 lg:w-64 h-10 bg-slate-50 rounded-xl pl-10 pr-4 text-xs font-medium border border-slate-200 outline-none focus:bg-white transition-all"
              />
            </div>
            <NotificationsPopover />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 no-scrollbar">
          {/* Welcome Message */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">System Briefing</h2>
                <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Operational impact summary for your commercial node.</p>
              </div>
              <Link href="/profile">
                <Button variant="outline" className="h-10 rounded-xl bg-white text-[9px] font-black uppercase tracking-widest">
                  Configure Node
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <SimpleStat icon={<Package />} label="Active Manifests" value={stats.total} />
            <SimpleStat icon={<Clock />} label="Awaiting Authority" value={stats.pending} />
            <SimpleStat icon={<CheckCircle2 />} label="Cleared Records" value={stats.approved} />
          </div>

          <Card className="bg-white border-slate-200 rounded-xl sm:rounded-[2rem] overflow-hidden shadow-sm">
            <CardHeader className="p-4 sm:p-8 border-b border-slate-100 flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-[10px] sm:text-sm font-black uppercase tracking-widest">Shipment Stream</CardTitle>
                <CardDescription className="text-[7px] sm:text-[9px] font-bold uppercase mt-0.5">Real-time tracking</CardDescription>
              </div>
              <Link href="/manifest" className="shrink-0">
                <Button size="sm" className="bg-primary text-white rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase h-9 sm:h-10 px-3 sm:px-6">
                  + Commit New
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {isShipmentsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                </div>
              ) : filteredShipments.length > 0 ? (
                <div className="overflow-x-auto no-scrollbar">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-none">
                        <TableHead className="px-4 sm:px-8 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">ID</TableHead>
                        <TableHead className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Port</TableHead>
                        <TableHead className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredShipments.map((s) => (
                        <TableRow key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <TableCell className="px-4 sm:px-8">
                            <Link href={`/shipment/${s.id}`} className="block">
                              <p className="font-mono text-[9px] sm:text-[10px] font-bold">#{s.id.substring(0, 8).toUpperCase()}</p>
                              <p className="text-[8px] text-slate-400 font-bold truncate max-w-[80px] sm:max-w-none">{s.consigneeName}</p>
                            </Link>
                          </TableCell>
                          <TableCell className="text-[8px] sm:text-[10px] font-bold uppercase text-slate-500">
                            {s.destinationPort?.split('-')[1] || s.destinationPort}
                          </TableCell>
                          <TableCell className="text-right pr-4 sm:pr-8">
                            <StatusBadge status={s.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-16 text-center opacity-40">
                  <Package className="w-8 h-8 mx-auto mb-3" />
                  <p className="text-[9px] font-black uppercase">Ledger Empty</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

function SimpleStat({ icon, label, value }: any) {
  return (
    <Card className="bg-white border-slate-200 rounded-lg sm:rounded-[1.5rem] p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="bg-slate-50 p-2 sm:p-3 rounded-lg sm:rounded-xl text-primary shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</p>
          <p className="text-base sm:text-2xl font-black">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function NavItem({ icon, label, active = false, isOpen = true }: any) {
  return (
    <div className={cn(
      "h-10 sm:h-12 flex items-center px-4 rounded-lg sm:rounded-xl cursor-pointer transition-all",
      active ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-50 hover:text-primary"
    )}>
      {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4 shrink-0" })}
      {isOpen && <span className="ml-4 text-[8px] sm:text-[9px] font-black uppercase tracking-widest truncate">{label}</span>}
    </div>
  );
}

function StatusBadge({ status }: any) {
  const styles: any = {
    Submitted: "bg-blue-50 text-blue-600 border-blue-100",
    Pending: "bg-amber-50 text-amber-600 border-amber-100",
    Approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Rejected: "bg-rose-50 text-rose-600 border-rose-100"
  };
  return (
    <Badge variant="outline" className={cn("text-[6px] sm:text-[8px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-md", styles[status])}>
      {status}
    </Badge>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Identity...</p>
    </div>
  );
}
