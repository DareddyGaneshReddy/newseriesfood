import { useEffect, useRef, useState } from "react";

// Delivery start location (Vijayawada - Singh Nagar - Dabha Kotlu Center)
const RESTAURANT: [number, number] = [16.5373364, 80.6364737];
const RESTAURANT_LABEL = "Vijayawada - Singh Nagar - Dabha Kotlu Center";

const STAGE_PROGRESS: Record<string, number> = {
  placed: 0,
  accepted: 0,
  preparing: 0,
  ready: 0.05,
  out_for_delivery: 0.55,
  delivered: 1,
};

type Props = {
  status: string;
  address: string | null;
  etaMinutes?: number | null;
};

async function geocode(addr: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`,
      { headers: { "Accept-Language": "en" } },
    );
    const j = await res.json();
    if (Array.isArray(j) && j[0]) return [parseFloat(j[0].lat), parseFloat(j[0].lon)];
  } catch {}
  return null;
}

function interpolate(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function DeliveryMap({ status, address, etaMinutes }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<{
    map?: import("leaflet").Map;
    courier?: import("leaflet").Marker;
    dest?: import("leaflet").Marker;
    line?: import("leaflet").Polyline;
    L?: typeof import("leaflet");
  }>({});
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [ready, setReady] = useState(false);
  const [animT, setAnimT] = useState(STAGE_PROGRESS[status] ?? 0);

  // Geocode destination
  useEffect(() => {
    let alive = true;
    if (!address) {
      setDestCoords([RESTAURANT[0] + 0.018, RESTAURANT[1] + 0.022]);
      return;
    }
    geocode(address).then((c) => {
      if (!alive) return;
      setDestCoords(c ?? [RESTAURANT[0] + 0.018, RESTAURANT[1] + 0.022]);
    });
    return () => { alive = false; };
  }, [address]);

  // Init map once destination known
  useEffect(() => {
    if (!destCoords || !mapRef.current || stateRef.current.map) return;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const restaurantIcon = L.divIcon({
        className: "",
        html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#D96C3B;color:white;box-shadow:0 4px 14px rgba(217,108,59,0.45);border:2px solid white;font-size:16px">🍽️</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const destIcon = L.divIcon({
        className: "",
        html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#7A8F54;color:white;box-shadow:0 4px 14px rgba(122,143,84,0.45);border:2px solid white;font-size:16px">📍</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });
      const courierIcon = L.divIcon({
        className: "",
        html: `<div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;background:#D8A031;color:white;box-shadow:0 6px 18px rgba(216,160,49,0.55);border:2px solid white;font-size:18px">🛵</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      L.marker(RESTAURANT, { icon: restaurantIcon }).addTo(map).bindTooltip(RESTAURANT_LABEL);
      const dest = L.marker(destCoords, { icon: destIcon }).addTo(map).bindTooltip("Delivery address");

      const line = L.polyline([RESTAURANT, destCoords], {
        color: "#D96C3B",
        weight: 4,
        opacity: 0.6,
        dashArray: "8 8",
      }).addTo(map);

      const t = STAGE_PROGRESS[status] ?? 0;
      const courierPos = interpolate(RESTAURANT, destCoords, t);
      const courier = L.marker(courierPos, { icon: courierIcon, zIndexOffset: 1000 }).addTo(map);

      map.fitBounds(L.latLngBounds([RESTAURANT, destCoords]).pad(0.35));

      stateRef.current = { map, courier, dest, line, L };
      setReady(true);
    })();
    return () => {
      cancelled = true;
      stateRef.current.map?.remove();
      stateRef.current = {};
    };
  }, [destCoords]);

  // Animate courier as status advances (slow drift while out_for_delivery)
  useEffect(() => {
    const base = STAGE_PROGRESS[status] ?? 0;
    setAnimT(base);
    if (status !== "out_for_delivery") return;
    let raf = 0;
    const start = performance.now();
    const durationMs = Math.max(60_000, (etaMinutes ?? 10) * 60_000 * 0.6);
    const from = base;
    const to = 0.95;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setAnimT(from + (to - from) * p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, etaMinutes]);

  // Push courier position
  useEffect(() => {
    if (!ready || !destCoords) return;
    const { courier } = stateRef.current;
    if (!courier) return;
    const pos = interpolate(RESTAURANT, destCoords, animT);
    courier.setLatLng(pos);
  }, [animT, ready, destCoords]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
      <div ref={mapRef} className="h-64 w-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/40 text-xs text-muted-foreground">
          Loading live map…
        </div>
      )}
      <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-[11px] font-medium shadow-soft backdrop-blur">
        {status === "delivered"
          ? "Delivered"
          : status === "out_for_delivery"
            ? "Rider on the way"
            : status === "ready"
              ? "Rider picking up"
              : "Preparing your order"}
      </div>
    </div>
  );
}
