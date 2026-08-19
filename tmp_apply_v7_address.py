from pathlib import Path

path = Path('/home/ubuntu/run-kurye/client/src/pages/Home.tsx')
text = path.read_text()
start = text.index('type AddressValue = ')
end = text.index('export default function Home()', start)
block = r'''type AddressValue = { provinceId: string; districtId: string; neighborhoodId: string; province: string; district: string; neighborhood: string; street: string; buildingNo: string; detail: string };
export function AddressPicker({ label, onChange }: { label: string; onChange: (address: string, value: AddressValue) => void }) {
  const [districts, setDistricts] = useState<AddressOption[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<AddressOption[]>([]);
  const [streetSuggestions, setStreetSuggestions] = useState<AddressOption[]>([]);
  const [value, setValue] = useState<AddressValue>({ provinceId: String(ISTANBUL_PROVINCE_ID), districtId: "", neighborhoodId: "", province: "İstanbul", district: "", neighborhood: "", street: "", buildingNo: "", detail: "" });
  const [loading, setLoading] = useState<"districts" | "neighborhoods" | "streets" | "">("");
  const [error, setError] = useState("");
  const [streetError, setStreetError] = useState("");
  const streetSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let active = true;
    setLoading("districts");
    getDistricts(ISTANBUL_PROVINCE_ID).then(items => { if (active) { setDistricts(items); onChange(composeStructuredAddress(value), value); } })
      .catch(() => { if (active) setError("İstanbul ilçe listesi alınamadı. Tekrar deneyin."); })
      .finally(() => { if (active) setLoading(""); });
    return () => { active = false; if (streetSearchTimer.current) clearTimeout(streetSearchTimer.current); };
  }, []);
  const update = (next: Partial<AddressValue>) => {
    const merged = { ...value, ...next };
    setValue(merged);
    const routeValue = { ...merged, detail: [merged.buildingNo ? `No: ${merged.buildingNo}` : "", merged.detail].filter(Boolean).join(", ") };
    onChange(composeStructuredAddress(routeValue), merged);
  };
  const searchStreets = (query: string) => {
    if (streetSearchTimer.current) clearTimeout(streetSearchTimer.current);
    if (!value.district || !value.neighborhood || query.trim().length < 2) { setStreetSuggestions([]); setStreetError(""); return; }
    streetSearchTimer.current = setTimeout(async () => {
      setLoading("streets");
      setStreetError("");
      try {
        const suggestions = await getStreetSuggestions({ district: value.district, neighborhood: value.neighborhood, query });
        setStreetSuggestions(suggestions);
        if (!suggestions.length) setStreetError("Bu aramada cadde/sokak bulunamadı. Adı elle yazabilirsiniz.");
      } catch { setStreetSuggestions([]); setStreetError("Cadde/sokak servisine ulaşılamadı. Adı elle yazabilirsiniz."); }
      finally { setLoading(""); }
    }, 250);
  };
  return <div className="space-y-3">
    <p className="text-sm font-bold">{label}</p>
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-xs font-semibold text-slate-600">İl<select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold" value={String(ISTANBUL_PROVINCE_ID)} disabled aria-label="İl"><option value={String(ISTANBUL_PROVINCE_ID)}>İstanbul</option></select></label>
      <label className="text-xs font-semibold text-slate-600">İlçe<select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={value.districtId} disabled={!value.provinceId || loading === "districts"} onChange={async e => {
        const district = districts.find(item => item.id === Number(e.target.value));
        setError(""); setStreetError(""); setStreetSuggestions([]); setNeighborhoods([]);
        update({ districtId: e.target.value, district: district?.name ?? "", neighborhoodId: "", neighborhood: "", street: "", buildingNo: "" });
        if (!district) return;
        setLoading("neighborhoods");
        try { setNeighborhoods(await getNeighborhoods(district.id)); } catch { setError("Mahalle listesi alınamadı. Tekrar deneyin."); } finally { setLoading(""); }
      }}><option value="">{loading === "districts" ? "İlçeler yükleniyor…" : "İlçe seçin"}</option>{districts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-600">Mahalle<select className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={value.neighborhoodId} disabled={!value.districtId || loading === "neighborhoods"} onChange={e => { setStreetSuggestions([]); setStreetError(""); update({ neighborhoodId: e.target.value, neighborhood: neighborhoods.find(item => item.id === Number(e.target.value))?.name ?? "", street: "", buildingNo: "" }); }}><option value="">{loading === "neighborhoods" ? "Mahalleler yükleniyor…" : "Mahalle seçin"}</option>{neighborhoods.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    </div>
    <div className="grid gap-3 sm:grid-cols-[1.2fr_.8fr]">
      <label className="relative text-xs font-semibold text-slate-600">Cadde / Sokak<Input className="mt-1" placeholder={value.neighborhoodId ? "Cadde veya sokak adını yazın" : "Önce mahalle seçin"} value={value.street} disabled={!value.neighborhoodId} autoComplete="off" onChange={e => { update({ street: e.target.value }); searchStreets(e.target.value); }}/>{loading === "streets" && <p className="mt-1 text-xs font-normal text-slate-500">Cadde/sokak aranıyor…</p>}{streetSuggestions.length > 0 && <div className="absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">{streetSuggestions.map(item => <button type="button" key={`${item.id}-${item.name}`} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-orange-50" onClick={() => { update({ street: item.name }); setStreetSuggestions([]); setStreetError(""); }}>{item.name}</button>)}</div>}{streetError && <p className="mt-1 text-xs font-semibold text-amber-700">{streetError}</p>}</label>
      <label className="text-xs font-semibold text-slate-600">Bina / Kapı No<Input className="mt-1" placeholder="Örn. 24/A" maxLength={ORDER_BUILDING_NO_MAX} value={value.buildingNo} disabled={!value.street.trim()} onChange={e => update({ buildingNo: e.target.value })}/></label>
    </div>
    <label className="block text-xs font-semibold text-slate-600">Adres detayı <span className="font-normal text-slate-400">(opsiyonel)</span><Input className="mt-1" placeholder="Kat, daire, iş yeri adı veya tarif" maxLength={ORDER_ADDRESS_DETAIL_MAX} value={value.detail} onChange={e => update({ detail: e.target.value })}/></label>
    <p className="text-xs text-slate-500">Adres sırası: İstanbul → İlçe → Mahalle → Cadde/Sokak → Bina No. Cadde/sokak önerisi bulunamazsa adı elle girebilirsiniz.</p>
    {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    {!loading && !error && districts.length === 0 && <p className="text-xs text-slate-500">İstanbul ilçe listesi boş görünüyor.</p>}
  </div>;
}

'''
text = text[:start] + block + text[end:]
text = text.replace('pickupStreet: "", pickupAddressDetail:', 'pickupStreet: "", pickupBuildingNo: "", pickupAddressDetail:')
text = text.replace('deliveryStreet: "", deliveryAddressDetail:', 'deliveryStreet: "", deliveryBuildingNo: "", deliveryAddressDetail:')
text = text.replace('pickupStreet: value.street, pickupAddressDetail:', 'pickupStreet: value.street, pickupBuildingNo: value.buildingNo, pickupAddressDetail:')
text = text.replace('deliveryStreet: value.street, deliveryAddressDetail:', 'deliveryStreet: value.street, deliveryBuildingNo: value.buildingNo, deliveryAddressDetail:')
path.write_text(text)
PY
python3 /home/ubuntu/run-kurye/tmp_apply_v7_address.py
rm /home/ubuntu/run-kurye/tmp_apply_v7_address.py
