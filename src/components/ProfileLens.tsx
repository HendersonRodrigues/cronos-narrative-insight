import { Shield, BarChart3, Flame } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ProfileType } from "@/types/cronos";

interface Props {
  profile: ProfileType;
  onChange: (next: ProfileType) => void;
}

const OPTIONS: Array<{
  value: ProfileType;
  label: string;
  description: string;
  Icon: typeof Shield;
}> = [
  {
    value: "conservador",
    label: "Conservador",
    description: "Preservação de capital",
    Icon: Shield,
  },
  {
    value: "moderado",
    label: "Moderado",
    description: "Equilíbrio risco/retorno",
    Icon: BarChart3,
  },
  {
    value: "agressivo",
    label: "Agressivo",
    description: "Maximização de retorno",
    Icon: Flame,
  },
];

export default function ProfileLens({ profile, onChange }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Lente de Perfil
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wider text-primary/70">
          ativo: {profile}
        </span>
      </div>

      <ToggleGroup
        type="single"
        value={profile}
        onValueChange={(value) => {
          if (value) onChange(value as ProfileType);
        }}
        className="grid grid-cols-3 gap-2 w-full"
      >
        {OPTIONS.map(({ value, label, description, Icon }) => {
          const isActive = profile === value;
          return (
            <ToggleGroupItem
              key={value}
              value={value}
              aria-label={label}
              className={[
                "h-auto flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                "data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-foreground",
                "border-border/60 bg-card/40 hover:border-border hover:bg-card/60",
              ].join(" ")}
            >
              <div className="flex items-center gap-2 w-full">
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className="font-display text-sm font-semibold">{label}</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {description}
              </span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </section>
  );
}
