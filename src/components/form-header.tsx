
import { Phone, Ship } from "lucide-react";

export function FormHeader() {
  return (
    <div className="flex flex-col items-center mb-8 border-b-2 border-primary pb-6">
      <div className="flex flex-row items-center justify-center gap-4 sm:gap-6 mb-6">
        <div className="bg-primary p-4 rounded-2xl shadow-lg">
          <Ship className="w-10 h-10 text-white" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-3xl sm:text-5xl font-black text-primary tracking-tighter leading-none uppercase">CONNECT</h1>
          <h2 className="text-2xl sm:text-4xl font-black text-primary tracking-tighter leading-none uppercase">TO COLLECT</h2>
        </div>
      </div>
      
      <div className="w-full max-w-2xl px-4 py-3 bg-secondary/50 rounded-xl border border-primary/20 text-center mb-6">
        <p className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest mb-1">Our Service:</p>
        <p className="text-sm sm:text-base font-bold text-primary/80 leading-tight">
          GENERAL TRADING, SHIPPING/LOGISTICS FROM DUBAI, AMERICA, CHINA TO GHANA, CONGO, GABON AND TOGO
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-bold text-primary">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-green-600" />
          <span>+971 528 739 190</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-green-600" />
          <span>+971 502 655 385</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-green-600" />
          <span>+233 244 830 066</span>
        </div>
      </div>
    </div>
  );
}
