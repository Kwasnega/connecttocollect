
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, useFirestore } from "@/firebase";
import { initiateEmailSignIn, initiateEmailSignUp, initiatePasswordReset, sendVerificationEmail } from "@/firebase/non-blocking-login";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, UserPlus, LogIn, KeyRound, AlertCircle, ShieldCheck, User as UserIcon, ScrollText, FileCheck, ShieldAlert } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { updateProfile, reload, updatePassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { doc, serverTimestamp, setDoc, getDoc, updateDoc, collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required"),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms to continue"),
});

const resetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const forcePasswordSchema = z.object({
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showForceResetModal, setShowForceResetModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const currentSchema = mode === "login" ? loginSchema : mode === "signup" ? signupSchema : resetSchema;

  const form = useForm<any>({
    resolver: zodResolver(currentSchema),
    defaultValues: { email: "", password: "", fullName: "", termsAccepted: false },
  });

  const forceResetForm = useForm<any>({
    resolver: zodResolver(forcePasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" }
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showVerificationModal && auth.currentUser) {
      setIsVerifying(true);
      interval = setInterval(async () => {
        try {
          await reload(auth.currentUser!);
          if (auth.currentUser?.emailVerified) {
            setIsVerifying(false);
            setShowVerificationModal(false);
            toast({ title: "Email Verified", description: "Your account is now active." });
            checkUserNodeStatus(auth.currentUser!.uid);
            if (interval) clearInterval(interval);
          }
        } catch (error) {}
      }, 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [showVerificationModal, auth]);

  async function checkUserNodeStatus(uid: string) {
    const userDoc = await getDoc(doc(firestore, "users", uid));
    const userData = userDoc.data();
    
    if (userData?.passwordResetRequired) {
      setShowForceResetModal(true);
    } else {
      const isAdmin = userData?.role === 'admin' || userData?.email?.includes('admin');
      router.push(isAdmin ? "/admin" : "/dashboard");
    }
  }

  async function handleForceReset(values: any) {
    setIsPending(true);
    try {
      if (!auth.currentUser) return;
      await updatePassword(auth.currentUser, values.newPassword);
      await updateDoc(doc(firestore, "users", auth.currentUser.uid), {
        passwordResetRequired: false
      });
      toast({ title: "Password Updated", description: "Your password has been changed successfully." });
      setShowForceResetModal(false);
      checkUserNodeStatus(auth.currentUser.uid);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
      setIsPending(false);
    }
  }

  async function handleAuth(values: any) {
    setIsPending(true);
    setSuccessMsg(null);
    try {
      if (mode === "login") {
        const userCredential = await initiateEmailSignIn(auth, values.email, values.password);
        
        if (!userCredential.user.emailVerified && !userCredential.user.email?.includes('admin')) {
          await sendVerificationEmail(userCredential.user);
          setShowVerificationModal(true);
          setIsPending(false);
          return;
        }

        await checkUserNodeStatus(userCredential.user.uid);
      } else if (mode === "signup") {
        const userCredential = await initiateEmailSignUp(auth, values.email, values.password);
        await updateProfile(userCredential.user, { displayName: values.fullName });
        
        const userRef = doc(firestore, 'users', userCredential.user.uid);
        await setDoc(userRef, {
          uid: userCredential.user.uid,
          email: values.email,
          displayName: values.fullName,
          createdAt: serverTimestamp(),
          role: values.email.includes('admin') ? 'admin' : 'client'
        });

        if (!values.email.includes('admin')) {
          const adminNotifRef = collection(firestore, 'adminNotifications');
          addDocumentNonBlocking(adminNotifRef, {
            title: 'New User Registered',
            message: `${values.fullName} (${values.email}) has created an account.`,
            type: 'info',
            read: false,
            timestamp: new Date().toISOString(),
            link: '/admin/clients'
          });
        }

        await sendVerificationEmail(userCredential.user);
        setShowVerificationModal(true);
      } else {
        await initiatePasswordReset(auth, values.email);
        setSuccessMsg(`Check your email for password recovery instructions.`);
        setMode("login");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: "Invalid email or password. Please try again." });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <Card className="glass border-none rounded-[2.5rem] overflow-hidden relative w-full shadow-2xl bg-white/90">
        <CardHeader className="pt-12 pb-8 text-center px-10">
          <div className="inline-flex items-center justify-center p-4 bg-primary/5 rounded-2xl mb-6 shadow-inner">
            {mode === "signup" ? <UserPlus className="w-8 h-8 text-primary" /> : <LogIn className="w-8 h-8 text-primary" />}
          </div>
          <CardTitle className="text-3xl font-black text-primary uppercase tracking-tight">
            {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-2">
            SHLCS National Registry Access
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAuth)} className="space-y-6">
              {mode === "signup" && (
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest">Full Name</FormLabel>
                    <FormControl><Input placeholder="Your full name" className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" {...field} /></FormControl>
                    <FormMessage className="text-[10px] font-black" />
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest">Email Address</FormLabel>
                  <FormControl><Input placeholder="email@example.com" className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" {...field} /></FormControl>
                  <FormMessage className="text-[10px] font-black" />
                </FormItem>
              )} />
              {mode !== "reset" && (
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest">Password</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" {...field} /></FormControl>
                    <FormMessage className="text-[10px] font-black" />
                  </FormItem>
                )} />
              )}

              {mode === "signup" && (
                <FormField
                  control={form.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-slate-100 p-4 bg-slate-50/50">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-[9px] font-black uppercase leading-tight cursor-pointer">
                          I agree to the terms and maritime compliance protocols.
                        </FormLabel>
                        <FormMessage className="text-[8px] font-black" />
                      </div>
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full h-16 font-black uppercase rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all" disabled={isPending}>
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "login" ? "Log In" : mode === "signup" ? "Sign Up" : "Send Reset Link"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="pb-12 pt-4 flex flex-col gap-4 px-10">
           <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); form.reset(); }} className="text-[10px] font-black text-accent uppercase tracking-[0.2em] w-full text-center hover:underline">
             {mode === "login" ? "Create an account" : "Back to Log In"}
           </button>
           {mode === "login" && (
             <button onClick={() => setMode("reset")} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest w-full text-center hover:text-primary">
               Forgot Password?
             </button>
           )}
        </CardFooter>
      </Card>

      <Dialog open={showForceResetModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl bg-white font-sans">
          <div className="bg-primary p-10 text-white text-center">
            <ShieldAlert className="w-16 h-16 text-accent mx-auto mb-6" />
            <DialogTitle className="text-xl font-black uppercase">Set New Password</DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-2">You are required to change your password for security.</DialogDescription>
          </div>
          <div className="p-10">
            <Form {...forceResetForm}>
              <form onSubmit={forceResetForm.handleSubmit(handleForceReset)} className="space-y-6">
                <FormField control={forceResetForm.control} name="newPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase">New Password</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-slate-50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={forceResetForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase">Confirm New Password</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-slate-50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full h-14 bg-primary text-white font-black uppercase rounded-xl" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <DialogContent className="max-w-md p-10 text-center rounded-[3rem] border-none shadow-2xl">
          <div className="bg-amber-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShieldAlert className="w-12 h-12 text-amber-500" />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-primary">Verify Email</DialogTitle>
          <p className="text-sm text-slate-500 mt-4 leading-relaxed">
            Check your email for a verification link. Your account will be activated once you click the link.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[9px] font-black uppercase tracking-widest">Waiting for verification...</span>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
