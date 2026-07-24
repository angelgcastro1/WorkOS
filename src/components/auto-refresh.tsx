"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Silently re-fetches the current server page on an interval so new data
// (e.g. incoming leads) appears without a manual refresh.
export function AutoRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), intervalMs);
    return () => window.clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
