"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintReportButton() {
  return <Button onClick={() => window.print()} type="button" variant="secondary"><Printer className="size-5" aria-hidden="true" />Print snapshot</Button>;
}
