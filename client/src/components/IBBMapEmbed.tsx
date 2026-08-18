import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { FileSource, PMTiles, Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import { getOfflinePmtilesFile, resolveOfflineMapViewState } from "@/lib/offlinePackages";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPinned, Wifi, WifiOff } from "lucide-react";

const IBB_MAP_URL = "https://sehirharitasiapi.ibb.gov.tr/";
const IBB_API_URL = "https://sehirharitasiapi.ibb.gov.tr/developer/v1/";
const OFFLINE_PACKAGE_ID = "istanbul-osm-shortbread";
const offlineProtocol = new Protocol({ metadata: true });
let protocolRegistered = false;

type IBBMapEmbedProps = { offlinePackageReady?: boolean };

function registerOfflineProtocol() {
  if (!protocolRegistered) {
    maplibregl.addProtocol("pmtiles", offlineProtocol.tile);
    protocolRegistered = true;
  }
}

export function IBBMapEmbed({ offlinePackageReady = false }: IBBMapEmbedProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineFile, setOfflineFile] = useState<File | null>(null);
  const [offlineError, setOfflineError] = useState("");
  const [isLoadingOffline, setIsLoadingOffline] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);

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
    if (isOnline || !offlinePackageReady) return;
    let active = true;
    setOfflineError("");
    setIsLoadingOffline(true);
    getOfflinePmtilesFile(OFFLINE_PACKAGE_ID)
      .then(file => { if (active) setOfflineFile(file); })
      .catch(error => { if (active) setOfflineError(error instanceof Error ? error.message : "Offline harita paketi açılamadı"); })
      .finally(() => { if (active) setIsLoadingOffline(false); });
    return () => { active = false; };
  }, [isOnline, offlinePackageReady]);

  useEffect(() => {
    if (isOnline || !offlineFile || !mapContainer.current) return;
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
    return () => map.remove();
  }, [isOnline, offlineFile]);

  const offlineState = resolveOfflineMapViewState(isOnline, Boolean(offlineFile), isLoadingOffline, offlineError);
  const showOfflineMap = offlineState === "ready";

  return (
    <Card className="overflow-hidden rounded-3xl border-0 bg-white shadow-sm">
      <CardHeader className="gap-3 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl"><MapPinned className="text-[#e54725]" size={21} />İstanbul Şehir Haritası</CardTitle>
          <p className="mt-1 text-sm text-slate-500">İBB Şehir Haritası ile adres çevresini kontrol edin.</p>
        </div>
        <Badge className={isOnline ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}>{isOnline ? <><Wifi className="mr-1" size={14} />İBB haritası canlı</> : <><WifiOff className="mr-1" size={14} />Çevrim dışı mod</>}</Badge>
      </CardHeader>
      <CardContent className="p-0">
        {isOnline ? <div className="relative h-[360px] bg-slate-100 sm:h-[440px]"><iframe title="İstanbul Büyükşehir Belediyesi Şehir Haritası" src={IBB_MAP_URL} className="h-full w-full border-0" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></div> : showOfflineMap ? <div ref={mapContainer} className="h-[360px] w-full bg-slate-100 sm:h-[440px]" aria-label="İstanbul offline PMTiles haritası" /> : <div className="flex min-h-[260px] flex-col items-center justify-center bg-slate-50 px-6 text-center"><WifiOff className="mb-3 text-slate-400" size={30} /><p className="font-bold text-slate-800">{offlineState === "loading" ? "Offline harita hazırlanıyor" : offlineState === "error" ? "Offline harita açılamadı" : "İBB canlı haritası bağlantı bekliyor"}</p><p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">{offlineState === "loading" ? "Cihazdaki İstanbul PMTiles paketi okunuyor." : offlineState === "error" ? offlineError : "İndirilen İstanbul PMTiles paketi bulunamadı. Offline haritayı kullanmak için önce İstanbul paketini indirmeniz gerekir."}</p></div>}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500"><span>İstanbul Büyükşehir Belediyesi ©</span><a className="font-semibold text-[#c9381b] underline" href={IBB_API_URL} target="_blank" rel="noreferrer">İBB API bilgileri</a></div>
      </CardContent>
    </Card>
  );
}
