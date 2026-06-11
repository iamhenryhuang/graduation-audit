import { useCallback, useState } from "react";
import { StudentContext } from "./student";

const STORAGE_KEY = "graduation-audit:student-id";

export function StudentProvider({ children }) {
  const [studentId, setStudentIdState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const setStudentId = useCallback((id) => {
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage 不可用時仍維持記憶體內狀態
    }
    setStudentIdState(id);
  }, []);

  return (
    <StudentContext.Provider value={{ studentId, setStudentId }}>
      {children}
    </StudentContext.Provider>
  );
}
