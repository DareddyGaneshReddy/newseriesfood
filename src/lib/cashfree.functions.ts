import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const itemSchema = z.object({
  menu_item_id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().min(1).max(99),
  notes: z.string().nullable().optional(),
});

const draftSchema = z.object({
  order_type: z.enum(["delivery", "pickup", "dine_in"]),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  delivery_fee: z.number().min(0),
  packing_fee: z.number().min(0),
  discount: z.number().min(0),
  total: z.number().min(1).max(500000),
  address_line: z.string().max(500).nullable(),
  notes: z.string().max(500).nullable(),
  items: z.array(itemSchema).min(1).max(60),
  customer_name: z.string().max(120).nullable(),
  customer_phone: z.string().max(20).nullable(),
  origin: z.string().url(),
});

const CF_VERSION = "2023-08-01";

function cfBase() {
  const mode = (process.env["CASHFREE_ENV"] ?? "production").toLowerCase();
  return mode === "sandbox" ? "https://sandbox.cashfree.com" : "https://api.cashfree.com";
}

function cfHeaders() {
  const appId = process.env["CASHFREE_APP_ID"];
  const secret = process.env["CASHFREE_SECRET_KEY"];
  if (!appId || !secret) throw new Error("Cashfree is not configured yet.");
  return {
    "x-client-id": appId,
    "x-client-secret": secret,
    "x-api-version": CF_VERSION,
    "content-type": "application/json",
  };
}

/** Creates a Cashfree order and stores the draft. No app order exists yet. */
export const createCashfreePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => draftSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const cfOrderId = `NSF${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;

    const { error: insErr } = await supabase.from("payment_intents").insert({
      user_id: userId,
      cf_order_id: cfOrderId,
      amount: data.total,
      status: "created",
      payload: JSON.parse(JSON.stringify(data)),
    });
    if (insErr) throw new Error("Could not start the payment. Please try again.");

    const res = await fetch(`${cfBase()}/pg/orders`, {
      method: "POST",
      headers: cfHeaders(),
      body: JSON.stringify({
        order_id: cfOrderId,
        order_amount: Number(data.total.toFixed(2)),
        order_currency: "INR",
        customer_details: {
          customer_id: userId,
          customer_name: data.customer_name || "Customer",
          customer_phone: (data.customer_phone || "").replace(/\D/g, "").slice(-10) || "9999999999",
        },
        order_meta: {
          return_url: `${data.origin}/payment/return?cf_order_id=${cfOrderId}`,
        },
        order_note: `New Series Food Corner order`,
      }),
    });

    const body = await res.text();
    if (!res.ok) {
      console.error(`Cashfree create order failed [${res.status}]: ${body}`);
      throw new Error(`Payment could not be started [${res.status}]`);
    }
    const json = JSON.parse(body) as { payment_session_id?: string };
    if (!json.payment_session_id) throw new Error("Payment could not be started.");

    return { cfOrderId, paymentSessionId: json.payment_session_id };
  });

/**
 * Verifies the payment with Cashfree. The app order is created here — and only
 * here — after Cashfree itself reports the payment as PAID.
 */
export const verifyCashfreePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ cfOrderId: z.string().min(4).max(64) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: intent } = await supabase
      .from("payment_intents")
      .select("id, cf_order_id, amount, status, payload, order_id")
      .eq("cf_order_id", data.cfOrderId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!intent) return { status: "not_found" as const };
    if (intent.order_id) return { status: "paid" as const, orderId: intent.order_id };

    const res = await fetch(`${cfBase()}/pg/orders/${encodeURIComponent(data.cfOrderId)}`, {
      headers: cfHeaders(),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error(`Cashfree fetch order failed [${res.status}]: ${body}`);
      return { status: "pending" as const };
    }
    const cf = JSON.parse(body) as { order_status?: string; order_amount?: number };

    if (cf.order_status === "PAID") {
      if (Number(cf.order_amount) + 0.01 < Number(intent.amount)) {
        await supabase.from("payment_intents").update({ status: "failed" }).eq("id", intent.id);
        return { status: "failed" as const };
      }
      const d = draftSchema.parse(intent.payload);
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          status: "placed",
          order_type: d.order_type,
          payment_method: "upi",
          subtotal: d.subtotal,
          tax: d.tax,
          delivery_fee: d.delivery_fee,
          packing_fee: d.packing_fee,
          discount: d.discount,
          total: d.total,
          address_line: d.address_line,
          notes: d.notes,
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          upi_ref: data.cfOrderId,
        })
        .select("id")
        .single();
      if (error || !order) {
        console.error("Order creation after payment failed", error);
        return { status: "pending" as const };
      }
      const { error: itemsErr } = await supabase.from("order_items").insert(
        d.items.map((i) => ({
          order_id: order.id,
          menu_item_id: i.menu_item_id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          notes: i.notes ?? null,
        })),
      );
      if (itemsErr) console.error("Order items insert failed", itemsErr);

      await supabase
        .from("payment_intents")
        .update({ status: "paid", order_id: order.id })
        .eq("id", intent.id);

      return { status: "paid" as const, orderId: order.id };
    }

    if (cf.order_status === "ACTIVE") return { status: "pending" as const };

    await supabase.from("payment_intents").update({ status: "failed" }).eq("id", intent.id);
    return { status: "failed" as const };
  });
