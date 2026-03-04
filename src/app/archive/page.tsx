"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Archive, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ArchivePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard">
              <Button variant="ghost" className="mb-4 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Command
              </Button>
            </Link>
            <h1 className="text-4xl font-black text-primary uppercase tracking-tight flex items-center gap-4">
              <Archive className="w-10 h-10 text-accent" />
              Manifest Archive
            </h1>
            <p className="text-muted-foreground text-sm font-medium mt-2">Historic logistics logs and legacy records.</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-20 text-center border-dashed border-2 border-primary/5">
          <div className="bg-secondary/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Search className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-2">Archive Repository Empty</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto font-medium">No legacy data streams found for your organization profile at this time.</p>
        </div>
      </div>
    </div>
  );
}
