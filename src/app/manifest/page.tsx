
"use client";

import React, { useEffect } from "react";
import { FormHeader } from "@/components/form-header";
import { ShipShapeForm } from "@/components/ship-shape-form";
import { useUser, useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import Link from "next/link";

export default function ManifestPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-6 sm:py-10 px-4 sm:px-6 md:px-0">
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-4">
        <Link href="/dashboard">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] font-bold text-primary uppercase tracking-tighter hover:bg-primary/5"
          >
            <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        {!user.isAnonymous && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => signOut(auth)}
            className="text-[10px] font-bold text-primary uppercase tracking-tighter hover:bg-primary/5"
          >
            <LogOut className="w-3 h-3 mr-2" />
            Sign Out
          </Button>
        )}
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl p-5 sm:p-8 md:p-10 border border-primary/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full -ml-24 -mb-24 pointer-events-none" />
        
        <main className="relative z-10">
          <FormHeader />
          <ShipShapeForm />
        </main>
        
        <footer className="mt-12 pt-6 border-t border-muted text-center">
          <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
            © 2026 Connect to Collect • Global Logistics & Trading Solutions
          </p>
          <div className="mt-2 text-[8px] text-muted-foreground/60 uppercase tracking-tighter">
            Secured by ShipShape™ Technology • Official Shipping Manifest Portal
          </div>
        </footer>
      </div>
    </div>
  );
}
