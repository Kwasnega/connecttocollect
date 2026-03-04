
"use client";

import React, { useEffect } from "react";
import { AuthForm } from "@/components/auth-form";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Anchor } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user && !user.isAnonymous) {
      const isAdmin = user.email?.includes("admin") || user.email === "inspector@shlcs.com";
      if (user.emailVerified || isAdmin) {
        router.push(isAdmin ? "/admin" : "/dashboard");
      }
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-[400px] sm:h-[500px] w-full rounded-2xl sm:rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-30">
        <Link href="/">
          <Button variant="ghost" className="text-primary font-bold text-[9px] sm:text-xs uppercase tracking-widest bg-white/40 hover:bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-4 h-9 sm:h-10">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center max-w-lg mt-12 sm:mt-0">
        <div className="mb-6 sm:mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700 px-4">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2 sm:mb-3">
            <div className="bg-primary p-2 sm:p-2.5 rounded-lg sm:rounded-xl shadow-lg">
              <Anchor className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-xl sm:text-3xl font-black text-primary tracking-tighter leading-none">CONNECT</h1>
              <h2 className="text-lg sm:text-2xl font-black text-primary tracking-tighter leading-none">TO COLLECT</h2>
            </div>
          </div>
          <p className="text-[7px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] ml-1">
            Global Logistics Network
          </p>
        </div>
        
        <div className="w-full animate-in fade-in zoom-in-95 duration-500 delay-200">
          <AuthForm />
        </div>
        
        <div className="mt-8 sm:mt-12 text-center space-y-2 opacity-60 px-4">
          <p className="text-[7px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            Secured by SHLCS Infrastructure
          </p>
          <div className="flex gap-3 justify-center text-[6px] sm:text-[8px] font-black text-primary/60 uppercase tracking-tighter">
            <span className="flex items-center gap-1">Official Registry</span>
            <span className="flex items-center gap-1">Maritime Compliance</span>
          </div>
        </div>
      </div>
    </div>
  );
}
