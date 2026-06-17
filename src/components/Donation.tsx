import { CheckCircle2, CreditCard, ExternalLink, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Panel } from "./ui";

const donationLinks = {
  paypalMe: "https://paypal.me/AITokenControl",
  stripe: "https://donate.stripe.com/"
};

const presetAmounts = [5, 10, 25, 50, 100];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount);
}

export function DonationPanel() {
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState("");
  const [method, setMethod] = useState<"paypal" | "stripe" | null>(null);

  const customValue = Number(customAmount);
  const activeAmount = customAmount.trim() ? customValue : selectedAmount;
  const validAmount = Number.isFinite(activeAmount) && activeAmount >= 1;
  const displayAmount = validAmount ? formatCurrency(activeAmount) : "$0";

  const paypalUrl = useMemo(() => {
    if (!validAmount) return donationLinks.paypalMe;
    return `${donationLinks.paypalMe}/${activeAmount.toFixed(activeAmount % 1 === 0 ? 0 : 2)}`;
  }, [activeAmount, validAmount]);

  const handleDonate = (target: "paypal" | "stripe") => {
    if (!validAmount) return;
    setMethod(target);
    const targetUrl = target === "paypal" ? paypalUrl : donationLinks.stripe;
    window.open(targetUrl, "_blank", "noreferrer");
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <Panel className="p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint-500/10 text-mint-500">
            <HeartHandshake className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Donation</p>
            <h2 className="mt-1 text-2xl font-black text-white">Support AI Token Control System</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Choose a donation amount, add your own amount, and continue through PayPal.me or Stripe. This frontend does not collect card details or process payments inside the app.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-mint-500/20 bg-mint-500/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-mint-500">Selected donation</p>
              <p className="mt-1 text-3xl font-black text-white">{displayAmount}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-mint-500/30 bg-graphite-950/40 px-3 py-2 text-xs font-semibold text-mint-500">
              <Sparkles className="h-4 w-4" />
              Thank you for supporting better token control tools
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Choose an amount</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount("");
                }}
                className={`min-h-12 rounded-xl border px-3 text-sm font-bold transition ${
                  !customAmount && selectedAmount === amount
                    ? "border-mint-500 bg-mint-500 text-graphite-950"
                    : "border-white/10 bg-white/[0.055] text-slate-100 hover:border-mint-500/40 hover:bg-mint-500/10"
                }`}
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Or enter your own amount</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">$</span>
            <input
              type="number"
              min={1}
              step="0.01"
              inputMode="decimal"
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
              placeholder="Enter custom donation"
              className="h-12 w-full rounded-xl border border-white/10 bg-graphite-900 pl-8 pr-4 text-sm text-slate-100"
            />
          </div>
          {!validAmount ? <span className="mt-2 block text-sm font-semibold text-red-200">Please enter at least $1.</span> : null}
        </label>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleDonate("paypal")}
            disabled={!validAmount}
            className="rounded-xl border border-white/10 bg-white/[0.055] p-4 text-left transition hover:border-mint-500/40 hover:bg-mint-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-white">Donate with PayPal.me</p>
                <p className="mt-1 text-sm text-slate-400">Continue with {displayAmount}</p>
              </div>
              <ExternalLink className="h-5 w-5 text-mint-500" />
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleDonate("stripe")}
            disabled={!validAmount}
            className="rounded-xl border border-white/10 bg-white/[0.055] p-4 text-left transition hover:border-mint-500/40 hover:bg-mint-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-white">Donate with Stripe</p>
                <p className="mt-1 text-sm text-slate-400">Use the configured Stripe donation link</p>
              </div>
              <CreditCard className="h-5 w-5 text-mint-500" />
            </div>
          </button>
        </div>

        {method ? (
          <div className="mt-5 rounded-2xl border border-mint-500/30 bg-mint-500/10 p-4">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-mint-500" />
              <div>
                <p className="font-bold text-white">Thank you for choosing to support this project.</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Your {displayAmount} donation selection has been prepared for {method === "paypal" ? "PayPal.me" : "Stripe"}. Support like this helps keep the interface sharper, faster, and easier to connect to a real backend.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </Panel>

      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-mint-500" />
          <h3 className="font-bold text-white">Donation boundaries</h3>
        </div>
        <ul className="mt-4 space-y-3 text-sm text-slate-400">
          <li className="rounded-lg border border-white/10 bg-graphite-950/35 p-3">No card fields are collected inside this frontend.</li>
          <li className="rounded-lg border border-white/10 bg-graphite-950/35 p-3">No payment provider SDK is bundled here.</li>
          <li className="rounded-lg border border-white/10 bg-graphite-950/35 p-3">Only PayPal.me and Stripe donation actions are presented.</li>
          <li className="rounded-lg border border-wheat-400/20 bg-wheat-400/10 p-3 text-wheat-400">Replace the placeholder PayPal.me handle and Stripe donation URL before launch.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button icon={ExternalLink} onClick={() => handleDonate("paypal")} disabled={!validAmount}>PayPal.me</Button>
          <Button variant="secondary" icon={CreditCard} onClick={() => handleDonate("stripe")} disabled={!validAmount}>Stripe</Button>
        </div>
      </Panel>
    </div>
  );
}
