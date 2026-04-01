"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  identifier: z.string().min(1, "User ID or email is required"),
  password: z.string().min(1, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setError("");
    const result = await signIn("credentials", {
      identifier: data.identifier,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      if (result.error === "AccountDeactivated") {
        setError("deactivated");
      } else {
        setError("invalid");
      }
      return;
    }

    const session = await getSession();
    const role = session?.user?.role;
    if (role === "ADMIN") router.push("/admin");
    else if (role === "MENTOR") router.push("/mentor");
    else if (role === "STUDENT") router.push("/student");
    else router.push("/");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-zinc-50">
      {/* ── Left panel ───────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-950 p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-grid-pattern" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#3ae39e]/8 rounded-full blur-[120px]" />

        {/* Logo */}
        <div className="relative">
          <div className="bg-white rounded-xl px-4 py-2.5 inline-flex">
            <Image
              src="/logo.png"
              alt="Leafclutch Academics"
              width={200}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>
        </div>

        {/* Headline */}
        <div className="relative space-y-5">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold text-white leading-snug tracking-tight">
              Manage your academic<br />journey in one place.
            </h2>
            <p className="text-zinc-400 text-[15px] leading-relaxed max-w-xs">
              Assignments, mentor communication, progress tracking — all streamlined for students and mentors.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Assignment tracking", "Direct messaging", "Progress analytics", "Email notifications"].map((f) => (
              <span key={f} className="px-3 py-1 rounded-full text-[12px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                {f}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-[12px] text-zinc-600">© {new Date().getFullYear()} Leafclutch Technologies Pvt. Ltd.</p>
      </div>

      {/* ── Right panel (form) ────────────────────────── */}
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-start mb-8">
            <div className="bg-white rounded-xl px-3 py-2 border border-zinc-200 shadow-sm">
              <Image
                src="/logo.png"
                alt="Leafclutch Academics"
                width={160}
                height={38}
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[1.5rem] font-semibold tracking-tight text-zinc-900">Welcome back</h1>
            <p className="text-zinc-500 text-sm mt-1.5">Sign in with your User ID or email address</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error === "deactivated" && (
              <div className="text-sm bg-orange-50 border border-orange-200 rounded-xl p-3.5 space-y-1">
                <div className="flex items-start gap-2.5 text-orange-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="font-medium">Account deactivated</p>
                </div>
                <p className="text-orange-600 pl-6.5 text-[13px]">
                  Your account has been deactivated. Please contact{" "}
                  <a href="mailto:admin.academics@leafclutch.com.np" className="underline underline-offset-2">
                    the administrator
                  </a>
                  .
                </p>
              </div>
            )}
            {error === "invalid" && (
              <div className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p>Invalid credentials. Please check your User ID or email and password.</p>
                  <p className="mt-1 text-red-600/80 text-[12px]">
                    If you encounter any issues, contact{" "}
                    <a href="mailto:admin.academics@leafclutch.com.np" className="underline underline-offset-2">
                      the administrator
                    </a>
                    .
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-[13px] font-medium text-zinc-700">
                User ID or Email
              </Label>
              <Input
                id="identifier"
                placeholder="26MEN001 or you@example.com"
                autoComplete="username"
                className="h-10 rounded-xl border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-indigo-500/25 focus-visible:border-indigo-500 transition-all duration-150"
                {...register("identifier")}
              />
              {errors.identifier && <p className="text-xs text-red-500">{errors.identifier.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium text-zinc-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-10 rounded-xl border-zinc-200 bg-white text-sm pr-10 placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-indigo-500/25 focus-visible:border-indigo-500 transition-all duration-150"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors duration-150"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-900/20 transition-all duration-150 active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in…</>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-[12px] text-zinc-400">
            If you encounter any issues, contact{" "}
            <a href="mailto:admin.academics@leafclutch.com.np" className="text-indigo-500 hover:underline">
              the administrator
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
