"use client";

import React from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import OfflinePage from "./OfflinePage";

/**
 * Wraps the app children and shows the OfflinePage overlay when the
 * browser detects it has lost network connectivity.
 */
export default function OfflineGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const isOnline = useOnlineStatus();

  return (
    <>
      {!isOnline && <OfflinePage />}
      {children}
    </>
  );
}
