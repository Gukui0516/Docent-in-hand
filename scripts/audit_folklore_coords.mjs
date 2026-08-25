import fs from 'fs';
import { jejuGeoResolver } from './jeju_geo_resolver.mjs';

jejuGeoResolver.init();

const jejuLang = JSON.parse(fs.readFileSync('./Data/Jeju/제주시_언어와문학.json', 'utf8'));
const seogwipoLang = JSON.parse(fs.readFileSync('./Data/Seogwipo/서귀포_구비전승_언어_문학.json', 'utf8'));
const allLang = [...(jejuLang.items || jejuLang), ...(seogwipoLang.items || seogwipoLang)];

const tales = allLang.filter(it => {
  const title = it.title || '';
  const mtype = (it.metadata && (it.metadata['유형'] || it.metadata.type)) || '';
  const field = (it.metadata && (it.metadata['분야'] || it.metadata.field)) || '';
  const isSong = mtype.includes('민요') || mtype.includes('무가') || title.includes('노래') || title.includes('소리') || title.includes('타령') || title.includes('농요') || title.includes('군악') || title.includes('가사');
  const isLang = mtype.includes('개념') || mtype.includes('어휘') || title === '속담' || title === '금기어' || title === '수수께끼' || title === '제주방언' || title === '이두' || title === '접미사' || title === '친족 용어';
  if (isSong || isLang) return false;
  return title.startsWith('「') || mtype.includes('작품/설화') || mtype.includes('작품/신화') || mtype.includes('설화') || mtype.includes('전설');
});

console.log('--- Folklore Coordinate Resolution Audit ---');
for (const it of tales) {
  const coords = jejuGeoResolver.resolveCoordinates(it);
  const reg = (it.metadata && it.metadata['지역']) || it.file_region || '';
  const rel = (it.metadata && it.metadata['관련지명']) || '';
  console.log(`${it.title.padEnd(25)} -> [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}] | reg: ${reg} | rel: ${rel}`);
}
