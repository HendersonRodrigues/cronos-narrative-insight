import { Activity } from "lucide-react";
import type { Asset } from "@/data/mockData";

const assets: Asset[] = ["IBOV", "DOLAR", "SELIC", "IPCA"];

interface Props {
  selected: Asset;
  onSelect: (a: Asset) => void;
}

const CronosHeader = ({ selected, onSelect }: Props) => (
  <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
    <div className="container flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <span className="font-body text-xl font-bold tracking-widest text-primary">CRONOS</span>
      </div>
      <div className="flex items-center gap-1.5">
        {assets.map((a) => (
          <button
            key={a}
            onClick={() => onSelect(a)}
            className={`rounded-md px-4 py-2 font-mono text-xs font-medium transition-all ${
              selected === a
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  </header>
);

export default CronosHeader;
