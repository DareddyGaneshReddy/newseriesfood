declare module "@cashfreepayments/cashfree-js" {
  export type CashfreeCheckoutOptions = {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_top" | "_modal" | HTMLElement;
    returnUrl?: string;
  };
  export type Cashfree = {
    checkout: (options: CashfreeCheckoutOptions) => Promise<unknown>;
  };
  export function load(options: { mode: "production" | "sandbox" }): Promise<Cashfree>;
}
