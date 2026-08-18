export type OfflinePackageStatus = "available" | "preparing";

export type OfflineRouteCapability = { status: "unavailable"; reason: "map-package-only" };
export function getOfflineRouteCapability(): OfflineRouteCapability { return { status: "unavailable", reason: "map-package-only" }; }

export type OfflineMapPackage = {
  id: string;
  city: string;
  status: OfflinePackageStatus;
  format: "pmtiles";
  downloadUrl?: string;
  sourceUrl: string;
  sizeLabel: string;
  attribution: string;
  checksum?: { algorithm: "md5"; value: string };
};

export const OFFLINE_MAP_PACKAGES: OfflineMapPackage[] = [
  {
    id: "istanbul-osm-shortbread",
    city: "İstanbul",
    status: "available",
    format: "pmtiles",
    downloadUrl: "https://download.bbbike.org/osm/bbbike/Istanbul/Istanbul.osm.pmtiles-shortbread.zip",
    sourceUrl: "https://download.bbbike.org/osm/bbbike/Istanbul/",
    sizeLabel: "Yaklaşık 22 MB",
    attribution: "© OpenStreetMap katkıcıları · BBBike extract",
    checksum: { algorithm: "md5", value: "0c1a4f23c48150e2b73cb09515c58f9a" },
  },
  {
    id: "ankara-osm-shortbread",
    city: "Ankara",
    status: "preparing",
    format: "pmtiles",
    sourceUrl: "https://extract.bbbike.org/",
    sizeLabel: "Özel şehir paketi hazırlanıyor",
    attribution: "© OpenStreetMap katkıcıları",
  },
];

const DB_NAME = "run-kurye-offline";
const STORE_NAME = "map-packages";
export const MAX_OFFLINE_PACKAGE_BYTES = 80 * 1024 * 1024;
export function isOfflinePackageSizeAllowed(sizeBytes: number) { return sizeBytes >= 0 && sizeBytes <= MAX_OFFLINE_PACKAGE_BYTES; }

function openPackageDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("Tarayıcı çevrim dışı depolamayı desteklemiyor"));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Offline depolama açılamadı"));
  });
}

export async function readOfflineDownloadResponse(response: Response, onProgress?: (value: number) => void) {
  if (!response.ok || !response.body) throw new Error("Offline paket indirilemedi");
  const total = Number(response.headers.get("content-length") ?? 0);
  if (!isOfflinePackageSizeAllowed(total)) throw new Error("Offline paket mobil kullanım için çok büyük");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) { chunks.push(value); received += value.byteLength; if (total) onProgress?.(Math.round((received / total) * 100)); }
  }
  const buffers = chunks.map(chunk => chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength) as unknown as ArrayBuffer);
  return new Blob(buffers, { type: "application/zip" });
}

export async function downloadOfflinePackage(pkg: OfflineMapPackage, onProgress?: (value: number) => void) {
  if (!pkg.downloadUrl) throw new Error(`${pkg.city} paketi henüz indirilebilir değil`);
  const response = await fetch(pkg.downloadUrl, { mode: "cors" });
  const data = await readOfflineDownloadResponse(response, onProgress);
  const db = await openPackageDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ packageId: pkg.id, city: pkg.city, data, savedAt: Date.now(), format: pkg.format }, pkg.id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Offline paket kaydedilemedi"));
  });
  db.close();
  onProgress?.(100);
}

export async function getOfflinePackageDownloadUrl(packageId: string) {
  const db = await openPackageDb();
  return await new Promise<string | null>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(packageId);
    request.onsuccess = () => { db.close(); const value = request.result as { data?: Blob } | undefined; resolve(value?.data ? URL.createObjectURL(value.data) : null); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function getOfflinePackageInfo(packageId: string) {
  const db = await openPackageDb();
  return await new Promise<{ city: string; sizeBytes: number; savedAt: number } | null>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(packageId);
    request.onsuccess = () => { db.close(); const value = request.result as { city?: string; data?: Blob; savedAt?: number } | undefined; resolve(value?.data ? { city: value.city ?? "", sizeBytes: value.data.size, savedAt: value.savedAt ?? 0 } : null); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function hasOfflinePackage(packageId: string) {
  const db = await openPackageDb();
  return await new Promise<boolean>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getKey(packageId);
    request.onsuccess = () => { db.close(); resolve(Boolean(request.result)); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}
