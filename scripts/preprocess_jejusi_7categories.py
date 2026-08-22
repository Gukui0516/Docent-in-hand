#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Preprocess Jeju-si JSON datasets into 7 core thematic categories:
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
BACKUP_DIR = os.path.join(BASE_DIR, 'data', 'backup', 'Jeju-si')
OUTPUT_DIR = os.path.join(BASE_DIR, 'data', 'Jeju-si')

CATEGORY_META = {
    '관광지': {
        'id': 'JEJU_TOUR',
        'alias': 'tour_attraction',
        'desc': '제주시 명소, 자연 지리, 오름, 폭포, 해변, 휴양림 및 관광지 데이터'
    },
    '축제': {
        'id': 'JEJU_FESTIVAL',
        'alias': 'festival_event',
        'desc': '제주시 지역 축제, 문화제, 민속 행사, 전통 제전 및 세시풍속 놀이 데이터'
    },
    '설화': {
        'id': 'JEJU_MYTH',
        'alias': 'folklore_myth',
        'desc': '제주시 창세 신화, 본풀이, 당설화, 오름/바위 전설, 민담 및 구비전승 데이터'
    },
    '인물': {
        'id': 'JEJU_PERSON',
        'alias': 'person_figure',
        'desc': '제주시 독립운동가, 항일의병, 역사 인물, 학자, 제주 성씨 및 세거지 인물 데이터'
    },
    '문화유산': {
        'id': 'JEJU_HERITAGE',
        'alias': 'cultural_heritage',
        'desc': '제주시 유적/터, 사적, 봉수, 성곽/진성, 사찰/불탑, 민간신앙당, 국가/도지정 문화유산 데이터'
    },
    '음식': {
        'id': 'JEJU_FOOD',
        'alias': 'food_cuisine',
        'desc': '제주시 향토 음식, 전통 식생활, 특산물, 제철 요리 및 조리법 데이터'
    },
    '교육': {
        'id': 'JEJU_EDUCATION',
        'alias': 'education_school',
        'desc': '제주시 향교, 서원, 서당, 초중고교, 근현대 교육기관, 학술 단체 및 교육사 데이터'
    }
}


def classify_item(item):
    meta = item.get('metadata') or item.get('meta') or {}
    title = item.get('title', '')
    summary = item.get('summary', '')
    field = meta.get('분야') or meta.get('field') or ''
    mtype = meta.get('유형') or meta.get('type') or ''
    keywords_raw = meta.get('키워드') or meta.get('keywords') or []
    keywords = ' '.join(keywords_raw) if isinstance(keywords_raw, list) else str(keywords_raw)
    
    # Check subcategories / hierarchy
    subcats = item.get('subcategories', [])
    hierarchies = []
    node_names = []
    for sub in subcats:
        hierarchies.extend(sub.get('hierarchy', []))
        if sub.get('nodeName'):
            node_names.append(sub.get('nodeName'))
    h_text = ' '.join(hierarchies + node_names)
    
    # 1. 설화 (Folklore / Myth / Legend)
    if (
        '설화' in mtype or '신화' in mtype or '전설' in mtype or 
        '구비 전승' in field or '구비전승' in h_text or '설화' in h_text or '신화' in h_text or
        any(k in title for k in ['설화', '전설', '신화', '본풀이', '민담']) or
        any(k in keywords for k in ['설화', '신화', '전설', '할망', '본풀이'])
    ):
        return '설화'
        
    # 2. 음식 (Food / Cuisine)
    if (
        '음식' in mtype or '음식' in field or '음식' in h_text or '식생활' in h_text or
        any(k in title for k in ['음식', '물회', '죽', '떡', '젓갈', '조림', '구이', '엿', '술', '차', '특산', '밥', '국', '찌개', '탕', '옥돔', '몸국', '빙떡', '고기국수']) or
        '음식' in keywords
    ):
        return '음식'
        
    # 3. 축제 (Festival / Event)
    if (
        '행사' in mtype or '행사' in field or '축제' in h_text or '세시풍속' in h_text or
        any(k in title for k in ['축제', '문화제', '놀이', '제전', '한마당', '대회', '굿', '풍어제', '들불축제']) or
        any(k in keywords for k in ['축제', '문화제', '놀이', '제전', '세시풍속'])
    ):
        return '축제'
        
    # 4. 인물 (Person / Figure)
    if (
        mtype.startswith('인물/') or '성씨' in field or '인물' in field or 
        '성씨' in h_text or '인물' in h_text or '삶의 주체' in h_text or
        mtype.startswith('성씨/') or '의병' in mtype or '독립운동' in mtype or
        '열녀' in mtype or '효자' in mtype or '문무 관인' in mtype
    ):
        return '인물'
        
    # 5. 교육 (Education / School)
    if (
        '학교' in mtype or '교육' in field or '교육' in mtype or '교육' in h_text or
        any(k in title for k in ['학교', '서원', '향교', '서당', '학원', '초등', '중학', '고등', '대학']) or
        '교육' in keywords
    ):
        return '교육'
        
    # 6. 문화유산 (Heritage / Relics / Historic Sites)
    if (
        mtype.startswith('유적/') or '문화유산' in field or '문화유산' in mtype or '유형유산' in h_text or '유적' in h_text or
        any(k in title for k in ['사찰', '불탑', '비석', '고분', '성곽', '진성', '봉수', '당', '신당', '지석묘', '석상', '연대', '환해장성', '유적', '사적', '관덕정', '목관아', '삼성혈', '항몽', '삼별초']) or
        '문화재' in keywords or '유적' in keywords or '사찰' in keywords
    ):
        return '문화유산'
        
    # 7. 관광지 (Attractions / Nature / Geo)
    if (
        mtype.startswith('지명/') or '지리' in field or '자연' in field or '자연과 지리' in h_text or '자연지리' in h_text or
        any(k in title for k in ['폭포', '오름', '해변', '해수욕장', '곶', '절벽', '동굴', '휴양림', '공원', '포구', '바위', '계곡', '산', '해안', '섬', '용두암', '만장굴', '비자림', '협재', '함덕', '올레', '한라산'])
    ):
        return '관광지'
        
    # Fallback rules based on hierarchy / field
    if '성씨' in h_text or '인물' in h_text:
        return '인물'
    if '문화유산' in h_text or '역사' in field or '삶의 자취' in h_text:
        return '문화유산'
    if '자연과 지리' in h_text or '지리' in field or '자연' in field or '삶의 터전' in h_text:
        return '관광지'
    if '생활' in field or '민속' in field or '삶의 방식' in h_text:
        return '문화유산'
    if '종교' in field:
        return '문화유산'
        
    return '관광지'


def main():
    print(f'🚀 Starting Jeju-si 7-Category Preprocessing...')
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
        out_filename = f"제주시_{cat_name}.json"
        out_path = os.path.join(OUTPUT_DIR, out_filename)

        payload = {
            'category_id': meta['id'],
            'category_name': cat_name,
            'category_alias': meta['alias'],
            'description': meta['desc'],
            'region': '제주시',
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
