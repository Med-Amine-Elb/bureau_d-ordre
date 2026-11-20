import { createContext, useContext } from "react";

export const AppRoleContext = createContext<string | null>(null);

export function useAppRole(): string | null {
  return useContext(AppRoleContext);
}
