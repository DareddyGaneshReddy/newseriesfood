ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

UPDATE public.orders SET payment_status = 'paid', paid_at = COALESCE(paid_at, updated_at)
WHERE status = 'delivered' AND payment_status = 'pending';

CREATE POLICY "Admins read all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));