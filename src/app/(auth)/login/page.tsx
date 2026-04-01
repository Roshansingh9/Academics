"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

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
      setError("Invalid credentials. Please check your User ID or email and password.");
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
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.04] bg-grid-pattern" />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/20 rounded-full blur-[120px]" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-900/40">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-[15px] leading-none">Leafclutch</p>
            <p className="text-zinc-500 text-[12px] mt-0.5 leading-none">Academics</p>
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
          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {["Assignment tracking", "Direct messaging", "Progress analytics", "Email notifications"].map((f) => (
              <span key={f} className="px-3 py-1 rounded-full text-[12px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                {f}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-[12px] text-zinc-600">© {new Date().getFullYear()} Leafclutch. All rights reserved.</p>
      </div>

      {/* ── Right panel (form) ────────────────────────── */}
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <p className="font-semibold text-zinc-900">Leafclutch Academics</p>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[1.5rem] font-semibold tracking-tight text-zinc-900">Welcome back</h1>
            <p className="text-zinc-500 text-sm mt-1.5">Sign in with your User ID or email address</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{error}</p>
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
              {errors.identifier && (
                <p className="text-xs text-red-500">{errors.identifier.message}</p>
              )}
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
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-900/20 transition-all duration-150 active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in...</>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-[12px] text-zinc-400">
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
