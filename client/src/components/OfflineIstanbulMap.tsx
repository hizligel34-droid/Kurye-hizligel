import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { FileSource, PMTiles, Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import { getOfflinePmtilesFile } from "@/lib/offlinePackages";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPinned, Wifi, WifiOff } from "lucide-react";

const OFFLINE_PACKAGE_ID = "istanbul-osm-shortbread";
const offlineProtocol = new Protocol({ metadata: true });
let protocolRegistered = false;

export type CourierMapLocation = { lat: number; lng: number; updatedAt: number };
type OfflineIstanbulMapProps = { offlinePackageReady?: boolean; courierLocation?: CourierMapLocation | null };

function registerOfflineProtocol() {
  if (!protocolRegistered) {
    maplibregl.addProtocol("pmtiles", offlineProtocol.tile);
    protocolRegistered = true;
  }
}

export function OfflineIstanbulMap({ offlinePackageReady = false, courierLocation = null }: OfflineIstanbulMapProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineFile, setOfflineFile] = useState<File | null>(null);
  const [offlineError, setOfflineError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const courierMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!offlinePackageReady) {
      setOfflineFile(null);
      return;
    }
    let active = true;
    setOfflineError("");
    setIsLoading(true);
    getOfflinePmtilesFile(OFFLINE_PACKAGE_ID)
      .then(file => { if (active) setOfflineFile(file); })
      .catch(error => { if (active) setOfflineError(error instanceof Error ? error.message : "İstanbul offline harita paketi açılamadı"); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [offlinePackageReady]);

  useEffect(() => {
    if (!offlineFile || !mapContainer.current) return;
    registerOfflineProtocol();
    const archive = new PMTiles(new FileSource(offlineFile));
    offlineProtocol.add(archive);
    const map = new maplibregl.Map({
      container: mapContainer.current,
      center: [28.9784, 41.0082],
      zoom: 10,
      minZoom: 8,
      maxZoom: 16,
      attributionControl: false,
      style: {
        version: 8,
        sources: { istanbul: { type: "vector", url: `pmtiles://${offlineFile.name}` } },
        layers: [
          { id: "background", type: "background", paint: { "background-color": "#e9edf0" } },
          { id: "landuse", type: "fill", source: "istanbul", "source-layer": "landuse", paint: { "fill-color": "#dfead8", "fill-opacity": 0.7 } },
          { id: "water", type: "fill", source: "istanbul", "source-layer": "water", paint: { "fill-color": "#a9d9f3" } },
          { id: "transportation", type: "line", source: "istanbul", "source-layer": "transportation", paint: { "line-color": "#d28756", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.4, 14, 2.5] } },
          { id: "building", type: "fill", source: "istanbul", "source-layer": "building", minzoom: 13, paint: { "fill-color": "#e5d9d1", "fill-opacity": 0.7 } },
        ],
      },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    return () => { courierMarkerRef.current?.remove(); courierMarkerRef.current = null; mapRef.current = null; map.remove(); };
  }, [offlineFile]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !courierLocation) return;
    const point: [number, number] = [courierLocation.lng, courierLocation.lat];
    if (!courierMarkerRef.current) {
      const element = document.createElement("div");
      element.className = "h-5 w-5 rounded-full border-4 border-white bg-[#e54725] shadow-[0_0_0_6px_rgba(229,71,37,0.22)]";
      courierMarkerRef.current = new maplibregl.Marker({ element }).setLngLat(point).addTo(map);
    } else {
      courierMarkerRef.current.setLngLat(point);
    }
    map.easeTo({ center: point, duration: 450, essential: true });
  }, [courierLocation]);

  const showMap = Boolean(offlineFile);
  return (
    <Card className="overflow-hidden rounded-3xl border-0 bg-white shadow-sm">
      <CardHeader className="gap-3 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl"><MapPinned className="text-[#e54725]" size={21} />İstanbul canlı takip haritası</CardTitle>
          <p className="mt-1 text-sm text-slate-500">İndirilen İstanbul PMTiles paketi cihazınızda açılır; kurye konumu bağlantı üzerinden yenilenir.</p>
        </div>
        <Badge className={isOnline ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}>{isOnline ? <><Wifi className="mr-1" size={14} />Çevrim içi</> : <><WifiOff className="mr-1" size={14} />Çevrim dışı</>}</Badge>
      </CardHeader>
      <CardContent className="p-0">
        {showMap ? <div ref={mapContainer} className="h-[360px] w-full bg-slate-100 sm:h-[440px]" aria-label="İstanbul offline PMTiles haritası" /> : <div className="flex min-h-[260px] flex-col items-center justify-center bg-slate-50 px-6 text-center"><WifiOff className="mb-3 text-slate-400" size={30} /><p className="font-bold text-slate-800">{isLoading ? "İstanbul offline harita hazırlanıyor" : offlineError ? "İstanbul offline harita açılamadı" : "İstanbul harita paketi bekleniyor"}</p><p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">{isLoading ? "Cihazdaki İstanbul PMTiles paketi okunuyor." : offlineError || "Haritayı çevrim dışı kullanmak için önce İstanbul paketini indirmeniz gerekir."}</p></div>}
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500"><span>Harita verisi cihazdaki İstanbul PMTiles paketinden okunur. Bu paket tek başına offline rota veya kesin fiyat üretmez.</span></div>
      </CardContent>
    </Card>
  );
}


