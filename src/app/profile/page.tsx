"use client";

import React, { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  ArrowLeft, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Save, 
  KeyRound,
  Calendar, 
  Globe,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/phone-input";
import { doc, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { motion } from "framer-motion";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "@/firebase";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [mounted, setMounted] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isDocLoading } = useDoc(userDocRef);

  const [formData, setFormData] = useState({
    displayName: "",
    companyName: "",
    phoneNumber: "",
    address: "",
    ghanaCardNumber: "GHA-",
  });

  useEffect(() => {
    setMounted(true);
    if (userData) {
      setFormData({
        displayName: userData.displayName || "",
        companyName: userData.companyName || "",
        phoneNumber: userData.phoneNumber || "",
        address: userData.address || "",
        ghanaCardNumber: userData.ghanaCardNumber || "GHA-",
      });
    }
  }, [userData]);

  const formatGhanaCard = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length === 0) return "GHA-";
    if (digits.length <= 9) return `GHA-${digits}`;
    return `GHA-${digits.slice(0, 9)}-${digits.slice(9, 10)}`;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDocRef || !user) return;

    setIsUpdating(true);
    try {
      // Use setDocumentNonBlocking with merge: true to avoid "missing document" errors
      // and ensure the update protocol succeeds regardless of the node's initial state.
      setDocumentNonBlocking(userDocRef, {
        ...formData,
        uid: user.uid,
        email: user.email,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast({ 
        title: "Profile Updated", 
        description: "Your information has been saved to the national registry." 
      });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Update Failed", 
        description: "We couldn't save your changes. Please check your connection." 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ 
        title: "Reset Email Sent", 
        description: "Please check your inbox for password recovery instructions." 
      });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Reset Failed", 
        description: "Could not initiate password reset. Please try again later." 
      });
    }
  };

  if (!mounted || isUserLoading || isDocLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Accessing Identity Node...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 sm:py-16 px-4 sm:px-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Link href="/dashboard">
              <Button variant="ghost" className="mb-4 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white p-0 h-auto">
                <ArrowLeft className="w-4 h-4 mr-2" /> Return to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-primary">My Identity</h1>
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">Registry Node: {user?.uid.substring(0, 12).toUpperCase()}</p>
          </motion.div>
          
          <Badge className="bg-primary text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl shadow-lg w-fit">
            <ShieldCheck className="w-3.5 h-3.5 mr-2 text-accent" />
            Verified Profile
          </Badge>
        </header>

        <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
          <div className="lg:col-span-2 space-y-8 sm:space-y-12">
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 border-b p-8 sm:p-12">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/5 p-3 rounded-2xl"><User className="w-6 h-6 text-primary" /></div>
                  <div>
                    <CardTitle className="text-sm sm:text-lg font-black uppercase tracking-widest text-primary">Official Information</CardTitle>
                    <CardDescription className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-1">Personal & Commercial Details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 sm:p-12 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</Label>
                    <Input 
                      value={formData.displayName} 
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                      placeholder="e.g. Kwame Acheampong"
                      className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-sm focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registered Email</Label>
                    <div className="h-14 rounded-2xl bg-slate-100 flex items-center px-6 border border-slate-200">
                      <Mail className="w-4 h-4 text-slate-400 mr-3" />
                      <span className="text-sm font-bold text-slate-500 truncate">{user?.email}</span>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Ghana Card (GHA)</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <Input 
                        value={formData.ghanaCardNumber} 
                        onChange={(e) => setFormData({...formData, ghanaCardNumber: formatGhanaCard(e.target.value)})}
                        placeholder="GHA-000000000-0"
                        className="h-14 rounded-2xl bg-slate-50 border-none pl-12 pr-6 font-bold text-sm focus:ring-2 focus:ring-accent/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <Input 
                        value={formData.companyName} 
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        placeholder="Your Business Entity"
                        className="h-14 rounded-2xl bg-slate-50 border-none pl-12 pr-6 font-bold text-sm focus:ring-2 focus:ring-accent/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5 sm:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contact Phone</Label>
                    <PhoneInput 
                      value={formData.phoneNumber} 
                      onChange={(val) => setFormData({...formData, phoneNumber: val})}
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Coordinates</Label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-5 w-4 h-4 text-slate-300" />
                    <Textarea 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Street, City, Region..."
                      className="min-h-[120px] rounded-2xl bg-slate-50 border-none pl-12 pr-6 py-5 font-bold text-sm focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isUpdating}
                  className="w-full h-16 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-3" /> Save Changes</>}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8 sm:space-y-12">
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-primary text-white p-8">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-5 h-5 text-accent" />
                  <CardTitle className="text-xs font-black uppercase tracking-widest">Account Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase">Update your login credentials by sending a secure reset link to your email.</p>
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={handlePasswordReset}
                  className="w-full h-14 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
                >
                  Reset Password
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 p-8 border-b">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <CardTitle className="text-xs font-black uppercase tracking-widest">Registry Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Initialization</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-primary">
                    <Calendar className="w-3 h-3" />
                    {userData?.createdAt?.toDate ? userData.createdAt.toDate().toLocaleDateString() : 'Active Node'}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Integrity</p>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase px-2 py-0.5">Verified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-400 uppercase">System</p>
                  <p className="text-[10px] font-bold text-primary">SHLCS v2.5</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}