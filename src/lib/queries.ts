import { supabase } from "@/integrations/supabase/client";
import { imageFor } from "./menu-images";
import type { MenuItemRow } from "@/components/menu-card";

export type Category = { id: string; name: string; slug: string; icon: string | null; sort_order: number };

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchMenu(): Promise<(MenuItemRow & { category_id: string; is_popular: boolean })[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("id,category_id,name,description,price,is_veg,is_bestseller,is_chef_special,is_popular,prep_time_min,rating,image_url")
    .eq("is_available", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    price: Number(r.price),
    rating: r.rating ? Number(r.rating) : 4.5,
    image_url: r.image_url ?? imageFor(r.name),
  })) as (MenuItemRow & { category_id: string; is_popular: boolean })[];
}

export async function fetchMenuItem(id: string) {
  const { data, error } = await supabase.from("menu_items").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    price: Number(data.price),
    rating: data.rating ? Number(data.rating) : 4.5,
    image_url: data.image_url ?? imageFor(data.name),
  };
}
