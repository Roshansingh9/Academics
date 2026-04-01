"use client";

import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, KeyRound, ChevronDown } from "lucide-react";
import Link from "next/link";

const roleColors: Record<string, string> = {
  ADMIN:   "bg-violet-100 text-violet-700",
  MENTOR:  "bg-indigo-100 text-indigo-700",
  STUDENT: "bg-emerald-100 text-emerald-700",
};

export function TopBar() {
  const { data: session } = useSession();
  const user = session?.user;
  const role = user?.role ?? "";

  const changePasswordPath =
    role === "ADMIN"   ? "/admin/change-password"  :
    role === "MENTOR"  ? "/mentor/change-password" :
                         "/student/change-password";

  const initials = user?.userId?.slice(-2).toUpperCase() ?? "??";

  return (
    <header className="h-14 border-b border-zinc-200/80 bg-white/90 backdrop-blur-sm flex items-center justify-end px-5 gap-3 sticky top-0 z-20">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="group flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors duration-150 focus:outline-none">
            {/* Avatar */}
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${roleColors[role] ?? "bg-zinc-100 text-zinc-600"}`}>
              {initials}
            </div>
            {/* Info */}
            <div className="text-left hidden sm:block">
              <p className="text-[13px] font-semibold text-zinc-800 leading-none">{user?.userId}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-none capitalize">{role.toLowerCase()}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600 transition-colors duration-150 hidden sm:block" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52 shadow-lg border-zinc-200 rounded-xl p-1">
          <div className="px-3 py-2.5 mb-1">
            <p className="text-xs font-semibold text-zinc-800 truncate">{user?.email}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{user?.userId}</p>
          </div>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem asChild>
            <Link href={changePasswordPath} className="flex items-center gap-2 cursor-pointer rounded-lg text-sm py-2 px-2.5">
              <KeyRound className="h-3.5 w-3.5 text-zinc-500" />
              Change Password
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-lg text-sm py-2 px-2.5"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
