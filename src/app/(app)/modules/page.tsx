import { ArrowRight, Boxes, FileText, PackageCheck, ReceiptText, Settings, UsersRound } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";

const links = [
  { href: "/procurement", label: "Procurement", icon: PackageCheck },
  { href: "/workforce", label: "Workforce", icon: UsersRound },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/reports", label: "Reports", icon: ReceiptText },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/inventory", label: "Inventory", icon: Boxes },
];

export default function ModulesPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">All modules</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Open any part of the construction workspace.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {links.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href} className="group rounded-2xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25">
            <Card className="flex min-h-24 items-center gap-4 p-4 transition-[border-color,background-color] group-hover:border-blue-200 group-hover:bg-blue-50/50">
              <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-900"><Icon className="size-5" /></span>
              <span className="flex-1 font-extrabold text-slate-900">{label}</span>
              <ArrowRight className="size-4 text-slate-400 group-hover:text-blue-900" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
