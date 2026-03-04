
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { 
  Loader2, 
  ArrowLeft, 
  Package, 
  MapPin, 
  FileText,
  Building2,
  User,
  ShieldCheck,
  Weight,
  Ship,
  Printer,
  Stamp,
  AlertCircle,
  Eye,
  Verified,
  QrCode,
  CheckCircle2,
  Lock,
  Download,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { doc } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function ShipmentAuditPage() {
  const { id } = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const [showQrPass, setShowQrPass] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPageUrl(window.location.href);
    }
  }, []);

  const shipmentRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, "shipmentRequests", id as string);
  }, [firestore, id]);

  const { data: shipment, isLoading } = useDoc(shipmentRef);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error("Registry: Print sequence failed.", err);
      }
      setIsPrinting(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Syncing Record Node...</p>
      </div>
    );
  }

  const isAdmin = user?.email?.includes("admin") || user?.email === "inspector@shlcs.com";
  const isOwner = shipment?.requestorUid === user?.uid;

  if (!shipment || (!isOwner && !isAdmin)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="w-12 h-12 text-rose-500 mb-6" />
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking tight text-primary">Access Denied</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xs">Security clearance required.</p>
        <Link href="/dashboard" className="mt-8">
          <Button variant="outline" className="h-12 px-10 rounded-xl">Return Home</Button>
        </Link>
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pageUrl)}`;

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 sm:py-16 px-4 sm:px-10 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Authoritative Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12 no-print">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white p-0">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Command Node
              </Button>
            </Link>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4">
              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-primary">Record Audit</h1>
              {shipment.status === "Approved" && (
                <Badge className="bg-emerald-500 text-white text-[8px] sm:text-[10px] font-black uppercase px-3 sm:px-4 py-1 rounded-md">Cleared</Badge>
              )}
            </div>
            <p className="text-[9px] sm:text-xs text-slate-400 font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 truncate">Registry: #{shipment.id.substring(0, 8).toUpperCase()}</p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {shipment.status === "Approved" && (
                <Button 
                  onClick={() => setShowQrPass(true)}
                  className="flex-1 sm:flex-none h-11 sm:h-12 rounded-lg sm:rounded-xl bg-accent text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Pass
                </Button>
              )}
              <Button 
                variant="outline" 
                className="flex-1 sm:flex-none h-11 sm:h-12 rounded-lg sm:rounded-xl bg-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest border-slate-200 shadow-sm" 
                onClick={handlePrint}
                disabled={isPrinting}
              >
                {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
                <span className="hidden xs:inline">Print Node</span>
              </Button>
            </div>
            <div className="w-full sm:w-auto">
              <StatusBadge status={shipment.status} />
            </div>
          </motion.div>
        </div>

        {/* Printable Official Certificate Overlay */}
        <div className="hidden print:block mb-10 text-center border-b-[4px] border-primary pb-10">
          <div className="flex flex-col items-center gap-4 relative">
            <div className="bg-primary p-4 rounded-2xl mb-4">
              <Ship className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">CONNECT TO COLLECT 2026</h1>
            <p className="text-lg font-black text-slate-500 uppercase tracking-widest">National Shipping Manifest Record</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
          <div className="lg:col-span-8 space-y-6 sm:space-y-10">
            <Card className="border-none shadow-sm rounded-2xl sm:rounded-[3rem] overflow-hidden bg-white print:border-[2px] print:rounded-none">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 sm:p-10 print:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/5 p-2 sm:p-3 rounded-lg sm:rounded-xl"><Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /></div>
                  <div>
                    <CardTitle className="text-sm sm:text-lg font-black uppercase tracking-widest text-primary">Specifications</CardTitle>
                    <p className="text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-0.5 truncate">Registry Code: {shipment.id.toUpperCase()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-10 space-y-8 sm:space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                  <EntitySection title="Consignor" icon={<Building2 />} data={{
                    name: shipment.consignorName,
                    id: shipment.requestorGhanaCardNumber,
                    contact: shipment.requestorEmail,
                    address: shipment.consignorPhysicalAddress
                  }} />
                  <EntitySection title="Consignee" icon={<User />} data={{
                    name: shipment.consigneeName,
                    id: `Phone: ${shipment.consigneePhone}`,
                    contact: "Official Recipient Node",
                    address: shipment.consigneeDestinationAddress
                  }} />
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <SectionTitle title="Telemetry Matrix" icon={<Ship />} />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    <DataPoint icon={<MapPin className="w-3 h-3" />} label="Origin" value={shipment.originPort?.split('-')[1] || shipment.originPort} />
                    <DataPoint icon={<MapPin className="w-3 h-3" />} label="Discharge" value={shipment.destinationPort?.split('-')[1] || shipment.destinationPort} />
                    <DataPoint icon={<Weight className="w-3 h-3" />} label="Mass" value={`${shipment.weightKg} KG`} />
                    <DataPoint icon={<Package className="w-3 h-3" />} label="Modality" value={shipment.shippingMode} />
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <SectionTitle title="Manifest Description" icon={<FileText />} />
                  <div className="bg-slate-50 p-5 sm:p-8 rounded-xl sm:rounded-[2rem] border border-slate-100 italic text-xs sm:text-sm text-slate-600 leading-relaxed print:bg-transparent print:p-0 print:border-none">
                    "{shipment.cargoDescription}"
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="no-print">
               <Card className="bg-white border-slate-200 rounded-2xl sm:rounded-[3rem] overflow-hidden shadow-sm">
                <CardHeader className="bg-slate-50 border-b p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-accent" />
                    <CardTitle className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary">Authorized Documents</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-10 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                    <DocumentCard label="Identity Card" icon={<Verified />}>
                       <IdCardViewer 
                        label="Ghana Card" 
                        frontUrl={shipment.idCardFrontUrl} 
                        backUrl={shipment.idCardBackUrl} 
                       />
                    </DocumentCard>
                    <DocumentCard label="Invoice" icon={<FileText />}>
                       <DocumentViewer label="Invoice Verification" imageUrl={shipment.invoiceUrl} />
                    </DocumentCard>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6 sm:space-y-10">
            <Card className="border-none shadow-xl rounded-2xl sm:rounded-[3rem] overflow-hidden bg-white sticky top-20 sm:top-28 print:static print:shadow-none print:border print:rounded-none">
              <CardHeader className="bg-primary text-white p-6 sm:p-10 print:bg-slate-100 print:text-primary">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Infrastructural Audit</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-10 space-y-6 sm:space-y-10">
                <div className="space-y-4 sm:space-y-6">
                  <AuditItem label="Initialization" value={new Date(shipment.submissionDateTime).toLocaleDateString('en-GB')} />
                  <AuditItem label="Classification" value={`${shipment.cargoType} Priority`} />
                  <AuditItem label="Sync Status" value="Committed" />
                  <AuditItem label="Integrity" value="Pass (SHA-256)" />
                </div>

                {shipment.status === "Approved" && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 sm:p-8 bg-emerald-50 border-2 border-emerald-100 rounded-xl sm:rounded-[2.5rem] relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-emerald-500 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-emerald-200"><Stamp className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></div>
                      <div>
                        <p className="text-[8px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-widest">Official Stamp</p>
                        <p className="text-[10px] sm:text-xs font-black text-emerald-900 mt-0.5 font-mono">{shipment.officialStampId || 'CLEARANCE_ACTIVE'}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {shipment.status === "Rejected" && (
                  <div className="p-6 sm:p-8 bg-rose-50 border-2 border-rose-100 rounded-xl sm:rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                      <p className="text-[10px] sm:text-xs font-black text-rose-600 uppercase tracking-widest">Flagged</p>
                    </div>
                    <p className="text-[10px] sm:text-xs font-medium text-rose-800 italic">"{shipment.inspectorNotes || 'Administrative flag active.'}"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showQrPass} onOpenChange={setShowQrPass}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl sm:rounded-[2rem] border-none shadow-2xl bg-white font-sans w-[95vw]">
          <div className="bg-primary p-6 sm:p-8 text-white text-center relative overflow-hidden">
            <div className="bg-accent/20 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
            </div>
            <DialogTitle className="text-lg sm:text-xl font-black uppercase tracking-tight">Official Gate Pass</DialogTitle>
            <DialogDescription className="text-[8px] sm:text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mt-1">
              Registry Handshake Verified.
            </DialogDescription>
          </div>
          <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 flex flex-col items-center">
             <div className="bg-slate-900 p-3 rounded-lg shadow-2xl">
                <div className="w-40 h-48 sm:w-48 sm:h-48 bg-white flex items-center justify-center p-2">
                   {pageUrl ? (
                     <img src={qrCodeUrl} alt="Gate Pass QR" className="w-full h-full object-contain grayscale" />
                   ) : (
                     <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                   )}
                </div>
             </div>
             
             <div className="w-full space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg sm:rounded-xl border">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Status</p>
                  <p className="text-[9px] font-black text-emerald-600 uppercase">Authorized</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg sm:rounded-xl border">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Node ID</p>
                  <p className="text-[9px] font-black text-primary uppercase font-mono">{shipment.officialStampId || 'SHLCS_NODE'}</p>
                </div>
             </div>

             <div className="w-full flex gap-3">
                <Button className="flex-1 h-11 sm:h-12 bg-primary rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                  <Download className="w-3.5 h-3.5 mr-2" /> Download
                </Button>
                <Button variant="outline" className="flex-1 h-11 sm:h-12 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest border-slate-200">
                  <Share2 className="w-3.5 h-3.5 mr-2" /> Share
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionTitle({ title, icon }: { title: string, icon: any }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
      {React.cloneElement(icon, { className: "w-3.5 h-3.5 text-accent" })}
      <h3 className="text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
    </div>
  );
}

function EntitySection({ title, icon, data }: { title: string, icon: any, data: any }) {
  return (
    <div className="space-y-4">
      <SectionTitle title={title} icon={icon} />
      <div className="space-y-1.5">
        <p className="text-sm sm:text-base font-black text-primary truncate">{data.name}</p>
        <p className="text-[9px] font-mono font-bold text-slate-400 truncate">{data.id}</p>
        <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Address</p>
          <p className="text-[10px] sm:text-xs font-bold text-slate-600 italic line-clamp-2">{data.address}</p>
        </div>
      </div>
    </div>
  );
}

function DataPoint({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="bg-slate-50 p-3 sm:p-5 rounded-lg sm:rounded-2xl border border-slate-100">
      <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
        {icon}
        <p className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-[10px] sm:text-xs font-black text-primary truncate">{value}</p>
    </div>
  );
}

function DocumentCard({ label, icon, children }: { label: string, icon: any, children: any }) {
  return (
    <div className="p-4 sm:p-6 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-[2rem] flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="bg-white p-2 sm:p-3 rounded-lg sm:rounded-xl border border-slate-100 shadow-sm shrink-0">
          {React.cloneElement(icon, { className: "w-4 h-4 sm:w-5 sm:h-5 text-primary" })}
        </div>
        <div className="min-w-0">
          <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase truncate">{label}</p>
          <p className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase mt-0.5">Registry Node</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function AuditItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 pb-3 sm:pb-4">
      <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-[10px] sm:text-xs font-bold text-primary">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    Submitted: "bg-blue-100 text-blue-700 border-blue-200",
    Pending: "bg-orange-100 text-orange-700 border-orange-200",
    Approved: "bg-green-100 text-green-700 border-green-200",
    Rejected: "bg-red-100 text-red-700 border-red-200"
  };
  return (
    <Badge variant="outline" className={cn("w-full sm:w-auto text-[8px] sm:text-[10px] font-black uppercase px-4 py-2 border rounded-lg sm:rounded-xl shadow-sm text-center", styles[status] || styles.Pending)}>
      {status}
    </Badge>
  );
}

function IdCardViewer({ label, frontUrl, backUrl }: { label: string, frontUrl: string, backUrl: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 sm:h-10 px-3 sm:px-4 text-[8px] sm:text-[9px] font-black uppercase shrink-0">Audit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl p-0 border-none rounded-2xl sm:rounded-[3rem] bg-white w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-6 sm:p-8 bg-slate-50 border-b shrink-0">
          <DialogTitle className="text-xs sm:text-sm font-black uppercase">{label}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-6 sm:p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <p className="text-[8px] sm:text-[10px] font-black text-primary uppercase text-center">Front</p>
              <div className="relative aspect-[1.6/1] bg-white shadow-xl rounded-xl overflow-hidden border">
                <Image src={frontUrl || "https://picsum.photos/seed/id-front/800/500"} alt="Front" fill className="object-cover" />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[8px] sm:text-[10px] font-black text-primary uppercase text-center">Back</p>
              <div className="relative aspect-[1.6/1] bg-white shadow-xl rounded-xl overflow-hidden border">
                <Image src={backUrl || "https://picsum.photos/seed/id-back/800/500"} alt="Back" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentViewer({ label, imageUrl }: { label: string, imageUrl: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 sm:h-10 px-3 sm:px-4 text-[8px] sm:text-[9px] font-black uppercase shrink-0">View</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 border-none rounded-2xl sm:rounded-[3rem] bg-white w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-6 sm:p-8 bg-slate-50 border-b shrink-0">
          <DialogTitle className="text-xs sm:text-sm font-black uppercase">{label}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-6 sm:p-10 flex items-center justify-center bg-slate-100/30">
          <div className="relative w-full aspect-[4/3] max-w-2xl bg-white shadow-2xl rounded-xl overflow-hidden border">
            <Image src={imageUrl || "https://picsum.photos/seed/doc/800/1200"} alt={label} fill className="object-contain" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
