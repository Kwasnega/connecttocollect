/**
 * Global Registry of Maritime Trading Nodes & Dialing Protocols
 */
export const COUNTRIES = [
  { name: "Ghana", code: "GH", dial: "+233", flag: "🇬🇭", digits: 9 },
  { name: "United Arab Emirates", code: "AE", dial: "+971", flag: "🇦🇪", digits: 9 },
  { name: "China", code: "CN", dial: "+86", flag: "🇨🇳", digits: 11 },
  { name: "United States", code: "US", dial: "+1", flag: "🇺🇸", digits: 10 },
  { name: "Togo", code: "TG", dial: "+228", flag: "🇹🇬", digits: 8 },
  { name: "Gabon", code: "GA", dial: "+241", flag: "🇬🇦", digits: 9 },
  { name: "Congo", code: "CG", dial: "+242", flag: "🇨🇬", digits: 9 },
  { name: "Nigeria", code: "NG", dial: "+234", flag: "🇳🇬", digits: 10 },
  { name: "United Kingdom", code: "GB", dial: "+44", flag: "🇬🇧", digits: 10 },
  { name: "India", code: "IN", dial: "+91", flag: "🇮🇳", digits: 10 },
  { name: "South Africa", code: "ZA", dial: "+27", flag: "🇿🇦", digits: 9 },
  { name: "Benin", code: "BJ", dial: "+229", flag: "🇧🇯", digits: 8 },
  { name: "Ivory Coast", code: "CI", dial: "+225", flag: "🇨🇮", digits: 10 },
].sort((a, b) => a.name.localeCompare(b.name));

export const PORTS = {
  ORIGIN: [
    { label: "Jebel Ali, Dubai (UAE)", value: "Dubai-JebelAli" },
    { label: "Shanghai, China", value: "China-Shanghai" },
    { label: "Ningbo-Zhoushan, China", value: "China-Ningbo" },
    { label: "Savannah, Georgia (USA)", value: "USA-Savannah" },
    { label: "New York/New Jersey (USA)", value: "USA-NYNJ" },
    { label: "Houston, Texas (USA)", value: "USA-Houston" },
    { label: "Tema, Ghana", value: "Ghana-Tema" },
    { label: "Antwerp, Belgium", value: "Belgium-Antwerp" },
    { label: "London Gateway (UK)", value: "UK-London" },
  ],
  DISCHARGE: [
    { label: "Tema Harbour, Ghana", value: "Ghana-Tema" },
    { label: "Takoradi Port, Ghana", value: "Ghana-Takoradi" },
    { label: "Port of Lome, Togo", value: "Togo-Lome" },
    { label: "Port of Libreville, Gabon", value: "Gabon-Libreville" },
    { label: "Port of Pointe-Noire, Congo", value: "Congo-PointeNoire" },
    { label: "Cotonou Port, Benin", value: "Benin-Cotonou" },
    { label: "Port of Abidjan, Ivory Coast", value: "IvoryCoast-Abidjan" },
    { label: "Lagos Port Complex, Nigeria", value: "Nigeria-Lagos" },
  ]
};
