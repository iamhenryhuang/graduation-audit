import { createContext, useContext } from "react";

export const StudentContext = createContext(null);

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent 必須在 StudentProvider 內使用");
  return ctx;
}
