import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

vi.mock("@/services/integrationHealth", () => ({
  reportIntegrationError: vi.fn(),
}));

function Bomb({ explode }: { explode: boolean }) {
  if (explode) throw new Error("boom");
  return <div>tudo ok</div>;
}

describe("<ErrorBoundary />", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza children quando não há erro", () => {
    render(
      <ErrorBoundary>
        <Bomb explode={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("tudo ok")).toBeInTheDocument();
  });

  it("exibe fallback amigável quando filho lança erro", () => {
    render(
      <ErrorBoundary>
        <Bomb explode={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Falha temporária/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tentar novamente/i }),
    ).toBeInTheDocument();
  });

  it("usa fallback customizado quando fornecido", () => {
    render(
      <ErrorBoundary fallback={<div>fallback custom</div>}>
        <Bomb explode={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("fallback custom")).toBeInTheDocument();
  });
});
