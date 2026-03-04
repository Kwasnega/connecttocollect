
"use client";

import React from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Compass, 
  Bot, 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  Database,
  Globe,
  Ship,
  Map,
  Scan,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 p-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Command Node
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-primary uppercase tracking-tight flex items-center gap-4">
                <Compass className="w-10 h-10 text-accent" />
                System Integration Roadmap
              </h1>
              <p className="text-muted-foreground text-sm font-medium mt-2">Future operational nodes and infrastructural hardening sequence 2026-2027.</p>
            </div>
            <Badge variant="outline" className="h-10 px-6 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest bg-white">
              Phase: MVP Hardening
            </Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <RoadmapSection 
            title="Q3 2026: Intelligence Layer" 
            icon={<Bot className="text-accent" />}
            items={[
              { title: "AI-OCR Ghana Card Verification", desc: "Automated identity parsing and technical validation against national registry.", status: "Design Phase" },
              { title: "Automated Risk Scoring 2.0", desc: "Predictive cargo flagging based on historical discharge patterns and origin nodes.", status: "Development" },
              { title: "Voice-Activated Registry Query", desc: "Inspector command node for hands-free cargo lookup at the quay.", status: "Prototype" }
            ]}
          />
          <RoadmapSection 
            title="Q4 2026: Ecosystem Interop" 
            icon={<Database className="text-emerald-500" />}
            items={[
              { title: "National Customs (ICUMS) Handshake", desc: "Direct API link for sub-second duty assessment and tax clearance.", status: "Scheduled" },
              { title: "Unified Payment Gateway", desc: "Integration with local banking nodes for instant Port Charge settlements.", status: "Research" },
              { title: "Digital Manifest QR Terminal", desc: "Hardware-synced terminal nodes at all harbour entry/exit points.", status: "Design Phase" }
            ]}
          />
          <RoadmapSection 
            title="Q1 2027: Maritime Telemetry" 
            icon={<Ship className="text-blue-500" />}
            items={[
              { title: "AIS Vessel Real-Time Tracking", desc: "Visual tracking of vessels currently carrying committed registry cargo.", status: "Scheduled" },
              { title: "Terminal Slot Reservation", desc: "Automated booking system for discharge bays based on manifest volume.", status: "Concept" },
              { title: "Environmental Impact Scoring", desc: "Vessel emission tracking and 'Green Port' certification node.", status: "Concept" }
            ]}
          />
          <RoadmapSection 
            title="Q2 2027: Security Hardening" 
            icon={<ShieldCheck className="text-amber-500" />}
            items={[
              { title: "Blockchain Immutable Audit Log", desc: "Moving the registry ledger to a decentralized, immutable block state.", status: "Research" },
              { title: "Biometric Inspector Access", desc: "Multi-factor biometric handshake for all technical clearance decisions.", status: "Prototype" },
              { title: "Regional Node Expansion", desc: "Expanding registry synchronization to Togo, Benin, and Nigeria hubs.", status: "Scheduled" }
            ]}
          />
        </div>

        <div className="bg-primary p-12 rounded-[3rem] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
             <div className="space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-tight">Technical Vision Statement</h3>
                <p className="text-white/60 text-sm max-w-xl leading-relaxed">
                  The Connect to Collect 2026 platform is engineered to become the definitive technical backbone for West African maritime trade. By centralizing telemetry, intelligence, and security, we eliminate the administrative latency that hinders global logistics growth.
                </p>
                <div className="flex gap-4 pt-4">
                  <Badge className="bg-white/10 text-white border-none text-[9px] font-black uppercase px-4 py-2">OpenAPI Ready</Badge>
                  <Badge className="bg-white/10 text-white border-none text-[9px] font-black uppercase px-4 py-2">GDPR Compliant</Badge>
                  <Badge className="bg-white/10 text-white border-none text-[9px] font-black uppercase px-4 py-2">Cloud-Native</Badge>
                </div>
             </div>
             <div className="bg-white/10 p-10 rounded-[2.5rem] border border-white/10 text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent">System Integrity Status</p>
                <p className="text-4xl font-black tracking-tighter">OPTIMAL</p>
                <p className="text-[9px] font-bold text-white/40 uppercase mt-2">Global Registry Node Active</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoadmapSection({ title, icon, items }: any) {
  return (
    <Card className="bg-white border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
      <CardHeader className="bg-slate-50 border-b p-8 flex flex-row items-center gap-4">
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
          {React.cloneElement(icon, { className: "w-6 h-6" })}
        </div>
        <div>
          <CardTitle className="text-xs font-black uppercase tracking-widest">{title}</CardTitle>
          <CardDescription className="text-[8px] font-bold uppercase tracking-widest mt-1">Operational Sequence</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {items.map((item: any, idx: number) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black text-primary uppercase">{item.title}</h4>
              <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-100">{item.status}</Badge>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
