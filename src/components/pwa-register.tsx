"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installation support is progressive enhancement. The visible app
        // remains usable if registration is unavailable.
      });
    }
  }, []);

  return null;
}
