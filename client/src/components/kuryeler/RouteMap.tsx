import { OSM_ATTRIBUTION } from "@shared/kuryelerRouting";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

type LatLng = { lat: number; lng: number };

type Props = {
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
  geometry?: [number, number][];
  className?: string;
  onPickup?: (lat: number, lng: number) => void;
  onDropoff?: (lat: number, lng: number) => void;
  active?: "pickup" | "dropoff";
  interactive?: boolean;
};

export function RouteMap({
  pickup,
  dropoff,
  geometry = [],
  className = "h-64",
  onPickup,
  onDropoff,
  active = "pickup",
  interactive = true,
}: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const activeRef = useRef(active);
  const pickupCb = useRef(onPickup);
  const dropoffCb = useRef(onDropoff);
  activeRef.current = active;
  pickupCb.current = onPickup;
  dropoffCb.current = onDropoff;

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, {
      zoomControl: true,
      attributionControl: true,
      dragging: interactive,
      scrollWheelZoom: interactive,
    }).setView([41.02, 29.0], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: OSM_ATTRIBUTION,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    map.on("click", event => {
      if (!interactive) return;
      if (activeRef.current === "dropoff") dropoffCb.current?.(event.latlng.lat, event.latlng.lng);
      else pickupCb.current?.(event.latlng.lat, event.latlng.lng);
    });
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    return () => {
      window.clearTimeout(t);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [interactive]);

  useEffect(() => {
    const map = mapRef.current;
    const layers = layerRef.current;
    if (!map || !layers) return;
    layers.clearLayers();
    const bounds: L.LatLngExpression[] = [];
    if (geometry.length > 1) {
      L.polyline(geometry, { color: "#D4AF37", weight: 4, opacity: 0.95 }).addTo(layers);
      geometry.forEach(point => bounds.push(point));
    }
    if (pickup) {
      L.circleMarker([pickup.lat, pickup.lng], {
        radius: 9,
        color: "#D4AF37",
        fillColor: "#D4AF37",
        fillOpacity: 1,
      })
        .bindTooltip("Alım", { permanent: false })
        .addTo(layers);
      bounds.push([pickup.lat, pickup.lng]);
    }
    if (dropoff) {
      L.circleMarker([dropoff.lat, dropoff.lng], {
        radius: 9,
        color: "#f5edd6",
        fillColor: "#0a0a0a",
        fillOpacity: 1,
        weight: 3,
      })
        .bindTooltip("Teslim", { permanent: false })
        .addTo(layers);
      bounds.push([dropoff.lat, dropoff.lng]);
    }
    if (bounds.length > 1) map.fitBounds(L.latLngBounds(bounds), { padding: [28, 28] });
    else if (bounds.length === 1) map.setView(bounds[0], 14);
  }, [pickup, dropoff, geometry]);

  return (
    <div
      ref={elRef}
      className={`leaflet-kuryeler w-full overflow-hidden rounded-2xl border border-[#3a3014] ${className}`}
      role="application"
      aria-label="Sürüş rotası haritası"
    />
  );
}
