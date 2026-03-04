"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/countries";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function PhoneInput({ value, onChange, placeholder, className }: PhoneInputProps) {
  const [open, setPopoverOpen] = React.useState(false);
  
  // Identify the country node based on current value dial prefix
  const country = React.useMemo(() => {
    const match = COUNTRIES.find(c => value.startsWith(c.dial));
    return match || COUNTRIES.find(c => c.code === "GH")!;
  }, [value]);

  // Extract raw local digits excluding dial prefix
  const rawLocal = React.useMemo(() => {
    if (value.startsWith(country.dial)) {
      return value.slice(country.dial.length).replace(/\D/g, "");
    }
    return value.replace(/\D/g, "");
  }, [value, country.dial]);

  /**
   * Technical Formatting Protocol: Group digits for sub-second readability
   */
  const formatLocal = (digits: string, max: number) => {
    const d = digits.slice(0, max);
    if (max === 8) return d.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
    if (max === 9) return d.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
    if (max === 10) {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    }
    if (max === 11) {
      if (d.length <= 3) return d;
      if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`;
    }
    return d.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
  };

  const handleCountrySelect = (selectedCountry: typeof COUNTRIES[0]) => {
    // Preserve local digits but enforce new country limit
    const truncatedRaw = rawLocal.slice(0, selectedCountry.digits);
    onChange(`${selectedCountry.dial}${truncatedRaw}`);
    setPopoverOpen(false);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, country.digits);
    onChange(`${country.dial}${raw}`);
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Popover open={open} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[110px] h-12 rounded-xl bg-secondary/50 border-none px-3 font-bold justify-between shrink-0"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{country.flag}</span>
              <span className="text-[10px]">{country.dial}</span>
            </span>
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0 rounded-2xl overflow-hidden border-none shadow-2xl" align="start">
          <Command className="bg-white">
            <CommandInput placeholder="Search country node..." className="h-12 border-none font-bold text-xs uppercase" />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="p-4 text-[10px] font-bold text-slate-400 uppercase text-center">Node not found.</CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((c) => (
                  <CommandItem
                    key={c.code}
                    value={c.name}
                    onSelect={() => handleCountrySelect(c)}
                    className="h-12 px-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <Check
                      className={cn(
                        "mr-3 h-4 w-4 text-emerald-500",
                        country.code === c.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="text-lg mr-3">{c.flag}</span>
                    <span className="flex-1 font-bold text-[11px] text-primary truncate">{c.name}</span>
                    <span className="text-[10px] font-black text-slate-400 ml-2">{c.dial}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <Input
        type="tel"
        placeholder={placeholder || "000 000 000"}
        value={formatLocal(rawLocal, country.digits)}
        onChange={handleNumberChange}
        className="flex-1 h-12 rounded-xl bg-secondary/50 border-none px-4 font-bold text-sm tracking-widest focus:bg-white transition-all"
      />
    </div>
  );
}
