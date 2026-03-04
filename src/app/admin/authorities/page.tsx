
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  ArrowLeft, 
  ShieldCheck, 
  UserPlus, 
  ShieldAlert,
  Search,
  Shield,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { collection, query, where, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

export default function AuthorityRegistryPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: "", password: "", fullName: "" });
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMasterAdmin = user?.email === 'admin@company.com';

  const adminQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users"), where("role", "==", "admin"));
  }, [firestore, user]);

  const { data: authorities, isLoading } = useCollection(adminQuery);

  const filteredAuthorities = useMemo(() => {
    if (!authorities) return [];
    const s = searchTerm.toLowerCase();
    return authorities.filter(u => 
      (u.displayName?.toLowerCase() || '').includes(s) || 
      (u.email?.toLowerCase() || '').includes(s)
    );
  }, [authorities, searchTerm]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMasterAdmin) {
      toast({ variant: "destructive", title: "Access Denied", description: "Only the Master Admin can create new administrators." });
      return;
    }
    if (!adminForm.email || !adminForm.password || !adminForm.fullName) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in all the required information." });
      return;
    }
    setIsSubmittingAdmin(true);
    
    const tempAppName = `temp-admin-${Date.now()}`;
    let tempApp;
    try {
      tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);
      const userCredential = await createUserWithEmailAndPassword(tempAuth, adminForm.email, adminForm.password);
      await updateProfile(userCredential.user, { displayName: adminForm.fullName });
      
      if (firestore) {
        await setDoc(doc(firestore, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: adminForm.email,
          displayName: adminForm.fullName,
          role: "admin",
          passwordResetRequired: true,
          createdAt: serverTimestamp(),
          initiatedBy: user?.email
        });
      }
      toast({ title: "Account Created", description: `${adminForm.fullName} has been added as an administrator.` });
      setIsCreatingAdmin(false);
      setAdminForm({ email: "", password: "", fullName: "" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    } finally {
      setIsSubmittingAdmin(false);
      if (tempApp) await deleteApp(tempApp);
    }
  };

  if (!mounted || isUserLoading || isLoading) return <LoadingNode />;

  if (!isMasterAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-6" />
        <h1 className="text-2xl font-black uppercase tracking-tight text-primary">Admin Access Required</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">Only the Master Admin can manage system personnel.</p>
        <Link href="/admin" className="mt-8">
          <Button className="rounded-xl h-12 px-8">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Link href="/admin">
              <Button variant="ghost" className="mb-4 text-[10px] font-black uppercase tracking-widest p-0 h-auto hover:bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </Link>
            <h1 className="text-3xl font-black text-primary uppercase tracking-tight flex items-center gap-4">
              <Shield className="w-10 h-10 text-amber-500" />
              Administrator List
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase mt-2 tracking-widest">Manage system personnel and inspectors</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input 
                placeholder="Search administrators..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-12 w-64 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
              />
            </div>
            <Dialog open={isCreatingAdmin} onOpenChange={setIsCreatingAdmin}>
              <DialogTrigger asChild>
                <Button className="h-12 bg-primary text-white text-[9px] font-black uppercase px-6 rounded-xl shadow-lg shadow-primary/10">
                  <UserPlus className="w-4 h-4 mr-2" /> Add Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                <DialogHeader className="bg-primary p-8 text-white text-center">
                  <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-8 h-8 text-accent" />
                  </div>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">Create Admin Node</DialogTitle>
                  <DialogDescription className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-2">
                    Initialize a new administrator in the system.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAdmin} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Full Name</Label>
                      <Input placeholder="Full Name" value={adminForm.fullName} onChange={e => setAdminForm({...adminForm, fullName: e.target.value})} className="h-12 rounded-xl font-bold bg-slate-50 border-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Email Address</Label>
                      <Input type="email" placeholder="email@example.com" value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} className="h-12 rounded-xl font-bold bg-slate-50 border-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Temp Password</Label>
                      <Input type="password" placeholder="••••••••" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="h-12 rounded-xl font-bold bg-slate-50 border-none" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-14 bg-primary text-white font-black uppercase rounded-xl" disabled={isSubmittingAdmin}>
                    {isSubmittingAdmin ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="bg-white border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-none">
                <TableHead className="px-10 text-[8px] font-black uppercase tracking-widest">ID</TableHead>
                <TableHead className="text-[8px] font-black uppercase tracking-widest">Full Name</TableHead>
                <TableHead className="text-[8px] font-black uppercase tracking-widest">Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAuthorities.map(u => (
                <TableRow key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <TableCell className="px-10 font-mono text-[9px] font-bold">ID_{u.uid?.substring(0, 8).toUpperCase()}</TableCell>
                  <TableCell className="text-[11px] font-bold text-primary">{u.displayName || 'Unknown'}</TableCell>
                  <TableCell className="text-[10px] font-bold text-slate-400">{u.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

function LoadingNode() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Personnel...</p>
    </div>
  );
}
