
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  birthday DATE,
  loyalty_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Menu items
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  is_veg BOOLEAN NOT NULL DEFAULT true,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  is_chef_special BOOLEAN NOT NULL DEFAULT false,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  prep_time_min INT NOT NULL DEFAULT 20,
  spice_level TEXT DEFAULT 'medium',
  rating NUMERIC(3,2) DEFAULT 4.5,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read menu" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage menu" ON public.menu_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Addresses
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT,
  pincode TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own addresses" ON public.addresses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Favorites
CREATE TABLE public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, menu_item_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own favorites" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Orders
CREATE TYPE public.order_status AS ENUM ('placed','accepted','preparing','ready','out_for_delivery','delivered','cancelled');
CREATE TYPE public.order_type AS ENUM ('delivery','pickup','dine_in');
CREATE TYPE public.payment_method AS ENUM ('cash','upi','card','wallet');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE DEFAULT ('NSF' || to_char(now(),'YYMMDD') || lpad((floor(random()*10000))::text,4,'0')),
  status public.order_status NOT NULL DEFAULT 'placed',
  order_type public.order_type NOT NULL DEFAULT 'delivery',
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  subtotal NUMERIC(10,2) NOT NULL,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  packing_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  address_line TEXT,
  notes TEXT,
  eta_minutes INT DEFAULT 35,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL,
  customizations JSONB,
  notes TEXT
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read order items for own orders" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Insert order items for own orders" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- Coupons
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_percent INT,
  discount_flat NUMERIC(10,2),
  min_order NUMERIC(10,2) DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read coupons" ON public.coupons FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_menu_items_updated BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed the menu
INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
  ('Veg Meals','veg-meals','🥗',1),
  ('Indian Breads','breads','🫓',2),
  ('Veg Curries','veg-curries','🥘',3),
  ('Non-Veg','non-veg','🍗',4),
  ('Biryani','biryani','🍚',5),
  ('Chinese Veg','chinese-veg','🍜',6),
  ('Chinese Non-Veg','chinese-non-veg','🥡',7),
  ('Beverages','beverages','🥤',8),
  ('Chef Specials','chef-specials','⭐',9);

