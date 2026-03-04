
"use client";

import React from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Ship,
  Loader2,
  Globe2,
  Compass,
  Activity,
  Award,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Github,
  Twitter,
  Linkedin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/firebase";
import { motion, useScroll, useTransform } from "framer-motion";

export default function LandingPage() {
  const { user, isUserLoading } = useUser();
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);

  const isGuest = !user || user.isAnonymous;
  const primaryHref = isGuest ? "/login" : "/dashboard";
  const primaryText = isGuest ? "Initialize Portal" : "Go to Dashboard";

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-accent/30 overflow-x-hidden font-sans text-primary">
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 h-16 sm:h-20 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-full flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 sm:gap-4"
          >
            <div className="bg-primary p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg">
              <Ship className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[10px] sm:text-sm font-black text-primary tracking-tighter leading-none uppercase">CONNECT TO COLLECT</h1>
              <h2 className="text-[6px] sm:text-[9px] font-bold text-accent uppercase tracking-[0.3em] mt-0.5 sm:mt-1">Global Logistics 2026</h2>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 sm:gap-6"
          >
            {isGuest && (
              <Link href="/login" className="hidden xs:block">
                <Button variant="ghost" className="text-slate-600 hover:text-primary text-[10px] font-black uppercase tracking-widest h-9 px-3">Login</Button>
              </Link>
            )}
            <Link href={primaryHref}>
              <Button className="bg-primary hover:bg-primary/90 text-white text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-3 sm:px-8 h-9 sm:h-11 rounded-lg sm:rounded-xl shadow-xl shadow-primary/10">
                {primaryText}
              </Button>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section - Cinematic Video Background */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-950 px-4">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/50 z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-transparent to-black/80 z-20" />
          
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover saturate-[1.2] contrast-[1.1]"
            poster="https://images.unsplash.com/photo-1494412651409-8963ce7935a7?q=80&w=2560&auto=format&fit=crop"
          >
            <source src="https://cdn.pixabay.com/video/2019/12/17/30438-381481134_large.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="relative z-30 max-w-6xl mx-auto text-center space-y-6 sm:space-y-12 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-full text-white text-[7px] sm:text-[10px] font-black uppercase tracking-[0.4em] backdrop-blur-2xl shadow-2xl"
          >
            <Globe2 className="w-3 h-3 sm:w-4 sm:h-4 text-accent animate-pulse" />
            Operational Command Node 2026
          </motion.div>
          
          <div className="space-y-2 sm:space-y-6">
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 50 }}
              className="text-5xl sm:text-7xl md:text-8xl lg:text-[9rem] xl:text-[11rem] font-black text-white tracking-[-0.05em] leading-[0.85] drop-shadow-[0_20px_20px_rgba(0,0,0,0.6)]"
            >
              GLOBAL <br />
              <span className="text-accent underline decoration-white/10 underline-offset-8">LOGISTICS</span>
            </motion.h1>
          </div>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.8 }}
            className="text-[10px] sm:text-xl text-white/90 max-w-2xl mx-auto font-bold leading-relaxed tracking-tight px-4"
          >
            Automated Maritime Infrastructure. <br className="hidden sm:block" />
            The definitive technical registry for international trading nodes.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-4 sm:pt-8 w-full max-w-[280px] sm:max-w-none mx-auto"
          >
            <Link href={primaryHref} className="w-full sm:w-auto">
              <Button size="lg" className="group w-full sm:w-auto bg-accent hover:bg-white hover:text-primary text-primary h-12 sm:h-16 px-8 sm:px-12 rounded-xl sm:rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] sm:text-[11px] shadow-2xl transition-all hover:scale-105 active:scale-95">
                {primaryText}
                <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>

        <motion.div 
          style={{ y: y1 }}
          className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 sm:gap-3 opacity-40 hidden xs:flex"
        >
          <p className="text-[7px] sm:text-[9px] font-black text-white uppercase tracking-[0.4em]">Scroll for Intelligence</p>
          <div className="w-px h-8 sm:h-12 bg-gradient-to-b from-white to-transparent" />
        </motion.div>
      </section>

      {/* Capabilities Section */}
      <section className="py-16 sm:py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-20 items-center mb-16 sm:mb-32">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6 sm:space-y-8 text-center lg:text-left"
            >
              <Badge className="bg-accent/10 text-accent text-[7px] sm:text-[10px] font-black uppercase tracking-[0.3em] px-4 sm:px-6 py-1.5 sm:py-2 rounded-full border-none">Operational Specs</Badge>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-primary uppercase tracking-tighter leading-none">
                Hardware Accelerated <br /> <span className="text-slate-300">Logistics Oversight</span>
              </h2>
              <p className="text-xs sm:text-lg text-slate-500 font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
                The SHLCS protocol eliminates administrative latency through sub-second registry synchronization and secure identification verification.
              </p>
              <div className="grid grid-cols-2 gap-6 sm:gap-10 pt-4 sm:pt-6">
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-2xl sm:text-4xl font-black text-primary tracking-tighter">99.9%</p>
                  <p className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Clearance Velocity</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-2xl sm:text-4xl font-black text-primary tracking-tighter">Instant</p>
                  <p className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Handshake</p>
                </div>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-video rounded-2xl sm:rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100"
            >
              <img 
                src="https://images.unsplash.com/photo-1494412651409-8963ce7935a7?q=80&w=2000&auto=format&fit=crop" 
                alt="Logistics Technology" 
                className="w-full h-full object-cover saturate-[1.1]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
              <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="bg-white/20 backdrop-blur-2xl p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-white/20"><Activity className="w-3 h-3 sm:w-5 sm:h-5 text-white" /></div>
                  <span className="text-white text-[7px] sm:text-[10px] font-black uppercase tracking-widest">Live Registry Feed</span>
                </div>
                <div className="bg-accent h-1 sm:h-2 w-16 sm:w-32 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="h-full w-full bg-white/50"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            <FeatureCard 
              icon={<ShieldCheck />}
              title="Quantum Vault"
              description="End-to-end encryption for every manifest registry and trade document."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Zap />}
              title="Real-time Sync"
              description="Sub-second synchronization across global port authority clearance nodes."
              delay={0.2}
            />
            <FeatureCard 
              icon={<Compass />}
              title="Audit Ledger"
              description="Immutable digital records for every inspection note and technical stamp."
              delay={0.3}
            />
            <FeatureCard 
              icon={<Award />}
              title="Compliant"
              description="Backed by international maritime law and regional port standards."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Advanced Global Footer */}
      <footer className="bg-primary pt-16 sm:pt-32 pb-8 sm:pb-16 text-white border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-16 mb-12 sm:mb-24">
            <div className="lg:col-span-1 space-y-6 sm:space-y-8">
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-lg sm:p-3 sm:rounded-xl">
                  <Ship className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-xl font-black text-white uppercase tracking-widest leading-none">CONNECT TO COLLECT</p>
                  <p className="text-[6px] sm:text-[9px] font-bold text-accent uppercase tracking-[0.4em] mt-1">Operational Node 2026</p>
                </div>
              </div>
              <p className="text-[9px] sm:text-xs font-medium text-white/50 leading-relaxed max-w-sm">
                The definitive technical registry for global trading nodes. Eliminating administrative latency.
              </p>
              <div className="flex gap-3 sm:gap-4">
                <FooterSocial icon={<Twitter />} />
                <FooterSocial icon={<Linkedin />} />
                <FooterSocial icon={<Github />} />
              </div>
            </div>

            <div className="hidden sm:block">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-6 sm:mb-8">Operational Domains</h4>
              <ul className="space-y-3 sm:space-y-4">
                <FooterLink label="Global Trading" />
                <FooterLink label="Maritime Shipping" />
                <FooterLink label="Logistics Engine" />
                <FooterLink label="Cargo Clearing" />
              </ul>
            </div>

            <div className="space-y-6 sm:space-y-0">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-4 sm:mb-8">Authoritative Contact</h4>
              <ul className="grid grid-cols-1 gap-4 sm:gap-6">
                <li className="flex items-center sm:items-start gap-3">
                  <div className="bg-white/5 p-1.5 sm:p-2 rounded-lg border border-white/10 shrink-0"><Phone className="w-3 h-3 text-accent" /></div>
                  <div>
                    <p className="text-[7px] sm:text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Dubai</p>
                    <p className="text-[9px] sm:text-xs font-bold">+971 528 739 190</p>
                  </div>
                </li>
                <li className="flex items-center sm:items-start gap-3">
                  <div className="bg-white/5 p-1.5 sm:p-2 rounded-lg border border-white/10 shrink-0"><Phone className="w-3 h-3 text-accent" /></div>
                  <div>
                    <p className="text-[7px] sm:text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Ghana</p>
                    <p className="text-[9px] sm:text-xs font-bold">+233 244 830 066</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="hidden lg:block">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-8">Regional Hubs</h4>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <MapPin className="w-4 h-4 text-white/20" />
                  <span className="text-xs font-bold">Jebel Ali Port, Dubai, UAE</span>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin className="w-4 h-4 text-white/20" />
                  <span className="text-xs font-bold">Tema Harbour, Ghana</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 sm:pt-16 border-t border-white/5">
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-8 text-center md:text-left">
              <p className="text-[7px] sm:text-[10px] text-white/30 font-black uppercase tracking-[0.4em]">© 2026 Connect to Collect Master Registry</p>
              <div className="flex gap-4 text-[7px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest">
                <button className="hover:text-accent transition-colors">Security</button>
                <button className="hover:text-accent transition-colors">Privacy</button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3 sm:w-4 h-3 sm:h-4 text-accent" />
              <p className="text-[7px] sm:text-[9px] text-accent font-black uppercase tracking-[0.5em]">ShipShape™ Secured</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="group p-6 sm:p-10 bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 hover:border-accent/30 transition-all hover:-translate-y-2 shadow-sm hover:shadow-xl"
    >
      <div className="bg-primary/5 w-10 h-10 sm:w-16 sm:h-16 rounded-lg sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-8 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
        {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5 sm:w-8 sm:h-8" })}
      </div>
      <h3 className="text-sm sm:text-xl font-black text-primary mb-2 sm:mb-4 uppercase tracking-tight">{title}</h3>
      <p className="text-[9px] sm:text-xs text-slate-500 leading-relaxed font-medium">{description}</p>
    </motion.div>
  );
}

function FooterLink({ label }: { label: string }) {
  return (
    <li>
      <button className="text-[10px] sm:text-xs font-bold text-white/50 hover:text-accent flex items-center gap-2 group transition-all">
        <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
        {label}
      </button>
    </li>
  );
}

function FooterSocial({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-all group">
      {React.cloneElement(icon as React.ReactElement, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4" })}
    </button>
  );
}
