import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — New Series Food Corner" },
      {
        name: "description",
        content:
          "How New Series Food Corner collects, uses, and protects your personal data when you order food through our app or website.",
      },
      { property: "og:title", content: "Privacy Policy — New Series Food Corner" },
      {
        property: "og:description",
        content:
          "How New Series Food Corner collects, uses, and protects your personal data when you order food through our app or website.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        property: "og:url",
        content: "https://newseriesfood.lovable.app/privacy-policy",
      },
    ],
    links: [
      { rel: "canonical", href: "https://newseriesfood.lovable.app/privacy-policy" },
    ],
  }),
  component: PrivacyPolicyPage,
});

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPolicyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[440px] bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/90 px-5 py-3 backdrop-blur">
        <Link
          to="/"
          className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground/80"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Privacy Policy</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            New Series Food Corner
          </p>
        </div>
        <ShieldCheck className="ml-auto h-5 w-5 text-primary" aria-hidden="true" />
      </header>

      <article className="px-5 pb-16 pt-6">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Last updated: 19 September 2026
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Your privacy, in plain words
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          New Series Food Corner (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates
          the New Series Food Corner mobile app and website (together, the
          &ldquo;Service&rdquo;). This Privacy Policy explains what personal information we
          collect, why we collect it, how we protect it, and the choices you have. We collect only
          the information we need to take your order, deliver your food, and support your account.
          We do not sell your personal information.
        </p>

        <Section title="1. Information we collect">
          <p>
            <strong className="text-foreground">Account information.</strong> When you create an
            account we collect your email address and, if you sign in with Google, your name,
            email address, and Google account profile photo. Passwords are stored only as
            secure hashes — we never see or store your actual password.
          </p>
          <p>
            <strong className="text-foreground">Order information.</strong> When you place an
            order we collect the items you order, quantities, customisations, order notes, order
            type (delivery or pickup), delivery address you enter, and the bill breakdown
            (subtotal, taxes, delivery, packing, discounts).
          </p>
          <p>
            <strong className="text-foreground">Delivery location.</strong> With your permission,
            your device&rsquo;s approximate location may be used to pre-fill your delivery address
            and to show your order&rsquo;s progress on a map. Location is used only while the
            feature is in use and you can always type your address manually instead.
          </p>
          <p>
            <strong className="text-foreground">Payment information.</strong> If you pay through
            the Cashfree payment gateway, your card, UPI, or banking details are collected and
            processed directly by Cashfree (PCI-DSS compliant). We never receive or store your
            full card or banking credentials — only a payment identifier and its status. If you
            pay by UPI intent, we store the transaction reference (UTR) you confirm for
            reconciliation.
          </p>
          <p>
            <strong className="text-foreground">Device and technical data.</strong> Standard
            technical information such as device type, operating system, app version, and crash
            or error reports, used to keep the Service stable and secure.
          </p>
        </Section>

        <Section title="2. How we use your information">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>To create and secure your account and let you sign in.</li>
            <li>To process, prepare, deliver, and track your orders.</li>
            <li>To take and confirm payments, and handle refunds where applicable.</li>
            <li>To contact you about your order by email or through the app.</li>
            <li>To provide customer support and respond to your requests.</li>
            <li>To detect fraud, prevent abuse, and keep the Service secure.</li>
            <li>To improve the menu, features, and performance of the Service.</li>
            <li>To comply with legal and tax obligations.</li>
          </ul>
          <p>
            We do not use your personal information for third-party advertising, and we do not
            sell or rent it to anyone.
          </p>
        </Section>

        <Section title="3. Account information & sign-in">
          <p>
            You can sign in with an email address and password, with Google Sign-In, or browse as
            a guest. If you sign in with Google, we receive only the basic profile details Google
            shares (name, email, profile photo). You can manage or delete your account at any
            time from the Profile tab, including a self-service &ldquo;Delete account&rdquo;
            option.
          </p>
        </Section>

        <Section title="4. Order information">
          <p>
            Your order history is saved to your account so you can re-order and track deliveries.
            Restaurant staff can see order details (items, address, notes, and payment status)
            strictly to prepare and deliver your food. Order records may be retained as described
            in Section 10.
          </p>
        </Section>

        <Section title="5. Device permissions">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-foreground">Location (approximate):</strong> optional — used
              to show your area for delivery and to auto-fill the delivery address. You can deny
              this permission and enter addresses manually.
            </li>
            <li>
              <strong className="text-foreground">Open UPI / payment apps:</strong> optional —
              used only when you choose to pay through a UPI app, so your payment app can open
              with the amount pre-filled.
            </li>
          </ul>
          <p>
            All other features work without granting these permissions. You can revoke
            permissions at any time in your device settings.
          </p>
        </Section>

        <Section title="6. Payments">
          <p>
            Online payments are processed by <strong className="text-foreground">Cashfree</strong>{" "}
            (Cashfree Payments), a PCI-DSS Level 1 certified payment gateway, and where you choose
            a UPI app, by your UPI provider (such as PhonePe, Google Pay, or Paytm). Your payment
            credentials go directly to these processors and never pass through our servers in
            readable form. We receive only the payment status and a reference number needed to
            confirm your order. We do not store card numbers, CVV, UPI PINs, or bank credentials.
          </p>
        </Section>

        <Section title="7. Cookies & local storage">
          <p>
            The app stores small pieces of data on your device (such as your cart, sign-in
            session, and preferred location label) using browser local storage and secure cookies.
            These are strictly functional — they keep you signed in and remember your cart. We do
            not use advertising or tracking cookies.
          </p>
        </Section>

        <Section title="8. Third-party services">
          <p>
            We share the minimum data necessary with these trusted providers:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-foreground">Supabase</strong> — account management,
              authentication, and database hosting of order and menu data.
            </li>
            <li>
              <strong className="text-foreground">Cashfree Payments</strong> — payment
              processing.
            </li>
            <li>
              <strong className="text-foreground">Google</strong> — Google Sign-In (only your
              shared profile details) and map tiles for order tracking.
            </li>
            <li>
              <strong className="text-foreground">OpenStreetMap (Nominatim)</strong> — converting
              your coordinates into a readable locality name when you use location features.
            </li>
            <li>
              <strong className="text-foreground">Cloud hosting</strong> — serving the app and
              its content.
            </li>
          </ul>
          <p>
            These providers process data on our behalf under their own privacy and security
            obligations. We never share your data with advertisers.
          </p>
        </Section>

        <Section title="9. Data security">
          <p>
            Your data is transmitted over encrypted connections (HTTPS/TLS) and stored with
            industry-standard protections, including row-level access rules so that only you and
            authorised restaurant staff can see your orders. Payment processing is handled by a
            PCI-DSS certified gateway. Access to administrative data is limited to authorised
            staff accounts. No method of transmission or storage is 100% secure, but we work
            continuously to protect your information.
          </p>
        </Section>

        <Section title="10. Data retention">
          <p>
            We keep your account and order data for as long as your account is active, or as long
            as needed to provide the Service and comply with legal, accounting, and tax
            requirements. When you delete your account, your account details and personal
            information are deleted, except records we must retain for legal or tax purposes
            (such as completed order records), which are kept only for that required period.
          </p>
        </Section>

        <Section title="11. Your rights & choices">
          <p>You have the right to:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Access the personal information we hold about you.</li>
            <li>Correct inaccurate information, including your delivery details.</li>
            <li>Delete your account and associated personal data (Profile tab → Delete account).</li>
            <li>Withdraw permissions (location) in your device settings at any time.</li>
            <li>Request a copy of your data or ask us to stop processing it.</li>
          </ul>
          <p>
            To exercise any right that isn&rsquo;t available directly in the app, contact us at
            the address below and we will respond within a reasonable time.
          </p>
        </Section>

        <Section title="12. Children&rsquo;s privacy">
          <p>
            The Service is not directed at children under 13, and we do not knowingly collect
            personal information from children. If you believe a child has provided us personal
            information, contact us and we will delete it.
          </p>
        </Section>

        <Section title="13. Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. When we do, we will update the
            &ldquo;Last updated&rdquo; date above. Continued use of the Service after an update
            means you accept the revised policy.
          </p>
        </Section>

        <Section title="14. Contact us">
          <p>
            Questions about this policy or how your data is handled? Reach us at:
          </p>
          <div className="mt-2 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">New Series Food Corner</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Email:{" "}
              <a
                href="mailto:ganeshreddy778899@gmail.com"
                className="font-medium text-primary underline underline-offset-2"
              >
                ganeshreddy778899@gmail.com
              </a>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Vijayawada, Andhra Pradesh, India
            </p>
          </div>
        </Section>
      </article>
    </main>
  );
}
