
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shipShapeSchema, type ShipShapeFormValues } from "@/lib/validations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PhoneInput } from "@/components/phone-input";
import {
  CheckCircle2,
  User,
  ClipboardList,
  Save,
  Loader2,
  ShieldCheck,
  Building2,
  LayoutDashboard,
  Zap,
  Box,
  Globe,
  ArrowRight,
  CloudUpload,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { toast } from "@/hooks/use-toast";
import { PORTS } from "@/lib/countries";
import { uploadManifestFiles } from "@/app/actions/cloudinary";

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: "consignor",   label: "Sender",   icon: <Building2   className="w-4 h-4" /> },
  { id: "consignee",   label: "Receiver", icon: <User        className="w-4 h-4" /> },
  { id: "shipment",    label: "Cargo",    icon: <Box         className="w-4 h-4" /> },
  { id: "docs",        label: "Files",    icon: <ClipboardList className="w-4 h-4" /> },
  { id: "declaration", label: "Finish",   icon: <ShieldCheck className="w-4 h-4" /> },
];

// ─── Upload state type ────────────────────────────────────────────────────────
type UploadStatus = "idle" | "uploading" | "done" | "error";

export function ShipShapeForm() {
  const [isSubmitView,    setIsSubmitView]   = useState(false);
  const [confirmationId,  setConfirmationId] = useState("");
  const [saveStatus,      setSaveStatus]     = useState<"idle" | "saving" | "saved">("idle");
  const [uploadStatus,    setUploadStatus]   = useState<UploadStatus>("idle");

  const { firestore, user } = useFirebase();
  const autoSaveTimeoutRef  = useRef<NodeJS.Timeout | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);

  const form = useForm<ShipShapeFormValues>({
    resolver: zodResolver(shipShapeSchema),
    defaultValues: {
      consignorName:      "",
      consignorGhanaCard: "GHA-",
      consignorEmail:     "",
      consignorPhone:     "",
      consignorAddress:   "",
      consigneeName:      "",
      consigneePhone:     "",
      consigneeAddress:   "",
      originPort:         "",
      destinationPort:    "",
      cargoType:          "General",
      cargoDescription:   "",
      weightKg:           0,
      shippingMode:       "Sea",
      insuranceRequired:  false,
      termsAccepted:      false,
      invoiceFile:        null,
      idCardFrontFile:    null,
      idCardBackFile:     null,
    },
  });

  // ── Autofill from user profile ─────────────────────────────────────────────
  useEffect(() => {
    if (userData) {
      const current = form.getValues();
      form.reset({
        ...current,
        consignorName:      current.consignorName      || userData.displayName  || userData.companyName || "",
        consignorGhanaCard: (current.consignorGhanaCard === "GHA-" || !current.consignorGhanaCard)
          ? (userData.ghanaCardNumber || "GHA-")
          : current.consignorGhanaCard,
        consignorEmail:     current.consignorEmail     || userData.email        || "",
        consignorPhone:     !current.consignorPhone    ? (userData.phoneNumber  || "") : current.consignorPhone,
        consignorAddress:   current.consignorAddress   || userData.address      || "",
      });
    }
  }, [userData, form]);

  // ── Reactive watched values (used for autosave + progress) ─────────────────
  const watchedValues = form.watch();

  // ── Memoised progress — avoids recomputing on every render ────────────────
  const progress = useMemo(() => {
    const v = watchedValues;
    const checks = [
      Boolean(v.consignorName),
      v.consignorGhanaCard ? v.consignorGhanaCard.length > 4 : false,
      Boolean(v.consignorEmail),
      v.consignorPhone ? v.consignorPhone.length > 4 : false,
      Boolean(v.consigneeName),
      v.consigneePhone ? v.consigneePhone.length > 4 : false,
      Boolean(v.originPort),
      Boolean(v.destinationPort),
      Boolean(v.cargoDescription),
      v.weightKg > 0,
      Boolean(v.invoiceFile),
      Boolean(v.idCardFrontFile),
      Boolean(v.idCardBackFile),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [watchedValues]);

  // ── Ghana Card formatter ───────────────────────────────────────────────────
  const formatGhanaCard = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length === 0) return "GHA-";
    if (digits.length <= 9)  return `GHA-${digits}`;
    return `GHA-${digits.slice(0, 9)}-${digits.slice(9, 10)}`;
  }, []);

  // ── Auto-save draft (debounced 5 s, excludes File objects) ────────────────
  useEffect(() => {
    if (!user || !firestore || isSubmitView) return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

    setSaveStatus("saving");
    autoSaveTimeoutRef.current = setTimeout(() => {
      const { invoiceFile, idCardFrontFile, idCardBackFile, ...serializable } = watchedValues;
      const draftRef = doc(firestore, "shipmentDrafts", user.uid);
      setDoc(draftRef, { ...serializable, lastUpdated: serverTimestamp(), userId: user.uid }, { merge: true })
        .then(() => setSaveStatus("saved"))
        .catch(() => setSaveStatus("idle"));
    }, 5000);

    return () => { if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current); };
  }, [watchedValues, user, firestore, isSubmitView]);

  // ── Form submission ────────────────────────────────────────────────────────
  const onSubmit = async (values: ShipShapeFormValues) => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Authentication Required", description: "You must be logged in to submit a manifest." });
      return;
    }

    try {
      // Step 1: Build FormData — File objects are streamed, no base64 conversion
      setUploadStatus("uploading");
      const formData = new FormData();
      formData.append("invoice",     values.invoiceFile!);
      formData.append("idCardFront", values.idCardFrontFile!);
      formData.append("idCardBack",  values.idCardBackFile!);

      // Upload all three documents in parallel via the server action
      const { invoiceUrl, idCardFrontUrl, idCardBackUrl } = await uploadManifestFiles(formData);
      setUploadStatus("done");

      // Step 2: Commit manifest to Firestore
      const newDocRef   = doc(collection(firestore, "shipmentRequests"));
      const docId       = newDocRef.id;

      const shipmentData = {
        id:                          docId,
        requestorUid:                user.uid,
        userId:                      user.uid,
        requestorGhanaCardNumber:    values.consignorGhanaCard,
        requestorEmail:              values.consignorEmail,
        requestorPhoneNumber:        values.consignorPhone,
        consignorName:               values.consignorName,
        consignorPhysicalAddress:    values.consignorAddress,
        consigneeName:               values.consigneeName,
        consigneePhone:              values.consigneePhone,
        consigneeDestinationAddress: values.consigneeAddress,
        weightKg:                    values.weightKg,
        cargoDescription:            values.cargoDescription,
        submissionDateTime:          new Date().toISOString(),
        originPort:                  values.originPort,
        destinationPort:             values.destinationPort,
        cargoType:                   values.cargoType,
        shippingMode:                values.shippingMode,
        insuranceRequired:           values.insuranceRequired,
        createdAt:                   serverTimestamp(),
        status:                      "Submitted",
        invoiceUrl,
        idCardFrontUrl,
        idCardBackUrl,
      };

      setDocumentNonBlocking(newDocRef, shipmentData, { merge: true });

      addDocumentNonBlocking(collection(firestore, "adminNotifications"), {
        title:     "New Manifest Submitted",
        message:   `${values.consignorName} has submitted a new shipment request for audit.`,
        type:      "alert",
        read:      false,
        timestamp: new Date().toISOString(),
        link:      `/admin/${docId}`,
      });

      // Mark draft as submitted (non-blocking)
      setDoc(doc(firestore, "shipmentDrafts", user.uid), { submittedAt: serverTimestamp() }, { merge: true });

      setConfirmationId(docId.substring(0, 8).toUpperCase());
      setIsSubmitView(true);

      toast({
        title:       "Manifest Submitted",
        description: `Successfully registered under reference #${docId.substring(0, 8).toUpperCase()}.`,
      });
    } catch (error: unknown) {
      setUploadStatus("error");
      const message = error instanceof Error ? error.message : "A technical error occurred during the registry sync.";
      toast({ variant: "destructive", title: "Submission Failed", description: message });
    }
  };

  // ── Success view ──────────────────────────────────────────────────────────
  if (isSubmitView) {
    return (
      <div className="bg-white p-6 sm:p-20 rounded-2xl sm:rounded-[3.5rem] text-center shadow-2xl max-w-3xl mx-auto border border-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32" />
        <div className="bg-emerald-100 w-16 sm:w-24 h-16 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-10 shadow-lg shadow-emerald-200/50">
          <CheckCircle2 className="w-8 sm:w-12 h-8 sm:h-12 text-emerald-600" />
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-primary mb-4 uppercase tracking-tighter">Manifest Received</h2>
        <p className="text-[10px] sm:text-sm text-muted-foreground mb-8 sm:mb-12 font-medium px-4">
          Your shipment has been successfully registered in our national database.
        </p>

        <div
          className="bg-primary/5 p-6 sm:p-12 rounded-xl sm:rounded-[2.5rem] border border-primary/10 mb-8 sm:mb-12 relative group mx-4"
        >
          <p className="text-[8px] sm:text-[10px] font-black text-primary uppercase mb-3 tracking-[0.4em]">Reference ID</p>
          <p className="font-mono text-2xl sm:text-5xl font-black text-primary tracking-widest group-hover:scale-105 transition-transform">
            #{confirmationId}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
          <Button
            onClick={() => (window.location.href = "/dashboard")}
            className="bg-primary text-white font-black uppercase tracking-widest text-[9px] sm:text-xs h-14 sm:h-16 px-8 rounded-xl sm:rounded-2xl flex-1"
          >
            <LayoutDashboard className="w-4 h-4 mr-3" /> Dashboard
          </Button>
          <Button
            onClick={() => { form.reset(); setIsSubmitView(false); setUploadStatus("idle"); }}
            variant="outline"
            className="border-primary/10 text-primary font-black uppercase tracking-widest text-[9px] sm:text-xs h-14 sm:h-16 px-8 rounded-xl sm:rounded-2xl flex-1"
          >
            Submit Another
          </Button>
        </div>
      </div>
    );
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="space-y-6 sm:space-y-12 pb-10">
      {/* ── Sticky progress header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b p-4 sm:p-6 -mx-4 sm:-mx-10 rounded-b-xl sm:rounded-b-[2.5rem] mb-6 sm:mb-12 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-accent/20 p-1.5 rounded-lg shrink-0">
              <Zap className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-[7px] sm:text-[10px] font-black text-primary uppercase tracking-[0.2em] truncate">Verification Status</p>
              <p className="text-xs sm:text-xl font-black text-primary">{progress}% Complete</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-[7px] sm:text-[10px] font-black uppercase text-accent">
              {saveStatus === "saving" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              <span className="hidden xs:inline">{saveStatus === "saving" ? "Syncing..." : "Draft Secure"}</span>
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-1 bg-secondary rounded-full" />

        <nav className="mt-6 flex justify-between gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex flex-col items-center gap-2 shrink-0 min-w-[55px] sm:min-w-[80px]">
              <div className={cn(
                "w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl flex items-center justify-center transition-all",
                progress >= ((idx + 1) * 20)
                  ? "bg-accent text-primary shadow-sm"
                  : "bg-secondary text-muted-foreground/30",
              )}>
                {step.icon}
              </div>
              <span className={cn(
                "text-[6px] sm:text-[9px] font-black uppercase tracking-widest text-center",
                progress >= ((idx + 1) * 20) ? "text-primary" : "text-muted-foreground/40",
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </nav>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 sm:space-y-12">

          {/* ── Section 1: Consignor ─────────────────────────────────────── */}
          <Section icon={<Building2 />} title="Consignor" subtitle="Sender Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <Field form={form} name="consignorName" label="Business/Personal Name" placeholder="Full name or company" />
              <FormField
                control={form.control}
                name="consignorGhanaCard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest">Ghana Card (GHA)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="GHA-000000000-0"
                        onChange={(e) => field.onChange(formatGhanaCard(e.target.value))}
                        className="rounded-lg sm:rounded-xl bg-secondary/50 border-none transition-all focus:bg-white text-xs sm:text-sm font-bold h-11 sm:h-12 px-4"
                      />
                    </FormControl>
                    <FormMessage className="text-[9px] font-black text-destructive" />
                  </FormItem>
                )}
              />
              <Field form={form} name="consignorEmail" label="Email Address" placeholder="email@example.com" />
              <FormField
                control={form.control}
                name="consignorPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest">Phone Number</FormLabel>
                    <FormControl>
                      <PhoneInput value={field.value} onChange={field.onChange} placeholder="Entry protocol..." />
                    </FormControl>
                    <FormMessage className="text-[9px] font-black text-destructive" />
                  </FormItem>
                )}
              />
              <Field form={form} name="consignorAddress" label="Physical Coordinates" placeholder="Full street address" className="sm:col-span-2" />
            </div>
          </Section>

          {/* ── Section 2: Consignee ─────────────────────────────────────── */}
          <Section icon={<User />} title="Consignee" subtitle="Receiver Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <Field form={form} name="consigneeName" label="Receiver Name" placeholder="Full name or entity" />
              <FormField
                control={form.control}
                name="consigneePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest">Phone Number</FormLabel>
                    <FormControl>
                      <PhoneInput value={field.value} onChange={field.onChange} placeholder="Entry protocol..." />
                    </FormControl>
                    <FormMessage className="text-[9px] font-black text-destructive" />
                  </FormItem>
                )}
              />
              <Field form={form} name="consigneeAddress" label="Delivery Coordinates" placeholder="Full destination address" className="sm:col-span-2" />
            </div>
          </Section>

          {/* ── Section 3: Shipment ──────────────────────────────────────── */}
          <Section icon={<Globe />} title="Shipment" subtitle="Logistics Matrix" color="bg-accent text-primary">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <FormField
                control={form.control}
                name="originPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest">Departure Node</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-primary/10 font-bold text-xs">
                          <SelectValue placeholder="Select Port" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                        {PORTS.ORIGIN.map((p) => (
                          <SelectItem key={p.value} value={p.value} className="text-[11px] font-bold uppercase">{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[9px] font-black text-destructive" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destinationPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest">Arrival Node</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-primary/10 font-bold text-xs">
                          <SelectValue placeholder="Select Port" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                        {PORTS.DISCHARGE.map((p) => (
                          <SelectItem key={p.value} value={p.value} className="text-[11px] font-bold uppercase">{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[9px] font-black text-destructive" />
                  </FormItem>
                )}
              />
              <Field form={form} name="weightKg" label="Mass (KG)" type="number" placeholder="0.00" />
              <Field form={form} name="cargoDescription" label="Cargo Manifest" placeholder="Detailed item description..." className="sm:col-span-2 lg:col-span-3" textarea />

              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 sm:p-10 bg-white rounded-xl sm:rounded-[2.5rem] border border-primary/5">
                <FormField
                  control={form.control}
                  name="cargoType"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest">Classification</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col gap-2">
                          {["General", "Dangerous", "Perishable", "Liquid"].map((type) => (
                            <FormItem key={type} className="flex items-center space-x-3 p-3 rounded-lg sm:rounded-xl border bg-secondary/30 cursor-pointer">
                              <FormControl><RadioGroupItem value={type} className="border-accent" /></FormControl>
                              <FormLabel className="text-xs font-bold text-primary cursor-pointer uppercase">{type}</FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingMode"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest">Transport Modality</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col gap-2">
                          {["Sea", "Air", "Land"].map((mode) => (
                            <FormItem key={mode} className="flex items-center space-x-3 p-3 rounded-lg sm:rounded-xl border bg-secondary/30 cursor-pointer">
                              <FormControl><RadioGroupItem value={mode} className="border-accent" /></FormControl>
                              <FormLabel className="text-xs font-bold text-primary cursor-pointer uppercase">{mode} Freight</FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Section>

          {/* ── Section 4: Documents ─────────────────────────────────────── */}
          <Section icon={<ClipboardList />} title="Documents" subtitle="Authorized Uploads">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="invoiceFile"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormControl>
                      <FileUpload label="Commercial Invoice" onChange={(file) => field.onChange(file)} className="rounded-xl sm:rounded-2xl" />
                    </FormControl>
                    <FormMessage className="text-[9px] font-black text-destructive" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="idCardFrontFile"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUpload label="ID Card (Front)" onChange={(file) => field.onChange(file)} className="rounded-xl sm:rounded-2xl" />
                    </FormControl>
                    <FormMessage className="text-[9px] font-black text-destructive" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="idCardBackFile"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUpload label="ID Card (Back)" onChange={(file) => field.onChange(file)} className="rounded-xl sm:rounded-2xl" />
                    </FormControl>
                    <FormMessage className="text-[9px] font-black text-destructive" />
                  </FormItem>
                )}
              />
            </div>
          </Section>

          {/* ── Section 5: Declaration + Submit ──────────────────────────── */}
          <div className="bg-white p-6 sm:p-16 rounded-xl sm:rounded-[3rem] space-y-6 sm:space-y-10 border border-primary/5 shadow-xl mx-1">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="insuranceRequired"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border">
                    <div className="space-y-0.5">
                      <FormLabel className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest">Required Port Insurance</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-accent" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3 p-4 bg-secondary/20 rounded-xl border">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-accent mt-0.5" />
                    </FormControl>
                    <FormLabel className="text-[9px] sm:text-[10px] font-black text-primary uppercase leading-tight">
                      I certify that all provided information is accurate and I accept the SHLCS terms of service.
                    </FormLabel>
                    <FormMessage className="text-[9px] font-black text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            {/* Upload status indicator */}
            {uploadStatus === "uploading" && (
              <div className="flex items-center gap-3 p-4 bg-accent/5 border border-accent/20 rounded-xl text-accent">
                <CloudUpload className="w-4 h-4 animate-bounce shrink-0" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest">Uploading Documents</p>
                  <p className="text-[8px] font-bold text-muted-foreground">Securely transferring 3 files in parallel…</p>
                </div>
                <Loader2 className="w-4 h-4 animate-spin ml-auto shrink-0" />
              </div>
            )}
            {uploadStatus === "error" && (
              <div className="flex items-center gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-xl text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-[9px] font-black uppercase tracking-widest">Upload failed — check your connection and try again</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-primary/5">
              <div className="flex items-center gap-3 text-muted-foreground w-full sm:w-auto">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                <div>
                  <p className="text-[8px] sm:text-[9px] font-black text-primary uppercase">Secure Registry Sync</p>
                  <p className="text-[7px] sm:text-[8px] font-bold text-muted-foreground uppercase">256-bit Encrypted</p>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full sm:w-auto h-14 sm:h-20 bg-primary text-white font-black uppercase text-[10px] sm:text-xs rounded-xl sm:rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {uploadStatus === "uploading" ? "Uploading…" : "Submitting…"}
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    Commit Manifest <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Section({ icon, title, subtitle, children, color = "bg-primary text-white" }: {
  icon: React.ReactElement;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Card className="bg-white border border-primary/5 rounded-2xl sm:rounded-[3.5rem] overflow-hidden shadow-lg mx-1">
      <CardHeader className={cn("p-6 sm:p-14 flex flex-row items-center gap-4 sm:gap-8", color)}>
        <div className="bg-white/10 p-2 sm:p-4 rounded-lg sm:rounded-xl shadow-inner shrink-0">
          {React.cloneElement(icon, { className: "w-5 h-5 sm:w-8 sm:h-8" })}
        </div>
        <div className="min-w-0">
          <CardTitle className="text-xs sm:text-xl font-black uppercase tracking-widest truncate">{title}</CardTitle>
          <CardDescription className="text-white/60 text-[7px] sm:text-[10px] font-bold uppercase mt-0.5 sm:mt-1 truncate">{subtitle}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6 sm:p-16">{children}</CardContent>
    </Card>
  );
}

function Field({ form, name, label, placeholder, textarea = false, type = "text", className }: {
  form: ReturnType<typeof useForm<ShipShapeFormValues>>;
  name: keyof ShipShapeFormValues;
  label: string;
  placeholder: string;
  textarea?: boolean;
  type?: string;
  className?: string;
}) {
  const Comp = textarea ? Textarea : Input;
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-2", className)}>
          <FormLabel className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-widest">{label}</FormLabel>
          <FormControl>
            <Comp
              type={type}
              placeholder={placeholder}
              className={cn(
                "rounded-lg sm:rounded-xl bg-secondary/50 border-none transition-all focus:bg-white text-xs sm:text-sm font-bold",
                textarea ? "min-h-[100px] p-4" : "h-11 sm:h-12 px-4",
              )}
              {...(field as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          </FormControl>
          <FormMessage className="text-[9px] font-black text-destructive" />
        </FormItem>
      )}
    />
  );
}
