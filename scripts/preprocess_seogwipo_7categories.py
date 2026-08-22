#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Preprocess Seogwipo-si JSON datasets into 7 core thematic categories:
1. 관광지 (Attractions / Destinations)
2. 축제 (Festivals / Events)
3. 설화 (Folklore / Myths / Legends)
4. 인물 (Historical Figures / People)
5. 문화유산 (Heritage / Historic Sites)
6. 음식 (Food / Cuisine)
7. 교육 (Education / Institutions)
"""

import os
import glob
import json
import unicodedata
from collections import defaultdict
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKUP_DIR = os.path.join(BASE_DIR, 'data', 'backup', 'Seogwipo-si')
OUTPUT_DIR = os.path.join(BASE_DIR, 'data', 'Seogwipo-si')

CATEGORY_META = {
    '관광지': {
        'id': 'SEOGWIPO_TOUR',
        'alias': 'tour_attraction',
        'desc': '서귀포시 명소, 자연 지리, 오름, 폭포, 해변, 휴양림 및 관광지 데이터'
    },
    '축제': {
        'id': 'SEOGWIPO_FESTIVAL',
        'alias': 'festival_event',
        'desc': '서귀포시 지역 축제, 문화제, 민속 행사, 전통 제전 및 세시풍속 놀이 데이터'
    },
    '설화': {
        'id': 'SEOGWIPO_MYTH',
        'alias': 'folklore_myth',
        'desc': '서귀포시 창세 신화, 본풀이, 당설화, 오름/바위 전설, 민담 및 구비전승 데이터'
    },
    '인물': {
        'id': 'SEOGWIPO_PERSON',
        'alias': 'person_figure',
        'desc': '서귀포시 독립운동가, 항일의병, 역사 인물, 학자, 제주 성씨 및 세거지 인물 데이터'
    },
    '문화유산': {
        'id': 'SEOGWIPO_HERITAGE',
        'alias': 'cultural_heritage',
        'desc': '서귀포시 유적/터, 사적, 봉수, 성곽/진성, 사찰/불탑, 민간신앙당, 국가/도지정 문화유산 데이터'
    },
    '음식': {
        'id': 'SEOGWIPO_FOOD',
        'alias': 'food_cuisine',
        'desc': '서귀포시 향토 음식, 전통 식생활, 특산물, 제철 요리 및 조리법 데이터'
    },
    '교육': {
        'id': 'SEOGWIPO_EDUCATION',
        'alias': 'education_school',
        'desc': '서귀포시 향교, 서원, 서당, 초중고교, 근현대 교육기관, 학술 단체 및 교육사 데이터'
    }
}


def classify_item(item):
    meta = item.get('meta', {})
    title = item.get('title', '')
    field = meta.get('field', '')
    mtype = meta.get('type', '')
    keywords = ' '.join(meta.get('keywords', []))
    sections = item.get('sections', [])
    sec_titles = ' '.join([s.get('title', '') for s in sections])
    
    # 1. 설화 (Folklore / Myth / Legend)
    if (
        '설화' in mtype or '신화' in mtype or '전설' in mtype or 
        '구비 전승' in field or 
        any(k in title for k in ['설화', '전설', '신화', '본풀이', '민담']) or
        any(k in keywords for k in ['설화', '신화', '전설', '할망', '본풀이'])
    ):
        return '설화'
        
    # 2. 음식 (Food / Cuisine)
    if (
        '음식' in mtype or '음식' in field or 
        any(k in title for k in ['음식', '물회', '죽', '떡', '젓갈', '조림', '구이', '엿', '술', '차', '특산', '밥', '국', '찌개', '탕']) or
        '음식' in keywords
    ):
        return '음식'
        
    # 3. 축제 (Festival / Event)
    if (
        '행사' in mtype or '행사' in field or
        any(k in title for k in ['축제', '문화제', '놀이', '제전', '한마당', '대회', '굿']) or
        any(k in keywords for k in ['축제', '문화제', '놀이', '제전', '세시풍속'])
    ):
        return '축제'
        
    # 4. 인물 (Person / Figure)
    if (
        mtype.startswith('인물/') or field.startswith('성씨·인물') or 
        mtype.startswith('성씨/') or '의병' in mtype or '독립운동' in mtype or
        '열녀' in mtype or '효자' in mtype
    ):
        return '인물'
        
    # 5. 교육 (Education / School)
    if (
        '학교' in mtype or '교육' in field or '교육' in mtype or
        any(k in title for k in ['학교', '서원', '향교', '서당', '학원', '초등', '중학', '고등', '대학']) or
        '교육' in keywords
    ):
        return '교육'
        
    # 6. 문화유산 (Heritage / Relics / Historic Sites)
    if (
        mtype.startswith('유적/') or '문화유산' in field or '문화유산' in mtype or
        any(k in title for k in ['사찰', '불탑', '비석', '고분', '성곽', '진성', '봉수', '당', '신당', '지석묘', '석상', '연대', '환해장성', '유적', '사적']) or
        '문화재' in keywords or '유적' in keywords or '사찰' in keywords
    ):
        return '문화유산'
        
    # 7. 관광지 (Attractions / Nature / Geo)
    if (
        mtype.startswith('지명/') or '지리' in field or '자연' in field or
        any(k in title for k in ['폭포', '오름', '해변', '해수욕장', '곶', '절벽', '동굴', '휴양림', '공원', '포구', '바위', '계곡', '산', '해안', '섬', '주상절리', '코지', '올레'])
    ):
        return '관광지'
        
    # Fallback rules
    if '역사' in field:
        return '문화유산'
    if '지리' in field or '자연' in field:
        return '관광지'
    if '생활' in field or '민속' in field:
        return '문화유산'
    if '종교' in field:
        return '문화유산'
        
    return '관광지'


def main():
    print(f'🚀 Starting Seogwipo-si 7-Category Preprocessing...')
    print(f'📂 Source Backup Directory: {BACKUP_DIR}')
    print(f'📁 Target Output Directory: {OUTPUT_DIR}\n')

    backup_files = sorted(glob.glob(os.path.join(BACKUP_DIR, '*.json')))
    if not backup_files:
        print(f'❌ No JSON files found in {BACKUP_DIR}!')
        return

    all_items = []
    seen_ids = set()

    for fpath in backup_files:
        norm_path = unicodedata.normalize('NFC', fpath)
        with open(fpath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            items = data.get('items', []) if isinstance(data, dict) else data
            for it in items:
                it_id = it.get('id', '')
                if it_id and it_id not in seen_ids:
                    seen_ids.add(it_id)
                    all_items.append(it)

    print(f'✨ Total unique items loaded from backup: {len(all_items)}')

    # Categorize items
    categorized_items = defaultdict(list)
    for it in all_items:
        cat = classify_item(it)
        it['category_7'] = cat
        categorized_items[cat].append(it)

    # Clean old non-7category json files in OUTPUT_DIR (only keep .DS_Store or create fresh)
    for old_f in glob.glob(os.path.join(OUTPUT_DIR, '*.json')):
        os.remove(old_f)

    # Save each category JSON file
    timestamp = datetime.now().isoformat()
    for cat_name, meta in CATEGORY_META.items():
        items = categorized_items.get(cat_name, [])
        out_filename = f"서귀포_{cat_name}.json"
        out_path = os.path.join(OUTPUT_DIR, out_filename)

        payload = {
            'category_id': meta['id'],
            'category_name': cat_name,
            'category_alias': meta['alias'],
            'description': meta['desc'],
            'region': '서귀포시',
            'total_count': len(items),
            'processed_at': timestamp,
            'items': items
        }

        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        file_size_kb = os.path.getsize(out_path) / 1024
        print(f'  💾 Saved [{out_filename}]: {len(items)} items ({file_size_kb:.1f} KB)')

    print(f'\n🎉 Successfully preprocessed all {len(all_items)} items into 7 categorized JSON files!')


if __name__ == '__main__':
    main()
