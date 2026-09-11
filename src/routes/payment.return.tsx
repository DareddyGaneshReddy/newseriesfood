import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { verifyCashfreePayment } from "@/lib/cashfree.functions";
import { useCart } from "@/lib/cart-store";

export const Route = createFileRoute("/payment/return")({
  head: () => ({
    meta: [
      { title: "Confirming your payment — New Series Food Corner" },
      { name: "description", content: "We are confirming your payment with the bank before placing your food order." },
      { property: "og:title", content: "Confirming your payment" },
      { property: "og:description", content: "Payment confirmation for your New Series Food Corner order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaymentReturn,
});

type State = "checking" | "paid" | "failed";

function PaymentReturn() {
  const nav = useNavigate();
  const { clear } = useCart();
  const verify = useServerFn(verifyCashfreePayment);
  const [state, setState] = useState<State>("checking");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.search);
    const cfOrderId = params.get("cf_order_id") || params.get("order_id") || "";
    if (!cfOrderId) {
      setState("failed");
      return;
    }

    let cancelled = false;
    let attempt = 0;

    const run = async () => {
      while (!cancelled && attempt < 8) {
        attempt += 1;
        try {
          const r = await verify({ data: { cfOrderId } });
          if (cancelled) return;
          if (r.status === "paid" && "orderId" in r && r.orderId) {
            clear();
            setState("paid");
            nav({ to: "/order/$id", params: { id: r.orderId } });
            return;
          }
          if (r.status === "failed" || r.status === "not_found") {
            setState("failed");
            return;
          }
        } catch {
          // keep polling; network hiccup
        }
        await new Promise((res) => setTimeout(res, 2000));
      }
      if (!cancelled) setState("failed");
    };
    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MobileShell showTopBar={false} showBottomNav={false}>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
        {state === "checking" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h1 className="mt-4 text-lg font-semibold">Confirming your payment…</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Please don't close this screen. Your order is placed only once the payment is confirmed.
            </p>
          </>
        )}

        {state === "paid" && (
          <>
            <CheckCircle2 className="h-9 w-9 text-primary" />
            <h1 className="mt-4 text-lg font-semibold">Payment successful</h1>
            <p className="mt-1 text-sm text-muted-foreground">Taking you to your order…</p>
          </>
        )}

        {state === "failed" && (
          <>
            <XCircle className="h-9 w-9 text-destructive" />
            <h1 className="mt-4 text-lg font-semibold">Transaction failed — order cancelled</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              No money was taken and nothing was ordered. Your cart is still saved, so you can try again.
            </p>
            <Link
              to="/cart"
              className="press mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              Back to cart
            </Link>
            <Link to="/" className="mt-3 text-xs text-muted-foreground">
              Go to home
            </Link>
          </>
        )}
      </div>
    </MobileShell>
  );
}
