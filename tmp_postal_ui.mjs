import fs from 'node:fs';
const text = fs.readFileSync('/home/ubuntu/run-kurye/client/src/pages/Home.tsx', 'utf8');
for (const needle of ['AddressPicker key={`pickup-', 'AddressPicker key={`delivery-']) {
  const i = text.indexOf(needle);
  console.log(`--- ${needle} @ ${i} ---`);
  console.log(text.slice(Math.max(0, i - 700), i + 2200));
}
