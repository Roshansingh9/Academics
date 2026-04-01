import Image from "next/image";
import Link from "next/link";

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-zinc-200">
            <Image
              src="/logo.png"
              alt="Leafclutch Academics"
              width={180}
              height={44}
              className="h-9 w-auto object-contain"
            />
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-zinc-900">Account Deactivated</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Your account has been deactivated and you no longer have access to the platform.
            If you believe this is an error, please contact your administrator.
          </p>
        </div>

        {/* Admin contact */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 text-left space-y-1 shadow-sm">
          <p className="text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Administrator Contact</p>
          <a
            href="mailto:admin.academics@leafclutch.com.np"
            className="text-indigo-600 hover:underline text-sm font-medium"
          >
            admin.academics@leafclutch.com.np
          </a>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          ← Back to login
        </Link>
      </div>
    </div>
  );
}
