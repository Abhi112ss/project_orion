/*src/sections/login-section.tsx*/
"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import gsap from "gsap";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGsapContext } from "@/hooks/use-gsap-context";
import { LoginRole, ROLE_COPY, RoleTabs } from "@/components/role-tabs";
import { sendEmailOtp, signInWithGoogle, verifyEmailOtp } from "@/app/login/actions";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.54-5.17 3.54-8.65z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.93H1.3v3.1C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.3A7.2 7.2 0 0 1 4.94 12c0-.8.14-1.57.37-2.3v-3.1H1.3A12 12 0 0 0 0 12c0 1.93.46 3.76 1.3 5.4z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.3 6.6l4.01 3.1C6.25 6.87 8.89 4.77 12 4.77z"
      />
    </svg>
  );
}

const ERROR_COPY: Record<string, string> = {
  no_access: "That identity checked out, but there's no active ORION account for it yet.",
  google_oauth_failed: "Google sign-in didn't go through. Please try again.",
  auth_callback_failed: "That sign-in link is no longer valid. Please try again.",
};

export function LoginSection() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const urlError = searchParams.get("error");

  const [role, setRole] = useState<LoginRole>("tpo");
  const [step, setStep] = useState<"options" | "otp">("options");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(
    urlError ? ERROR_COPY[urlError] ?? "Something went wrong. Please try again." : null
  );
  const [isPending, startTransition] = useTransition();

  const scope = useGsapContext<HTMLDivElement>((_scope, reducedMotion) => {
    if (!scope.current) return;

    if (reducedMotion) {
      gsap.set("[data-login-reveal], [data-login-visual]", {
        opacity: 1,
        y: 0,
        scale: 1,
      });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(
      "[data-login-reveal]",
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }
    ).fromTo(
      "[data-login-visual]",
      { opacity: 0, scale: 0.97 },
      { opacity: 1, scale: 1, duration: 0.9 },
      "-=0.5"
    );
  });

  const copy = ROLE_COPY[role];

  function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await sendEmailOtp(email, role);
      if (result.success) {
        setStep("otp");
      } else {
        setMessage(result.message);
      }
    });
  }

  function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      // On success this redirects server-side and never resolves here.
      const result = await verifyEmailOtp(email, code, redirectTo, role);
      if (result && !result.success) {
        setMessage(result.message);
      }
    });
  }

  return (
    <section
      ref={scope}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-4 py-16 sm:px-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,136,0.08),transparent_60%)]"
      />

      <div
        data-login-reveal
        className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-surface/60 shadow-2xl shadow-black/40 backdrop-blur-sm lg:grid-cols-2"
      >
        {/* Left: auth panel */}
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <div
            data-login-reveal
            className="mb-8 text-sm font-semibold tracking-tight text-[#F9FAFB]"
          >
            ORION
          </div>

          <h1
            data-login-reveal
            className="text-2xl font-semibold tracking-tight text-[#F9FAFB] sm:text-3xl"
          >
            {copy.title}
          </h1>
          <p data-login-reveal className="mt-2 text-sm text-muted">
            {copy.subtitle}
          </p>

          <div data-login-reveal className="mt-6">
            <RoleTabs
              value={role}
              onChange={(r) => {
                setRole(r);
                setStep("options");
                setMessage(null);
              }}
            />
          </div>

          {message && (
            <p
              data-login-reveal
              className="mt-4 rounded-lg border border-[#F87171]/30 bg-[#F87171]/10 px-3 py-2 text-xs text-[#F87171]"
            >
              {message}
            </p>
          )}

          {step === "options" ? (
            <div data-login-reveal className="mt-6 flex flex-col gap-3">
              <form action={() => signInWithGoogle(redirectTo, role)}>
                <Button
                  type="submit"
                  variant="outline"
                  size="lg"
                  className="w-full justify-center gap-2 bg-white/5"
                  disabled={isPending}
                >
                  <GoogleIcon />
                  Continue with Google
                </Button>
              </form>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-muted">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleSendCode} className="flex flex-col gap-3">
                <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                  <Mail className="size-4 shrink-0 text-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Institution email"
                    className="w-full bg-transparent text-sm text-[#F9FAFB] outline-none placeholder:text-[#6B7280]"
                  />
                </label>
                <Button
                  type="submit"
                  size="lg"
                  className="group justify-center"
                  disabled={isPending || !email}
                >
                  {isPending ? "Sending…" : "Send sign-in code"}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </form>
            </div>
          ) : (
            <form
              data-login-reveal
              onSubmit={handleVerifyCode}
              className="mt-6 flex flex-col gap-3"
            >
              <button
                type="button"
                onClick={() => {
                  setStep("options");
                  setMessage(null);
                }}
                className="flex w-fit items-center gap-1 text-xs text-muted hover:text-[#F9FAFB]"
              >
                <ArrowLeft className="size-3.5" />
                {email}
              </button>
              <p className="text-sm text-muted">
                Enter the 6-digit code we sent to your email.
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-center text-lg tracking-[0.5em] text-[#F9FAFB] outline-none placeholder:text-[#6B7280]"
              />
              <Button type="submit" size="lg" className="justify-center" disabled={isPending}>
                {isPending ? "Verifying…" : "Verify and sign in"}
              </Button>
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    const result = await sendEmailOtp(email, role);
                    setMessage(result.success ? "Sent a new code." : result.message);
                  })
                }
                disabled={isPending}
                className="w-fit text-xs text-muted hover:text-[#F9FAFB]"
              >
                Resend code
              </button>
            </form>
          )}

          <p data-login-reveal className="mt-8 text-xs text-[#6B7280]">
            By continuing, you agree to ORION&apos;s{" "}
            <a href="#" className="text-muted underline underline-offset-2 hover:text-[#F9FAFB]">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="text-muted underline underline-offset-2 hover:text-[#F9FAFB]">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        {/* Right: visual */}
        <div
          data-login-visual
          className="relative hidden overflow-hidden border-l border-white/10 bg-[#0B1220] p-8 lg:block"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,255,136,0.12),transparent_55%)]"
          />

          <div className="absolute left-8 top-8 rounded-xl border border-white/10 bg-surface/90 px-4 py-3 shadow-xl">
            <p className="text-xs font-medium text-[#F9FAFB]">Interview Panel Sync</p>
            <p className="mt-0.5 text-[11px] text-muted">09:30 – 10:00 AM</p>
          </div>

          <div className="absolute right-8 top-24 flex gap-1.5 rounded-xl border border-white/10 bg-surface/90 px-3 py-2 shadow-xl">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span
                key={i}
                className={`flex size-6 items-center justify-center rounded-md text-[10px] ${
                  i === 4 ? "bg-primary text-[#030712]" : "text-muted"
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          <div className="absolute bottom-10 left-8 right-8 rounded-xl border border-white/10 bg-surface/90 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#F9FAFB]">Placement Review</p>
              <span className="text-[11px] text-primary">Live</span>
            </div>
            <p className="mt-1 text-[11px] text-muted">
              148 recruiters · 3,214 students placed
            </p>
            <div className="mt-3 flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="size-7 rounded-full border-2 border-surface bg-linear-to-br from-[#00FF88]/60 to-[#00FF88]/10"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}