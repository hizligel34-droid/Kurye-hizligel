/** İstanbul teslimat bölgeleri — data/fiyat_listesi.csv (55 satır).
 *  Yalnızca yönetici referansı; sipariş ücreti sürüş km’sinden hesaplanır. */

export type DistrictPrice = {
  bolge: string;
  fiyatTl: number;
  lat: number;
  lng: number;
};

/** Yaklaşık koordinatlar (OSM haritası için; ücret CSV’den gelir). */
export const DISTRICT_PRICES: DistrictPrice[] = [
  { bolge: "Arnavutköy", fiyatTl: 1000, lat: 41.185, lng: 28.74 },
  { bolge: "Ataşehir", fiyatTl: 600, lat: 40.983, lng: 29.127 },
  { bolge: "Avcılar", fiyatTl: 850, lat: 40.979, lng: 28.721 },
  { bolge: "Ayazağa", fiyatTl: 450, lat: 41.118, lng: 28.999 },
  { bolge: "Bağdat vadi acil", fiyatTl: 600, lat: 40.963, lng: 29.075 },
  { bolge: "Bağcılar", fiyatTl: 650, lat: 41.039, lng: 28.856 },
  { bolge: "Bahçeköy", fiyatTl: 750, lat: 41.176, lng: 28.993 },
  { bolge: "Bahçelievler", fiyatTl: 650, lat: 41.002, lng: 28.86 },
  { bolge: "Bakırköy", fiyatTl: 650, lat: 40.981, lng: 28.877 },
  { bolge: "Başakşehir", fiyatTl: 850, lat: 41.093, lng: 28.802 },
  { bolge: "Bayrampaşa", fiyatTl: 650, lat: 41.048, lng: 28.9 },
  { bolge: "Beşiktaş", fiyatTl: 350, lat: 41.043, lng: 29.008 },
  { bolge: "Beykoz köyler", fiyatTl: 1000, lat: 41.125, lng: 29.108 },
  { bolge: "Beylikdüzü", fiyatTl: 900, lat: 41.001, lng: 28.642 },
  { bolge: "Beyoğlu", fiyatTl: 350, lat: 41.038, lng: 28.985 },
  { bolge: "Büyükçekmece", fiyatTl: 1000, lat: 41.021, lng: 28.585 },
  { bolge: "Çatalca", fiyatTl: 1300, lat: 41.143, lng: 28.461 },
  { bolge: "Çekmeköy", fiyatTl: 700, lat: 41.037, lng: 29.2 },
  { bolge: "Esenler", fiyatTl: 650, lat: 41.043, lng: 28.876 },
  { bolge: "Esenyurt", fiyatTl: 900, lat: 41.033, lng: 28.675 },
  { bolge: "Eyüp", fiyatTl: 500, lat: 41.056, lng: 28.922 },
  { bolge: "Fatih", fiyatTl: 450, lat: 41.018, lng: 28.95 },
  { bolge: "Ferhatpaşa", fiyatTl: 850, lat: 40.996, lng: 28.802 },
  { bolge: "Florya", fiyatTl: 750, lat: 40.973, lng: 28.788 },
  { bolge: "Gaziosmanpaşa", fiyatTl: 650, lat: 41.076, lng: 28.911 },
  { bolge: "Göktürk", fiyatTl: 900, lat: 41.183, lng: 28.887 },
  { bolge: "Güngören", fiyatTl: 650, lat: 41.021, lng: 28.873 },
  { bolge: "Kadıköy", fiyatTl: 450, lat: 40.983, lng: 29.037 },
  { bolge: "Kağıthane", fiyatTl: 450, lat: 41.08, lng: 28.973 },
  { bolge: "Kartal", fiyatTl: 700, lat: 40.911, lng: 29.194 },
  { bolge: "Kavacık", fiyatTl: 650, lat: 41.091, lng: 29.092 },
  { bolge: "Kemerburgaz", fiyatTl: 900, lat: 41.163, lng: 28.923 },
  { bolge: "Kurtköy", fiyatTl: 1100, lat: 40.901, lng: 29.298 },
  { bolge: "Kuyumcukent", fiyatTl: 700, lat: 41.004, lng: 28.821 },
  { bolge: "Küçükçekmece", fiyatTl: 700, lat: 41.003, lng: 28.78 },
  { bolge: "Maltepe", fiyatTl: 650, lat: 40.935, lng: 29.151 },
  { bolge: "OFİSLER", fiyatTl: 450, lat: 41.082, lng: 29.011 },
  { bolge: "Pendik", fiyatTl: 900, lat: 40.877, lng: 29.233 },
  { bolge: "Samandıra", fiyatTl: 850, lat: 40.992, lng: 29.226 },
  { bolge: "Sancaktepe", fiyatTl: 850, lat: 41.002, lng: 29.237 },
  { bolge: "Sarıyer merkez", fiyatTl: 650, lat: 41.166, lng: 29.057 },
  { bolge: "Silivri", fiyatTl: 2000, lat: 41.073, lng: 28.246 },
  { bolge: "Sultanbeyli", fiyatTl: 850, lat: 40.968, lng: 29.267 },
  { bolge: "Sultangazi", fiyatTl: 750, lat: 41.107, lng: 28.868 },
  { bolge: "Şenlikköy", fiyatTl: 750, lat: 40.978, lng: 28.794 },
  { bolge: "Şile", fiyatTl: 2000, lat: 41.175, lng: 29.613 },
  { bolge: "Şişli", fiyatTl: 350, lat: 41.06, lng: 28.987 },
  { bolge: "Tarabya", fiyatTl: 450, lat: 41.138, lng: 29.047 },
  { bolge: "Tuzla", fiyatTl: 950, lat: 40.816, lng: 29.305 },
  { bolge: "Uskumruköy", fiyatTl: 850, lat: 41.228, lng: 29.029 },
  { bolge: "Ümraniye", fiyatTl: 650, lat: 41.016, lng: 29.124 },
  { bolge: "Üsküdar", fiyatTl: 450, lat: 41.023, lng: 29.016 },
  { bolge: "Yeşilköy", fiyatTl: 750, lat: 40.96, lng: 28.823 },
  { bolge: "Zekeriya köy", fiyatTl: 850, lat: 41.211, lng: 29.028 },
  { bolge: "Zeytinburnu", fiyatTl: 650, lat: 41.003, lng: 28.91 },
];

export const DISTRICT_NAMES = DISTRICT_PRICES.map(d => d.bolge);

export function findDistrictPrice(bolge: string, list: DistrictPrice[] = DISTRICT_PRICES) {
  const key = bolge.trim().toLocaleLowerCase("tr-TR");
  return list.find(d => d.bolge.toLocaleLowerCase("tr-TR") === key) ?? null;
}
