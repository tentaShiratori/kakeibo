import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

function AppProviders({ children }: { children: ReactNode }) {
  return children;
}

export function renderApp(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { ...options, wrapper: AppProviders });
}
