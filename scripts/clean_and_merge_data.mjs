import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const JEJU_DATA_DIR = path.resolve(ROOT_DIR, '..', '제주도 데이터');
const APP_DATA_DIR = path.join(ROOT_DIR, 'Data');

const SPORTS_LEISURE_REGEX = /체육|레포츠|스포츠|골프|경기장|체육관|테니스|수영장|게이트볼|축구/i;
const CONCEPT_TYPE_REGEX = /개념 용어|개념용어|법령과 제도|상훈|관직/;
const ABSTRACT_TITLE_REGEX = /^(기후|동굴|바다|섬|체육|레포츠|서귀포시 체육회|서귀포시 생활체육협의회)$/;

// Modern non-location orgs, companies, broadcasting, dictionaries
const NON_LOCATION_TITLE_REGEX = /^(제주문화방송|JIBS 제주국제자유도시방송|한국케이블TV 제주방송|극단 이어도|놀이패 한라산|담담회|동굴소리연구회|민요패 소리왓|북제주문화원|설문대영상|송동효사진공방|예올문화원|제주국악관현악단|제주문화예술재단|『제주도 속담사전』|『수은시집』)$/;

const STORY_KEYWORDS_REGEX = /설화|신화|전설|민요|무가|본풀이|이야기|구전|유래|가창|노래|스토리|전해진|전해온|전해 내려|할망|장군|도깨비/;

function cleanUserFacingText(text) {
  if (!text) return '';
  return text
    .replace(/\[채록\/수집 상황\][\s\S]*?(?=\[|$)/g, '') // Strip dry recording metadata section
    .replace(/집필자\s*:.*?(?=\n|$)/g, '') // Strip writer name metadata
    .replace(/원고 작성자\s*:.*?(?=\n|$)/g, '')
    .replace(/한국향토문화전자대전\s*\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getJsonFiles(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const f of list) {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getJsonFiles(fullPath));
    } else if (f.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

function processDirectory(dataDir, label) {
  console.log(`\n========================================`);
  console.log(`[Data Cleansing & Merging] Processing: ${label} (${dataDir})`);
  console.log(`========================================`);

  const jsonFiles = getJsonFiles(dataDir);
  const fileItemsMap = new Map();
  const allItemsMap = new Map();

  for (const fpath of jsonFiles) {
    try {
      const raw = fs.readFileSync(fpath, 'utf8');
      const parsed = JSON.parse(raw);
      const isArray = Array.isArray(parsed);
      const items = isArray ? parsed : (parsed.items || []);
      
      fileItemsMap.set(fpath, { isArray, items, originalData: parsed });

      for (const item of items) {
        if (!item.id) continue;
        if (!allItemsMap.has(item.id)) {
          allItemsMap.set(item.id, { ...item, _sources: [fpath] });
        } else {
          allItemsMap.get(item.id)._sources.push(fpath);
        }
      }
    } catch (e) {
      console.error(`Error reading ${fpath}:`, e.message);
    }
  }

  console.log(`Total unique items loaded: ${allItemsMap.size}`);

  const retainedItems = new Map();
  const itemsToDelete = new Map();

  for (const [id, item] of allItemsMap.entries()) {
    const meta = item.metadata || item.meta || {};
    const type = meta['유형'] || '';
    const cat = meta['분야'] || item.file_cat || '';
    const title = (item.title || '').trim();
    const summary = cleanUserFacingText(item.summary || '');
    const secText = (item.sections || []).map(s => (s.title || s.heading || '') + ' ' + (s.content || '')).join(' ');
    const fullText = title + ' ' + summary + ' ' + secText;
    const keywords = (meta.keywords || []).join(' ');

    const isSportsLeisure = (SPORTS_LEISURE_REGEX.test(title) || SPORTS_LEISURE_REGEX.test(cat) || SPORTS_LEISURE_REGEX.test(type)) && !STORY_KEYWORDS_REGEX.test(fullText);
    const isConcept = CONCEPT_TYPE_REGEX.test(type) || ABSTRACT_TITLE_REGEX.test(title);
    const isNonLocationOrg = NON_LOCATION_TITLE_REGEX.test(title);
    
    const hasStory = STORY_KEYWORDS_REGEX.test(fullText) || /설화|민요|무가/.test(type) || STORY_KEYWORDS_REGEX.test(keywords);

    if (hasStory && !isSportsLeisure && !isConcept && !isNonLocationOrg) {
      // Clean user facing text in sections
      const cleanedSections = (item.sections || []).map(s => ({
        ...s,
        content: cleanUserFacingText(s.content || '')
      })).filter(s => s.content.length > 0);

      retainedItems.set(id, {
        ...item,
        summary: summary,
        sections: cleanedSections
      });
    } else {
      itemsToDelete.set(id, { ...item, summary: summary });
    }
  }

  console.log(`Retained items (Location & Story): ${retainedItems.size}`);
  console.log(`Deleted items (No Story / Non-locational / Orgs): ${itemsToDelete.size}`);

  const retainedTitleMap = new Map();
  for (const [id, item] of retainedItems.entries()) {
    const title = (item.title || '').replace(/[「」]/g, '').trim();
    if (title && title.length >= 3) {
      retainedTitleMap.set(title, id);
    }
  }

  let mergeCount = 0;
  for (const [id, item] of itemsToDelete.entries()) {
    const summary = item.summary || '';
    const sections = item.sections || [];
    const fullContent = summary + ' ' + sections.map(s => s.content || '').join(' ');

    for (const [locTitle, targetId] of retainedTitleMap.entries()) {
      if (fullContent.includes(locTitle)) {
        const targetItem = retainedItems.get(targetId);
        if (targetItem && summary.length > 20) {
          const targetSummary = targetItem.summary || '';
          if (!targetSummary.includes(item.title)) {
            targetItem.sections.push({
              title: `[연관 아카이브 기록: ${item.title}]`,
              content: cleanUserFacingText(summary)
            });
            mergeCount++;
            break;
          }
        }
      }
    }
  }

  console.log(`Merged ${mergeCount} deleted items' relevant content into retained location POIs.`);

  let totalSavedItems = 0;
  for (const [fpath, { isArray, items, originalData }] of fileItemsMap.entries()) {
    const newItems = [];
    for (const oldItem of items) {
      if (!oldItem.id) continue;
      if (retainedItems.has(oldItem.id)) {
        newItems.push(retainedItems.get(oldItem.id));
      }
    }

    totalSavedItems += newItems.length;

    let outputContent = '';
    if (isArray) {
      outputContent = JSON.stringify(newItems, null, 2);
    } else {
      originalData.items = newItems;
      outputContent = JSON.stringify(originalData, null, 2);
    }

    fs.writeFileSync(fpath, outputContent, 'utf8');
  }

  console.log(`Successfully updated ${jsonFiles.length} files in ${label}. Total saved entries: ${totalSavedItems}`);
}

function main() {
  processDirectory(JEJU_DATA_DIR, 'Root 제주도 데이터');
  processDirectory(APP_DATA_DIR, 'Docent-in-hand/Data');
  console.log('\nData cleansing & merging completed successfully!');
}

main();
