import fs from 'fs';

const content = fs.readFileSync('./src/data/poiData.ts', 'utf8');
const match = content.match(/export const POI_LIST: POI\[\] = ([\s\S]*);\s*$/);
const pois = JSON.parse(match[1]);

console.log('=== Total POIs in poiData.ts:', pois.length, '===');

const targets = ['용소와 기우제', '말머리', '용머리바위', '백록담 전설', '설문대할망', '산방산', '사라봉', '송당본향당', '와흘본향당', '수월봉', '성산일출봉'];
for (const t of targets) {
  const found = pois.find(p => p.name.includes(t));
  if (found) {
    console.log(`[FOUND] "${found.name}" -> Lat: ${found.latitude}, Lng: ${found.longitude}, Category: ${found.category}, Region: ${found.region}`);
  } else {
    console.log(`[NOT FOUND] "${t}"`);
  }
}

// Coordinate statistics
const coordSet = new Set();
const clusters = new Map();
let outOfBounds = 0;

for (const p of pois) {
  if (p.latitude < 33.1 || p.latitude > 34.0 || p.longitude < 126.1 || p.longitude > 127.0) {
    outOfBounds++;
  }
  const k = p.latitude.toFixed(4) + ',' + p.longitude.toFixed(4);
  coordSet.add(k);
  clusters.set(k, (clusters.get(k) || 0) + 1);
}

console.log('\n--- Geographic Quality Statistics ---');
console.log('Total POIs:', pois.length);
console.log('Unique coordinate points:', coordSet.size);
console.log('Out of bounds coordinates:', outOfBounds);

const sortedClusters = Array.from(clusters.entries()).sort((a,b) => b[1] - a[1]);
console.log('\nTop 10 coordinate clusters:');
for (let i = 0; i < Math.min(10, sortedClusters.length); i++) {
  console.log(`  ${sortedClusters[i][0]} -> ${sortedClusters[i][1]} POIs`);
}
