import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getApplicationAccess } from "@/lib/auth/access";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const access = await getApplicationAccess();

  if (access.mode === "configured") {
    redirect("/sign-in");
  }

  return <AppShell access={access}>{children}</AppShell>;
}
