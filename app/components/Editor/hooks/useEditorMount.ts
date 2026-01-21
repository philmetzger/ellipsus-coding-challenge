"use client";

import { useEffect, useState } from "react";

/**
 * Hook for SSR-safe mounting
 * Prevents hydration mismatches by ensuring component only renders on client
 * @returns boolean indicating if component is mounted on client
 */
export const useEditorMount = (): boolean => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
};
