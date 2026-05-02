import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MarketCard from "@/components/MarketCard";
import type { AssetSnapshot } from "@/hooks/useMarketSnapshot";

describe("<MarketCard />", () => {
  it("mostra skeleton quando isLoading=true", () => {
    const { container } = render(
      <MarketCard assetId="selic" isLoading />,
    );
    // Sem snapshot, renderiza apenas skeletons (sem texto de valor).
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renderiza valor e variação quando snapshot é fornecido", () => {
    const snapshot: AssetSnapshot = {
      latest: { date: "2026-05-01", value: 110 },
      previous: { date: "2026-04-30", value: 100 },
      history: [
        { date: "2026-04-29", value: 95 },
        { date: "2026-04-30", value: 100 },
        { date: "2026-05-01", value: 110 },
      ],
    } as AssetSnapshot;

    render(<MarketCard assetId="selic" snapshot={snapshot} />);
    // Variação +10% deve aparecer.
    expect(screen.getByText(/\+10\.00%/)).toBeInTheDocument();
  });
});
