import { readFile, writeFile } from "node:fs/promises";

const raw = JSON.parse(await readFile("/tmp/turkey-neighbourhoods/src/data/neighbourhoods.json", "utf8"));
const rows = raw.filter(row => row[0] === "34");
const districtNames = [...new Set(rows.map(row => row[2]))].sort((a, b) => a.localeCompare(b, "tr"));
const districts = districtNames.map((name, index) => ({
  id: 340000 + index + 1,
  name,
  provinceId: 34,
  neighborhoods: rows.filter(row => row[2] === name).map((row, neighborhoodIndex) => ({ id: 34000000 + index * 10000 + neighborhoodIndex + 1, name: row[3], districtId: 340000 + index + 1 })),
}));
await writeFile("/home/ubuntu/run-kurye/server/istanbulAddressFallback.json", JSON.stringify({ source: "turkey-neighbourhoods", license: "MIT", provinceId: 34, districts }, null, 2));
console.log(JSON.stringify({ districts: districts.length, neighborhoods: rows.length }));