WITH c AS (SELECT id, slug FROM public.categories)
INSERT INTO public.menu_items (category_id, name, description, price, is_veg, is_popular, is_bestseller, is_chef_special, prep_time_min, spice_level) VALUES
  ((SELECT id FROM c WHERE slug='veg-meals'),'Mini Meals','A light South Indian thali with rice, sambar, rasam, curry & curd.',80,true,true,false,false,15,'mild'),
  ((SELECT id FROM c WHERE slug='veg-meals'),'Full Veg Meals','Unlimited rice, dal, two curries, rasam, curd, pickle & sweet.',130,true,true,true,false,20,'mild'),
  ((SELECT id FROM c WHERE slug='veg-meals'),'Curd Rice','Cool curd rice tempered with mustard, curry leaves & pomegranate.',60,true,false,false,false,10,'mild'),
  ((SELECT id FROM c WHERE slug='veg-meals'),'Lemon Rice','Tangy lemon rice with peanuts and curry leaves.',60,true,false,false,false,10,'mild'),
  ((SELECT id FROM c WHERE slug='veg-meals'),'Tomato Rice','Aromatic rice tossed with tangy tomato masala.',70,true,false,false,false,15,'medium'),
  ((SELECT id FROM c WHERE slug='veg-meals'),'Veg Biryani','Fragrant basmati rice layered with vegetables & spices.',130,true,true,false,false,25,'medium'),
  ((SELECT id FROM c WHERE slug='veg-meals'),'Jeera Rice','Basmati rice tempered with cumin and ghee.',100,true,false,false,false,15,'mild'),

  ((SELECT id FROM c WHERE slug='breads'),'Plain Roti','Soft whole wheat roti, straight from the tandoor.',20,true,false,false,false,8,'mild'),
  ((SELECT id FROM c WHERE slug='breads'),'Butter Roti','Whole wheat roti brushed with rich white butter.',25,true,false,false,false,8,'mild'),
  ((SELECT id FROM c WHERE slug='breads'),'Plain Naan','Soft, pillowy naan baked in the tandoor.',35,true,false,false,false,10,'mild'),
  ((SELECT id FROM c WHERE slug='breads'),'Butter Naan','Naan brushed with melted butter — a classic pairing.',45,true,true,false,false,10,'mild'),

  ((SELECT id FROM c WHERE slug='veg-curries'),'Dal Fry','Yellow lentils tempered with cumin, garlic and tomato.',90,true,false,false,false,15,'medium'),
  ((SELECT id FROM c WHERE slug='veg-curries'),'Dal Tadka','Slow-cooked dal finished with a smoky ghee tempering.',100,true,true,false,false,15,'medium'),
  ((SELECT id FROM c WHERE slug='veg-curries'),'Mixed Veg Curry','Seasonal vegetables in a lightly spiced masala.',120,true,false,false,false,20,'medium'),
  ((SELECT id FROM c WHERE slug='veg-curries'),'Paneer Butter Masala','Cottage cheese in a rich tomato-cashew gravy.',180,true,true,true,false,20,'medium'),
  ((SELECT id FROM c WHERE slug='veg-curries'),'Kadai Paneer','Paneer tossed with peppers in an aromatic kadai masala.',180,true,false,false,false,20,'medium'),
  ((SELECT id FROM c WHERE slug='veg-curries'),'Palak Paneer','Paneer simmered in a smooth spinach gravy.',170,true,false,false,false,20,'mild'),
  ((SELECT id FROM c WHERE slug='veg-curries'),'Mushroom Masala','Button mushrooms in a spiced onion-tomato gravy.',170,true,false,false,false,20,'medium'),

  ((SELECT id FROM c WHERE slug='non-veg'),'Chicken Meals','Steamed rice, dal, veg, curd and a portion of chicken curry.',180,false,true,true,false,20,'medium'),
  ((SELECT id FROM c WHERE slug='non-veg'),'Chicken Curry','Home-style chicken curry with warm spices.',180,false,false,false,false,25,'medium'),
  ((SELECT id FROM c WHERE slug='non-veg'),'Butter Chicken','Tandoori chicken in a silky tomato-butter gravy.',220,false,true,true,false,25,'medium'),
  ((SELECT id FROM c WHERE slug='non-veg'),'Kadai Chicken','Chicken tossed with peppers and freshly ground kadai spices.',220,false,false,false,false,25,'spicy'),
  ((SELECT id FROM c WHERE slug='non-veg'),'Chicken Fry','Pan-fried chicken with roasted spices.',200,false,false,false,false,25,'spicy'),
  ((SELECT id FROM c WHERE slug='non-veg'),'Chicken 65','Spicy, deep-fried Chennai-style chicken.',220,false,true,false,false,20,'spicy'),
  ((SELECT id FROM c WHERE slug='non-veg'),'Mutton Curry','Slow-cooked mutton in a deeply spiced gravy.',280,false,false,false,false,35,'spicy'),
  ((SELECT id FROM c WHERE slug='non-veg'),'Mutton Fry','Dry mutton preparation with roasted masala.',300,false,false,false,false,35,'spicy'),
  ((SELECT id FROM c WHERE slug='non-veg'),'Fish Curry','Coastal-style fish curry with tamarind and coconut.',220,false,false,false,false,25,'medium'),
  ((SELECT id FROM c WHERE slug='non-veg'),'Fish Fry','Marinated fish, shallow-fried till crisp.',240,false,false,false,false,20,'medium'),
  ((SELECT id FROM c WHERE slug='non-veg'),'Egg Curry','Boiled eggs simmered in a home-style masala.',120,false,false,false,false,15,'medium'),
  ((SELECT id FROM c WHERE slug='non-veg'),'Omelette','Fluffy 2-egg omelette with onions and green chillies.',60,false,false,false,false,10,'mild'),

  ((SELECT id FROM c WHERE slug='biryani'),'Veg Biryani','Aromatic basmati rice layered with vegetables.',130,true,true,false,false,25,'medium'),
  ((SELECT id FROM c WHERE slug='biryani'),'Egg Biryani','Basmati rice layered with masala eggs.',150,false,false,false,false,25,'medium'),
  ((SELECT id FROM c WHERE slug='biryani'),'Chicken Biryani','Long-grain basmati dum-cooked with marinated chicken.',220,false,true,true,true,30,'medium'),
  ((SELECT id FROM c WHERE slug='biryani'),'Mutton Biryani','Slow-cooked mutton biryani, our house specialty.',300,false,true,true,true,40,'spicy'),

  ((SELECT id FROM c WHERE slug='chinese-veg'),'Veg Fried Rice','Wok-tossed rice with fresh vegetables and soy.',140,true,true,false,false,15,'mild'),
  ((SELECT id FROM c WHERE slug='chinese-veg'),'Veg Noodles','Hakka noodles stir-fried with garden vegetables.',140,true,true,false,false,15,'mild'),
  ((SELECT id FROM c WHERE slug='chinese-veg'),'Gobi Manchurian','Crispy cauliflower tossed in tangy Manchurian sauce.',160,true,true,false,false,20,'spicy'),
  ((SELECT id FROM c WHERE slug='chinese-veg'),'Veg Manchurian','Mixed vegetable dumplings in a spicy soy-garlic gravy.',160,true,false,false,false,20,'spicy'),
  ((SELECT id FROM c WHERE slug='chinese-veg'),'Chilli Paneer','Paneer cubes tossed with peppers in a spicy sauce.',190,true,true,false,false,20,'spicy'),
  ((SELECT id FROM c WHERE slug='chinese-veg'),'Paneer Fried Rice','Fried rice with pan-tossed paneer cubes.',180,true,false,false,false,20,'mild'),

  ((SELECT id FROM c WHERE slug='chinese-non-veg'),'Egg Fried Rice','Wok-tossed rice with scrambled egg and spring onion.',150,false,false,false,false,15,'mild'),
  ((SELECT id FROM c WHERE slug='chinese-non-veg'),'Chicken Fried Rice','Fried rice tossed with tender chicken pieces.',180,false,true,true,false,20,'mild'),
  ((SELECT id FROM c WHERE slug='chinese-non-veg'),'Egg Noodles','Hakka noodles stir-fried with scrambled egg.',150,false,false,false,false,15,'mild'),
  ((SELECT id FROM c WHERE slug='chinese-non-veg'),'Chicken Noodles','Hakka noodles with tender chicken and vegetables.',180,false,true,false,false,20,'mild'),
  ((SELECT id FROM c WHERE slug='chinese-non-veg'),'Chicken Manchurian','Crispy chicken tossed in a rich Manchurian sauce.',220,false,false,false,false,25,'spicy'),
  ((SELECT id FROM c WHERE slug='chinese-non-veg'),'Chilli Chicken','Chef-style chilli chicken with peppers and onions.',220,false,true,true,false,25,'spicy'),
  ((SELECT id FROM c WHERE slug='chinese-non-veg'),'Dragon Chicken','Fiery Indo-Chinese classic with cashews and dry chillies.',250,false,false,false,true,25,'spicy'),
  ((SELECT id FROM c WHERE slug='chinese-non-veg'),'Chicken Lollipop (6 pcs)','Six frenched chicken wings marinated and fried.',250,false,true,false,true,25,'spicy'),

  ((SELECT id FROM c WHERE slug='beverages'),'Mineral Water','Chilled 500ml bottled water.',20,true,false,false,false,2,'mild'),
  ((SELECT id FROM c WHERE slug='beverages'),'Soft Drink','Assorted 250ml chilled soft drinks.',40,true,false,false,false,2,'mild'),
  ((SELECT id FROM c WHERE slug='beverages'),'Buttermilk','Chilled spiced buttermilk with curry leaves.',30,true,true,false,false,3,'mild'),
  ((SELECT id FROM c WHERE slug='beverages'),'Fresh Lime Soda','Sweet & salt lime soda, freshly made.',50,true,false,false,false,4,'mild'),
  ((SELECT id FROM c WHERE slug='beverages'),'Tea','Cutting-style masala chai.',15,true,false,false,false,5,'mild'),
  ((SELECT id FROM c WHERE slug='beverages'),'Coffee','Freshly brewed South Indian filter coffee.',20,true,false,false,false,5,'mild'),

  ((SELECT id FROM c WHERE slug='chef-specials'),'Chicken Biryani + Soft Drink','Our signature chicken biryani paired with a chilled soft drink.',250,false,true,true,true,30,'medium'),
  ((SELECT id FROM c WHERE slug='chef-specials'),'Veg Meals + Buttermilk','Full veg meals with a glass of chilled buttermilk.',150,true,true,false,true,20,'mild'),
  ((SELECT id FROM c WHERE slug='chef-specials'),'Chicken Fried Rice + Chilli Chicken','Chef-favourite combo of chicken fried rice with chilli chicken.',300,false,true,true,true,25,'spicy');

-- Sample coupons
INSERT INTO public.coupons (code, description, discount_percent, min_order) VALUES
  ('WELCOME10','10% off on your first order',10,100),
  ('FEAST50','Flat ₹50 off on orders above ₹400',NULL,400);
UPDATE public.coupons SET discount_flat = 50 WHERE code = 'FEAST50';
