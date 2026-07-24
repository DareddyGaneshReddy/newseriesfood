import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Loader2, Save, Wallet, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { buildUpiParams, upiUniversalUrl, isValidVpa } from "@/lib/upi";
import { toast } from "sonner";

export function PaymentsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [vpa, setVpa] = useState("");
  const [payeeName, setPayeeName] = useState("New Series Food Corner");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("id, upi_vpa, payee_name")
        .eq("singleton", true)
        .maybeSingle();
      if (!error && data) {
        setId(data.id);
        setVpa(data.upi_vpa ?? "");
        setPayeeName(data.payee_name ?? "New Series Food Corner");
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    const trimmed = vpa.trim();
    if (trimmed && !isValidVpa(trimmed)) {
      toast.error("Enter a valid UPI ID (e.g. name@okhdfc)");
      return;
    }
    setSaving(true);
    const payload = { upi_vpa: trimmed || null, payee_name: payeeName.trim() || null };
    const { error } = id
      ? await supabase.from("payment_settings").update(payload).eq("id", id)
      : await supabase.from("payment_settings").insert({ ...payload, singleton: true });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Payment settings saved");
  };

  const previewUrl = vpa && isValidVpa(vpa)
    ? upiUniversalUrl(buildUpiParams({ vpa: vpa.trim(), payeeName, amount: 100, note: "Preview" }))
    : "";

  const staticQrPayload = vpa && isValidVpa(vpa)
    ? `upi://pay?${new URLSearchParams({ pa: vpa.trim(), pn: payeeName || "Merchant", cu: "INR" }).toString()}`
    : "";

  if (loading) {
    return (
      <div className="flex justify-center px-5 pt-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-5 pt-4 pb-10">
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">PhonePe Business / UPI</div>
            <div className="text-[11px] text-muted-foreground">Customers pay directly to this VPA at checkout.</div>
          </div>
        </div>

        <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Business UPI ID (VPA)
        </label>
        <input
          type="text"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          value={vpa}
          onChange={(e) => setVpa(e.target.value)}
          placeholder="yourbusiness@ybl"
          className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />

        <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Payee display name
        </label>
        <input
          type="text"
          value={payeeName}
          onChange={(e) => setPayeeName(e.target.value)}
          placeholder="Your business name"
          className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />

        <button
          onClick={save}
          disabled={saving}
          className="press mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-70"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>

      {staticQrPayload && (
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
          <div className="text-sm font-semibold">Payment QR</div>
          <div className="text-[11px] text-muted-foreground">
            Print or share — customers can also scan this with any UPI app.
          </div>
          <div className="mt-4 flex justify-center rounded-2xl bg-white p-4">
            <QRCodeCanvas value={staticQrPayload} size={200} includeMargin level="M" />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2">
            <span className="truncate text-xs font-medium">{vpa}</span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(vpa);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="press flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {previewUrl && (
            <div className="mt-3 break-all rounded-xl bg-secondary/60 px-3 py-2 text-[10px] text-muted-foreground">
              Preview link (₹100): {previewUrl}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
