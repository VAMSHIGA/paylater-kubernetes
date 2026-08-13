import { CreditCard, ShieldCheck, Sparkles, Zap } from 'lucide-react'

export function LoginBrandPanel() {
  return (
    <div className="login-hero relative hidden min-h-full overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div className="login-hero__shapes pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="login-hero__orb login-hero__orb--one" />
        <div className="login-hero__orb login-hero__orb--two" />
        <div className="login-hero__orb login-hero__orb--three" />
        <div className="login-hero__grid" />
      </div>

      <div className="relative z-10 animate-fade-in">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-white shadow-lg ring-1 ring-white/25 backdrop-blur-sm">
            P
          </span>
          <span className="text-2xl font-bold tracking-tight text-white">
            PayLater
          </span>
        </div>
      </div>

      <div className="relative z-10 max-w-xl animate-slide-up">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-200/90">
          PayLater
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-white xl:text-5xl">
          Buy today. Pay smarter.
        </h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-200/95">
          Flexible payments for customers.
          <br />
          Powerful tools for growing businesses.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-slate-100 ring-1 ring-white/15 backdrop-blur-sm">
            <Sparkles size={15} aria-hidden="true" />
            Instant credit
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-slate-100 ring-1 ring-white/15 backdrop-blur-sm">
            <Zap size={15} aria-hidden="true" />
            Fast checkout
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-slate-100 ring-1 ring-white/15 backdrop-blur-sm">
            <ShieldCheck size={15} aria-hidden="true" />
            Bank-grade security
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-10 animate-float" aria-hidden="true">
        <div className="relative mx-auto max-w-sm">
          <div className="login-card-glow absolute -inset-4 rounded-[2rem] opacity-60" />
          <div className="absolute -left-8 top-10 h-32 w-48 -rotate-6 rounded-2xl bg-white/5 ring-1 ring-white/10" />
          <div className="absolute -right-4 bottom-6 h-24 w-36 rotate-12 rounded-2xl bg-indigo-400/10 ring-1 ring-white/10" />

          <div className="login-payment-card relative overflow-hidden rounded-3xl p-6 ring-1 ring-white/25">
            <div className="login-payment-card__shine" />
            <div className="relative flex items-center justify-between text-white/85">
              <CreditCard size={24} aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                PayLater
              </span>
            </div>
            <p className="relative mt-10 text-sm font-medium text-white/70">
              Available Limit
            </p>
            <p className="relative mt-1 text-4xl font-bold tracking-tight text-white">
              ₹10,000
            </p>
            <div className="relative mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-indigo-300 via-primary-400 to-indigo-200" />
            </div>
            <div className="relative mt-3 flex justify-between text-xs text-white/60">
              <span>Flexible repayments</span>
              <span>Secure payments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
