import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EmptyState from "@/components/EmptyState";

describe("<EmptyState />", () => {
  it("renderiza título e descrição padrão", () => {
    render(<EmptyState />);
    expect(screen.getByText(/Nada por aqui ainda/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Assim que houver dados disponíveis/i),
    ).toBeInTheDocument();
  });

  it("usa título e descrição customizados", () => {
    render(<EmptyState title="Sem leads" description="Aguardando captura." />);
    expect(screen.getByText("Sem leads")).toBeInTheDocument();
    expect(screen.getByText("Aguardando captura.")).toBeInTheDocument();
  });

  it("renderiza ação quando fornecida", () => {
    render(<EmptyState action={<button>Tentar</button>} />);
    expect(screen.getByRole("button", { name: "Tentar" })).toBeInTheDocument();
  });
});
