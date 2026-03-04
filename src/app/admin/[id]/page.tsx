
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDoc, useFirestore, useUser, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { 
  Loader2, 
  ArrowLeft, 
  Zap,
  Verified,
  Lock,
  FileText,
  Building2,
  User,
  MapPin,
  Weight,
  Ship,
  Phone,
  Mail,
  CreditCard,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { doc, serverTimestamp, collection } from "firebase/firestore";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";

export default function ManifestReviewPage() {
  const { id } = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [inspectorNotes, setInspectorNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const shipmentRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, "shipmentRequests", id as string);
  }, [firestore, id]);

  const { data: shipment, isLoading } = useDoc(shipmentRef);

  const handleUpdateStatus = (status: "Approved" | "Rejected") => {
    if (!shipmentRef || !firestore || !shipment) return;
    setIsProcessing(true);

    const stampId = "SHLCS-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    updateDocumentNonBlocking(shipmentRef, {
      status,
      inspectorNotes,
      inspectedBy: user?.email,
      inspectedAt: serverTimestamp(),
      officialStampId: stampId
    });

    const userNotifRef = collection(firestore, 'notifications', shipment.requestorUid, 'userNotifications');
    addDocumentNonBlocking(userNotifRef, {
      title: `Shipment ${status}`,
      message: `Your manifest #${id?.toString().substring(0, 8).toUpperCase()} has been ${status.toLowerCase()}.`,
      type: status === 'Approved' ? 'success' : 'alert',
      read: false,
      timestamp: new Date().toISOString(),
      link: `/shipment/${id}`
    });

    toast({ title: "Status Updated", description: `The manifest has been marked as ${status}.` });
    router.push("/admin");
  };

  if (isLoading || !shipment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const isFinalized = shipment.status === "Approved" || shipment.status === "Rejected";

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-primary py-6 sm:py-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-12">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/admin">
              <Button variant="outline" className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-white text-slate-400">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-primary truncate">Inspection Report</h1>
              <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 sm:mt-2 truncate">Reference: #{shipment.id.toUpperCase()}</p>
            </div>
          </div>
          <Badge className="bg-white text-primary border border-slate-200 px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-black uppercase w-fit">{shipment.status}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
          <div className="lg:col-span-8 space-y-6 sm:space-y-10">
            {/* Consignor & Recipient */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
              <Card className="bg-white border-none rounded-2xl sm:rounded-[2.5rem] shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 p-6 sm:p-8 border-b">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <CardTitle className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Sender Info</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-4">
                  <DetailItem label="Entity Name" value={shipment.consignorName} />
                  <DetailItem label="Ghana Card" value={shipment.requestorGhanaCardNumber} icon={<CreditCard className="w-3 h-3" />} />
                  <DetailItem label="Email" value={shipment.requestorEmail} icon={<Mail className="w-3 h-3" />} />
                  <DetailItem label="Phone" value={shipment.requestorPhoneNumber} icon={<Phone className="w-3 h-3" />} />
                  <DetailItem label="Address" value={shipment.consignorPhysicalAddress} />
                </CardContent>
              </Card>

              <Card className="bg-white border-none rounded-2xl sm:rounded-[2.5rem] shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 p-6 sm:p-8 border-b">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <CardTitle className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Receiver Info</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-4">
                  <DetailItem label="Receiver Name" value={shipment.consigneeName} />
                  <DetailItem label="Phone" value={shipment.consigneePhone} icon={<Phone className="w-3 h-3" />} />
                  <DetailItem label="Delivery Address" value={shipment.consigneeDestinationAddress} />
                </CardContent>
              </Card>
            </div>

            {/* Logistics Matrix */}
            <Card className="bg-white border-none rounded-2xl sm:rounded-[3rem] shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 p-6 sm:p-10 border-b border-slate-100">
                 <div className="flex items-center gap-4">
                    <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Shipment Details</CardTitle>
                 </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-10 space-y-8 sm:space-y-12">
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10">
                    <DataPoint label="Origin" value={shipment.originPort} icon={<MapPin className="w-3.5 h-3.5 text-accent" />} />
                    <DataPoint label="Discharge" value={shipment.destinationPort} icon={<MapPin className="w-3.5 h-3.5 text-accent" />} />
                    <DataPoint label="Weight" value={`${shipment.weightKg} KG`} icon={<Weight className="w-3.5 h-3.5 text-accent" />} />
                    <DataPoint label="Mode" value={`${shipment.shippingMode} Freight`} icon={<Ship className="w-3.5 h-3.5 text-accent" />} />
                 </div>
                 <div className="space-y-3 sm:space-y-4">
                    <SectionLabel label="Cargo Manifest" />
                    <div className="bg-slate-50 p-6 sm:p-8 rounded-xl sm:rounded-[2rem] border border-slate-100 italic text-[11px] sm:text-sm text-slate-600 leading-relaxed">
                        "{shipment.cargoDescription}"
                    </div>
                 </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none rounded-2xl sm:rounded-[3rem] shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 p-6 sm:p-8 border-b">
                 <div className="flex items-center gap-3">
                    <Verified className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Documents</CardTitle>
                 </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-10 space-y-4 sm:space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <IdCardNode label="ID Card" frontUrl={shipment.idCardFrontUrl} backUrl={shipment.idCardBackUrl} />
                    <DocumentNode label="Commercial Invoice" url={shipment.invoiceUrl} />
                 </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6 sm:space-y-10">
            <Card className="bg-white border-none rounded-2xl sm:rounded-[3rem] shadow-xl overflow-hidden sticky top-20 sm:top-28">
              <CardHeader className="bg-primary text-white p-6 sm:p-10">
                <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Decision Console</CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-10 space-y-6 sm:space-y-8">
                {isFinalized ? (
                  <div className="text-center space-y-4">
                    <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-slate-200 mx-auto" />
                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400">Record Locked</p>
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 uppercase font-black px-4 py-1.5 rounded-lg">{shipment.status}</Badge>
                    <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 mt-4 truncate">Inspector: {shipment.inspectedBy}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 sm:space-y-4">
                      <LabelNode label="Inspection Notes" />
                      <Textarea 
                        placeholder="Type your findings here..." 
                        className="min-h-[120px] sm:min-h-[160px] rounded-xl sm:rounded-2xl bg-slate-50 border-none px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm"
                        value={inspectorNotes}
                        onChange={(e) => setInspectorNotes(e.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      <Button className="w-full h-14 sm:h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-emerald-200" onClick={() => handleUpdateStatus("Approved")} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Approve & Clear"}
                      </Button>
                      <Button variant="outline" className="w-full h-14 sm:h-16 border-rose-200 text-rose-600 hover:bg-rose-50 uppercase font-black rounded-xl sm:rounded-2xl" onClick={() => handleUpdateStatus("Rejected")} disabled={isProcessing}>
                        Reject & Flag
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, icon }: { label: string, value?: string, icon?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[7px] sm:text-[8px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[10px] sm:text-xs font-bold text-primary leading-tight truncate">{value || "---"}</p>
      </div>
    </div>
  );
}

function DataPoint({ label, value, icon }: { label: string, value?: string, icon: React.ReactNode }) {
  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="bg-slate-50 p-2 sm:p-3 rounded-lg sm:rounded-xl w-fit border border-slate-100">{icon}</div>
      <div>
        <p className="text-[7px] sm:text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{label}</p>
        <p className="text-[9px] sm:text-xs font-black text-primary uppercase truncate">{value || "Not Specified"}</p>
      </div>
    </div>
  );
}

function IdCardNode({ label, frontUrl, backUrl }: any) {
  return (
    <div className="p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl border flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-[9px] sm:text-[10px] font-black uppercase text-primary truncate">{label}</p>
        <p className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase mt-0.5">Verification required</p>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 sm:h-10 text-[8px] sm:text-[9px] font-black uppercase shrink-0">View ID</Button>
        </DialogTrigger>
        <DialogContent className="max-w-5xl p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] bg-white w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-[10px] sm:text-xs font-black uppercase">Identity Verification</DialogTitle>
            <DialogDescription className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Confirm identity details match the manifest.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-6">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-[8px] sm:text-[9px] font-black uppercase text-center text-primary">Front Side</p>
              <div className="relative aspect-[1.6/1] rounded-xl sm:rounded-2xl border overflow-hidden shadow-sm bg-slate-100">
                <Image src={frontUrl || "https://picsum.photos/seed/id-front/800/500"} alt="Front" fill className="object-cover" />
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <p className="text-[8px] sm:text-[9px] font-black uppercase text-center text-primary">Back Side</p>
              <div className="relative aspect-[1.6/1] rounded-xl sm:rounded-2xl border overflow-hidden shadow-sm bg-slate-100">
                <Image src={backUrl || "https://picsum.photos/seed/id-back/800/500"} alt="Back" fill className="object-cover" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentNode({ label, url }: any) {
  return (
    <div className="p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl border flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-[9px] sm:text-[10px] font-black uppercase text-primary truncate">{label}</p>
        <p className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase mt-0.5">Archive File</p>
      </div>
      <Dialog>
        <DialogTrigger asChild><Button variant="ghost" size="sm" className="h-8 sm:h-10 text-[8px] sm:text-[9px] font-black uppercase shrink-0">View Doc</Button></DialogTrigger>
        <DialogContent className="max-w-4xl p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] bg-white w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-[10px] sm:text-xs font-black uppercase">{label}</DialogTitle>
            <DialogDescription className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Authorized documentation audit.
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-[4/3] rounded-xl sm:rounded-2xl border overflow-hidden mt-6 shadow-xl bg-slate-100">
            <Image src={url || "https://picsum.photos/seed/doc/800/1200"} alt={label} fill className="object-contain" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>;
}

function LabelNode({ label }: { label: string }) {
  return <label className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>;
}
