import { createContext, useContext, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const ElectionContext = createContext(undefined);

export function ElectionProvider({ children }) {
  const [electionType, setElectionType] = useState("sslg"); // 'sslg' | 'classroom'
  const { profile } = useAuth();

  // For classroom elections, the section is derived from the voter's profile
  const currentSection = profile?.section || null;

  return (
    <ElectionContext.Provider value={{ electionType, setElectionType, currentSection }}>
      {children}
    </ElectionContext.Provider>
  );
}

export function useElection() {
  const ctx = useContext(ElectionContext);
  if (!ctx) throw new Error("useElection must be used within ElectionProvider");
  return ctx;
}
