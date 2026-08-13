import { CreditCard, Sparkles, TrendingUp } from 'lucide-react'

export function AuthBrandPanel() {
  return (
    <div className="relative hidden min-h-full overflow-hidden fintech-gradient lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-14">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-10 top-16 h-40 w-40 rounded-full bg-primary-500/30 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />
      </div>

      <div className="relative z-10 animate-fade-in">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold text-white ring-1 ring-white/20">
            P
          </span>
          <span className="text-2xl font-bold tracking-tight text-white">
            PayLater
          </span>
        </div>
      </div>

      <div className="relative z-10 max-w-lg animate-slide-up">
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
          Buy today. Pay smarter.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-200">
          Flexible payments for customers.
          <br />
          Powerful tools for growing businesses.
        </p>

        <div className="mt-10 flex flex-wrap gap-3 text-sm text-slate-200">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/10">
            <Sparkles size={16} aria-hidden="true" />
            Instant credit
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/10">
            <TrendingUp size={16} aria-hidden="true" />
            Merchant analytics
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-12 animate-float">
        <div className="relative mx-auto max-w-sm">
          <div className="absolute -left-6 top-8 h-28 w-44 rounded-2xl bg-white/5 ring-1 ring-white/10" />
          <div className="relative rounded-3xl bg-gradient-to-br from-white/20 to-white/5 p-6 ring-1 ring-white/20 backdrop-blur-md">
            <div className="flex items-center justify-between text-white/80">
              <CreditCard size={22} aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-wider">
                PayLater
              </span>
            </div>
            <p className="mt-8 text-sm text-white/70">Available Limit</p>
            <p className="mt-1 text-3xl font-bold text-white">₹10,000</p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-primary-400 to-indigo-300" />
            </div>
            <div className="mt-3 flex justify-between text-xs text-white/60">
              <span>Used 40%</span>
              <span>Secure payments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
