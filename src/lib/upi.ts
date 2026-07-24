export type UpiApp = {
  id: string;
  name: string;
  color: string;
  // scheme used when the user taps a specific app (mobile deep link)
  scheme: (params: string) => string;
};

// Universal params string builder — every UPI app on Android/iOS understands `upi://pay?...`
// App-specific schemes below are best-effort fallbacks for direct-open on the respective apps.
export function buildUpiParams(opts: {
  vpa: string;
  payeeName: string;
  amount: number;
  note?: string;
  txnRef?: string;
}) {
  const q = new URLSearchParams();
  q.set("pa", opts.vpa);
  q.set("pn", opts.payeeName || "Merchant");
  q.set("am", opts.amount.toFixed(2));
  q.set("cu", "INR");
  if (opts.note) q.set("tn", opts.note);
  if (opts.txnRef) q.set("tr", opts.txnRef);
  return q.toString();
}

export function upiUniversalUrl(params: string) {
  return `upi://pay?${params}`;
}

export const UPI_APPS: UpiApp[] = [
  {
    id: "phonepe",
    name: "PhonePe",
    color: "#5F259F",
    scheme: (p) => `phonepe://pay?${p}`,
  },
  {
    id: "gpay",
    name: "Google Pay",
    color: "#1A73E8",
    scheme: (p) => `tez://upi/pay?${p}`,
  },
  {
    id: "paytm",
    name: "Paytm",
    color: "#00BAF2",
    scheme: (p) => `paytmmp://pay?${p}`,
  },
  {
    id: "bhim",
    name: "BHIM",
    color: "#F26522",
    scheme: (p) => `bhim://pay?${p}`,
  },
  {
    id: "amazonpay",
    name: "Amazon Pay",
    color: "#FF9900",
    scheme: (p) => `amazonpay://pay?${p}`,
  },
  {
    id: "any",
    name: "Other UPI app",
    color: "#7A8F54",
    scheme: (p) => `upi://pay?${p}`,
  },
];

export function isValidVpa(v: string) {
  return /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(v.trim());
}
