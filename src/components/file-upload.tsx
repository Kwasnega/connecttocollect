"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, FileCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface FileUploadProps {
  label: string;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export function FileUpload({ 
  label, 
  onChange, 
  accept = ".pdf,.jpg,.jpeg,.png", 
  maxSizeMB = 5,
  className 
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError(null);

    if (file) {
      // Validate size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File size exceeds ${maxSizeMB}MB limit`);
        setSelectedFile(null);
        setPreviewUrl(null);
        onChange(null);
        return;
      }

      setSelectedFile(file);
      onChange(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-semibold text-primary">{label}</Label>
      <div
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all",
          selectedFile ? "border-accent bg-secondary/30" : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5",
          error && "border-destructive bg-destructive/5"
        )}
      >
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
        />
        
        {selectedFile ? (
          <div className="flex flex-col w-full gap-3">
            <div className="flex items-center justify-between bg-white p-3 rounded-md border shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                {previewUrl ? (
                  <div className="relative w-10 h-10 rounded border overflow-hidden flex-shrink-0">
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                  </div>
                ) : (
                  <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                )}
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold text-primary truncate">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-accent font-bold uppercase">
              <FileCheck className="w-3 h-3" /> Ready for submission
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Choose a file or drag it here</p>
              <p className="text-xs text-muted-foreground mt-1">
                {accept.split(",").join(", ")} up to {maxSizeMB}MB
              </p>
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1 text-destructive text-xs font-medium animate-in slide-in-from-top-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
}
