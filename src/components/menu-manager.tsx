import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, ImagePlus, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories, fetchMenu } from "@/lib/queries";
import { imageFor } from "@/lib/menu-images";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  is_veg: boolean;
  is_available: boolean;
  is_bestseller: boolean;
  is_chef_special: boolean;
  is_popular: boolean;
  prep_time_min: number;
  spice_level: string | null;
  image_url: string | null;
  sort_order: number;
};

type Draft = {
  id?: string;
  category_id: string;
  name: string;
  description: string;
  price: string;
  is_veg: boolean;
  is_available: boolean;
  is_bestseller: boolean;
  is_chef_special: boolean;
  is_popular: boolean;
  prep_time_min: string;
  spice_level: string;
  image_url: string | null;
  sort_order: string;
};

const BUCKET = "menu-images";
// 10-year signed URLs — bucket is private so we serve via signed links.
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

const emptyDraft = (categoryId: string): Draft => ({
  category_id: categoryId,
  name: "",
  description: "",
  price: "",
  is_veg: true,
  is_available: true,
  is_bestseller: false,
  is_chef_special: false,
  is_popular: false,
  prep_time_min: "20",
  spice_level: "medium",
  image_url: null,
  sort_order: "0",
});

export function MenuManager() {
  const qc = useQueryClient();
  const cats = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const items = useQuery({
    queryKey: ["admin-menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as MenuItem[];
    },
  });

  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (items.data ?? []).filter((m) =>
      !query ? true : m.name.toLowerCase().includes(query),
    );
  }, [items.data, q]);

  const openNew = () => {
    const first = cats.data?.[0]?.id;
    if (!first) return toast.error("Add a category first");
    setEditing(emptyDraft(first));
  };

  const openEdit = (m: MenuItem) => {
    setEditing({
      id: m.id,
      category_id: m.category_id,
      name: m.name,
      description: m.description ?? "",
      price: String(m.price),
      is_veg: m.is_veg,
      is_available: m.is_available,
      is_bestseller: m.is_bestseller,
      is_chef_special: m.is_chef_special,
      is_popular: m.is_popular,
      prep_time_min: String(m.prep_time_min),
      spice_level: m.spice_level ?? "medium",
      image_url: m.image_url,
      sort_order: String(m.sort_order),
    });
  };

  const remove = async (m: MenuItem) => {
    if (!confirm(`Delete "${m.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
    qc.invalidateQueries({ queryKey: ["menu"] });
  };

  return (
    <div className="flex flex-col gap-3 px-5 pt-4 pb-24">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-2 shadow-soft">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={openNew}
          className="press flex items-center gap-1 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {cats.data?.map((c) => {
        const rows = filtered.filter((m) => m.category_id === c.id);
        if (rows.length === 0) return null;
        return (
          <div key={c.id}>
            <h3 className="mt-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {c.icon} {c.name}
            </h3>
            <div className="mt-2 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
              {rows.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                  <img
                    src={m.image_url ?? imageFor(m.name)}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = imageFor(m.name);
                    }}
                    alt={m.name}
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-block h-2 w-2 rounded-sm",
                          m.is_veg ? "bg-[oklch(0.55_0.12_140)]" : "bg-destructive",
                        )}
                      />
                      <div className="truncate text-sm font-medium">{m.name}</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {inr(Number(m.price))} · {m.is_available ? "Available" : "Sold out"}
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(m)}
                    aria-label="Edit"
                    className="press flex h-8 w-8 items-center justify-center rounded-full bg-secondary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(m)}
                    aria-label="Delete"
                    className="press flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {editing && (
        <EditorSheet
          key={editing.id ?? "new"}
          draft={editing}
          categories={cats.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
            qc.invalidateQueries({ queryKey: ["menu"] });
          }}
        />
      )}
    </div>
  );
}

function EditorSheet({
  draft,
  categories,
  onClose,
  onSaved,
}: {
  draft: Draft;
  categories: { id: string; name: string; icon: string | null }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [d, setD] = useState<Draft>(draft);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!draft.id;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setD((s) => ({ ...s, [k]: v }));

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a JPG or PNG image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL);
      if (sErr) throw sErr;
      set("image_url", signed.signedUrl);
      toast.success("Image uploaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!d.name.trim()) return toast.error("Name is required");
    const price = Number(d.price);
    if (!isFinite(price) || price < 0) return toast.error("Enter a valid price");
    setSaving(true);
    const payload = {
      category_id: d.category_id,
      name: d.name.trim(),
      description: d.description.trim() || null,
      price,
      is_veg: d.is_veg,
      is_available: d.is_available,
      is_bestseller: d.is_bestseller,
      is_chef_special: d.is_chef_special,
      is_popular: d.is_popular,
      prep_time_min: Number(d.prep_time_min) || 20,
      spice_level: d.spice_level || null,
      image_url: d.image_url,
      sort_order: Number(d.sort_order) || 0,
    };
    const { error } = isEdit
      ? await supabase.from("menu_items").update(payload).eq("id", d.id!)
      : await supabase.from("menu_items").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(isEdit ? "Saved" : "Added");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-auto flex max-h-[92vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-3xl bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <h2 className="text-base font-semibold">{isEdit ? "Edit item" : "New item"}</h2>
          <button onClick={onClose} className="press flex h-8 w-8 items-center justify-center rounded-full bg-secondary" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Image */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground">Photo</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-secondary">
                {d.image_url ? (
                  <img src={d.image_url} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImagePlus className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
                <button
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="press flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  {d.image_url ? "Replace" : "Upload"}
                </button>
                {d.image_url && (
                  <button
                    onClick={() => set("image_url", null)}
                    className="press text-[11px] font-medium text-destructive"
                  >
                    Remove photo
                  </button>
                )}
                <div className="text-[10px] text-muted-foreground">JPG / PNG · up to 5MB</div>
              </div>
            </div>
          </div>

          <Field label="Name">
            <input value={d.name} onChange={(e) => set("name", e.target.value)} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
          </Field>
          <Field label="Description">
            <textarea rows={2} value={d.description} onChange={(e) => set("description", e.target.value)} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)">
              <input inputMode="decimal" value={d.price} onChange={(e) => set("price", e.target.value)} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
            <Field label="Prep time (min)">
              <input inputMode="numeric" value={d.prep_time_min} onChange={(e) => set("prep_time_min", e.target.value)} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
          </div>

          <Field label="Category">
            <select value={d.category_id} onChange={(e) => set("category_id", e.target.value)} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Spice level">
              <select value={d.spice_level} onChange={(e) => set("spice_level", e.target.value)} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="none">None</option>
                <option value="mild">Mild</option>
                <option value="medium">Medium</option>
                <option value="hot">Hot</option>
              </select>
            </Field>
            <Field label="Sort order">
              <input inputMode="numeric" value={d.sort_order} onChange={(e) => set("sort_order", e.target.value)} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Toggle label="Vegetarian" value={d.is_veg} onChange={(v) => set("is_veg", v)} />
            <Toggle label="Available" value={d.is_available} onChange={(v) => set("is_available", v)} />
            <Toggle label="Bestseller" value={d.is_bestseller} onChange={(v) => set("is_bestseller", v)} />
            <Toggle label="Chef's special" value={d.is_chef_special} onChange={(v) => set("is_chef_special", v)} />
            <Toggle label="Popular" value={d.is_popular} onChange={(v) => set("is_popular", v)} />
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border/60 px-5 py-3">
          <button onClick={onClose} className="press flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || uploading}
            className="press flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEdit ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "press flex items-center justify-between rounded-2xl border px-3 py-2 text-xs font-medium",
        value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-foreground/70",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "ml-2 inline-flex h-4 w-7 items-center rounded-full transition-colors",
          value ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "inline-block h-3 w-3 rounded-full bg-background shadow transition-transform",
            value ? "translate-x-3.5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
