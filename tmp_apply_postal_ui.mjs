import fs from 'node:fs';
const path = '/home/ubuntu/run-kurye/client/src/pages/Home.tsx';
let text = fs.readFileSync(path, 'utf8');
const replacements = [
  [
    'pickupBuildingNo: value.buildingNo, pickupApartmentNo: value.apartmentNo, pickupFloor: value.floor, pickupCourierNote: value.courierNote, pickupAddressDetail: value.detail }))}/><div className="flex flex-wrap items-center gap-2">',
    'pickupBuildingNo: value.buildingNo, pickupApartmentNo: value.apartmentNo, pickupFloor: value.floor, pickupCourierNote: value.courierNote, pickupAddressDetail: value.detail }))}/><Input className="mt-2" inputMode="numeric" maxLength={5} placeholder="Posta kodu (5 hane)" value={form.pickupPostalCode} onChange={e => setForm(prev => ({ ...prev, pickupPostalCode: e.target.value.replace(/\\D/g, "").slice(0, 5) }))}/><div className="flex flex-wrap items-center gap-2">'
  ],
  [
    'deliveryBuildingNo: value.buildingNo, deliveryApartmentNo: value.apartmentNo, deliveryFloor: value.floor, deliveryCourierNote: value.courierNote, deliveryAddressDetail: value.detail }))}/><div className="flex flex-wrap items-center gap-2">',
    'deliveryBuildingNo: value.buildingNo, deliveryApartmentNo: value.apartmentNo, deliveryFloor: value.floor, deliveryCourierNote: value.courierNote, deliveryAddressDetail: value.detail }))}/><Input className="mt-2" inputMode="numeric" maxLength={5} placeholder="Posta kodu (5 hane)" value={form.deliveryPostalCode} onChange={e => setForm(prev => ({ ...prev, deliveryPostalCode: e.target.value.replace(/\\D/g, "").slice(0, 5) }))}/><div className="flex flex-wrap items-center gap-2">'
  ]
];
for (const [from, to] of replacements) {
  if (!text.includes(from)) throw new Error(`Pattern not found: ${from.slice(0, 80)}`);
  text = text.replace(from, to);
}
fs.writeFileSync(path, text);
console.log('Updated postal code inputs:', replacements.length);
