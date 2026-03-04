import * as z from "zod";

// Highly permissive patterns for international logistics
const nameRegex = /^[a-zA-Z\s\.\-\,\'\(\)]+$/;
const ghanaCardRegex = /^GHA-\d{9}-\d{1}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Loosened for international dial codes handled by the PhoneInput component
const phoneRegex = /^\+\d{1,4}\d{6,14}$/;
const addressRegex = /^[a-zA-Z0-9\s\,\.\-\/\#\(\)]+$/;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

const fileSchema = z
  .instanceof(File, { message: "Official document upload is required" })
  .refine((file) => file.size <= MAX_FILE_SIZE, `File size exceeds 5MB limit`)
  .refine(
    (file) => ACCEPTED_FILE_TYPES.includes(file.type),
    "Format not supported. Use PDF, JPG, or PNG."
  );

export const shipShapeSchema = z.object({
  // Section 1: Consignor (Sender)
  consignorName: z.string()
    .min(2, "Entity name is required")
    .regex(nameRegex, "Invalid characters in name"),
  consignorGhanaCard: z.string()
    .regex(ghanaCardRegex, "Required format: GHA-XXXXXXXXX-X"),
  consignorEmail: z.string()
    .email("Invalid email address")
    .regex(emailRegex, "Verify email format"),
  consignorPhone: z.string()
    .min(8, "Valid phone protocol required")
    .regex(phoneRegex, "Verify international dial code format"),
  consignorAddress: z.string()
    .min(5, "Full physical address is required")
    .regex(addressRegex, "Invalid characters in address"),
  
  // Section 2: Consignee (Receiver)
  consigneeName: z.string()
    .min(2, "Recipient name is required")
    .regex(nameRegex, "Invalid characters in name"),
  consigneePhone: z.string()
    .min(8, "Valid phone protocol required")
    .regex(phoneRegex, "Verify international dial code format"),
  consigneeAddress: z.string()
    .min(5, "Destination address is required")
    .regex(addressRegex, "Invalid characters in address"),
  
  // Section 3: Shipment Specifications
  originPort: z.string().min(1, "Port of loading is required"),
  destinationPort: z.string().min(1, "Port of discharge is required"),
  cargoType: z.enum(["General", "Dangerous", "Perishable", "Liquid"]),
  cargoDescription: z.string().min(10, "Provide detailed cargo manifest (min 10 chars)"),
  weightKg: z.coerce.number().positive("Weight must be greater than 0"),
  shippingMode: z.enum(["Sea", "Air", "Land"]),
  insuranceRequired: z.boolean().default(false),
  
  // Section 4: Required Documentation (Actual Files)
  invoiceFile: fileSchema.nullable().refine(file => file !== null, "Commercial Invoice is required"),
  idCardFrontFile: fileSchema.nullable().refine(file => file !== null, "Ghana Card Front is required"),
  idCardBackFile: fileSchema.nullable().refine(file => file !== null, "Ghana Card Back is required"),
  
  // Declaration
  termsAccepted: z.boolean().refine(val => val === true, "Compliance affirmation required"),
});

export type ShipShapeFormValues = z.infer<typeof shipShapeSchema>;
