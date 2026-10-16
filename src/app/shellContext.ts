import { createContext, useContext } from "react";
import type { WorkspaceKey } from "./data/types";

export type UploadPreset = { workspace?: WorkspaceKey; group?: string; files?: File[] };

export type Shell = {
  openDoc: (id: string) => void;
  openUpload: (preset?: UploadPreset) => void;
  openSearch: () => void;
};

export const ShellContext = createContext<Shell | null>(null);

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside the app shell");
  return ctx;
}
