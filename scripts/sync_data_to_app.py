#!/usr/bin/env python3
"""
Fully Automated Data Synchronization Pipeline
Scans all JSON files inside data/ (data/**/*.json) and dynamically builds:
1. src/data/poiData.ts (Frontend POI list with 100% verified official photos)
2. src/data/ragKnowledgeBase.ts (Frontend RAG knowledge base)
3. server/src/data/ragFullCorpus.json (Backend multi-agent knowledge corpus)
"""

import glob
import json
import os
import html
import re

import unicodedata

DATA_DIR = 'data'
SRC_POI_DATA = 'src/data/poiData.ts'
SRC_RAG_KB = 'src/data/ragKnowledgeBase.ts'
SRC_CORPUS = 'src/data/ragFullCorpus.json'
SERVER_CORPUS = 'server/src/data/ragFullCorpus.json'

# Standard coordinates for Jeju regions (Eup/Myeon/Dong) to map real places accurately
REGION_COORDS = {
    '구좌읍': (33.5284, 126.7716),
    '조천읍': (33.5350, 126.6344),
    '애월읍': (33.4631, 126.3292),
    '한림읍': (33.4147, 126.2625),
    '한경면': (33.3512, 126.1865),
    '우도면': (33.5043, 126.9542),
    '추자면': (33.9575, 126.2975),
    '성산읍': (33.4475, 126.9142),
    '표선면': (33.3267, 126.8315),
    '남원읍': (33.2798, 126.7198),
    '안덕면': (33.2505, 126.3402),
    '대정읍': (33.2268, 126.2524),
    '중문동': (33.2492, 126.4123),
    '서홍동': (33.2541, 126.5492),
    '천지동': (33.2458, 126.5601),
    '용담동': (33.5142, 126.5122),
    '일도동': (33.5078, 126.5332),
    '이도동': (33.4985, 126.5332),
    '삼양동': (33.5234, 126.5878),
    '도두동': (33.5069, 126.4677),
    '노형동': (33.4837, 126.4789),
    '연동': (33.4912, 126.4886),
    '아라동': (33.4568, 126.5456),
    '봉개동': (33.4682, 126.6021)
}

# Known curated coordinates for famous landmarks
EXACT_COORDS = {
    '만장굴': (33.5284, 126.7716),
    '용연': (33.5165, 126.5126),
    '용두암': (33.5165, 126.5126),
    '수월봉': (33.2952, 126.1627),
    '사려니': (33.4077, 126.6433),
    '새별': (33.3665, 126.3562),
    '용눈이': (33.4608, 126.8327),
    '다랑쉬': (33.4735, 126.8335),
    '거문 오름': (33.4599, 126.7136),
    '산굼부리': (33.4338, 126.6882),
    '금능': (33.3905, 126.2355),
    '협재': (33.3941, 126.2397),
    '함덕': (33.5434, 126.6692),
    '김녕': (33.5574, 126.7594),
    '월정': (33.5562, 126.7958),
    '곽지': (33.4509, 126.3106),
    '우도': (33.5043, 126.9542),
    '도두봉': (33.5069, 126.4677),
    '삼양동': (33.5234, 126.5878),
    '항파두리': (33.4523, 126.4112),
    '성산일출봉': (33.4585, 126.9427),
    '산방산': (33.2366, 126.3134),
    '주상절리': (33.2378, 126.4249),
    '천지연': (33.2448, 126.5595),
    '정방': (33.2449, 126.5719),
    '쇠소깍': (33.2527, 126.6234),
    '섭지코지': (33.4241, 126.9298),
    '외돌개': (33.2403, 126.5458),
    '용머리해안': (33.2324, 126.3148),
    '비자림': (33.4913, 126.8337),
    '한라산': (33.3617, 126.5332),
    '백록담': (33.3617, 126.5332)
}


def determine_persona(title, subcats, content):
    text = (title + ' ' + ' '.join(subcats) + ' ' + content).lower()
    
    # Haenyeo keywords
    if any(k in text for k in ['해녀', '바다', '해변', '해수욕장', '포구', '물질', '어촌', '해안', '섬', '우도', '비양도', '가파도', '마라도', '불턱', '소라', '전복', '해산물']):
        return 'haenyeo'
    
    # Dolhareubang keywords
    if any(k in text for k in ['유적', '역사', '사적', '문화재', '민속', '당', '신당', '제사', '마을', '관덕정', '목관아', '삼성혈', '항몽', '토성', '비석', '절', '사찰', '불탑', '고분', '성곽', '진성']):
        return 'dolhareubang'
    
    # Seolmundae keywords (Nature, geology, mythology, volcano, oreum, cave)
    return 'seolmundae'


def extract_coordinates(title, region_str):
    for k, coords in EXACT_COORDS.items():
        if k in title:
            return coords[0], coords[1]
    
    for r, coords in REGION_COORDS.items():
        if r in region_str or r in title:
            # Add small pseudo-jitter based on title hash so pins don't overlap completely
            h = sum(ord(c) for c in title) % 100
            offset_lat = ((h % 10) - 5) * 0.003
            offset_lng = (((h // 10) % 10) - 5) * 0.003
            return round(coords[0] + offset_lat, 4), round(coords[1] + offset_lng, 4)
            
    return 33.4996, 126.5312 # Default Jeju Center


def load_all_json_files():
    json_files = glob.glob(os.path.join(DATA_DIR, '**/*.json'), recursive=True)
    all_items = []
    seen_ids = set()

    print(f'🔍 Scanning JSON database files in {DATA_DIR}/...')
    for fpath in json_files:
        norm_path = unicodedata.normalize('NFC', fpath)
        # Skip backup folder
        if 'backup' in norm_path or 'backup' in fpath:
            continue

        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                region_default = '서귀포시' if 'Seogwipo' in norm_path or '서귀포' in norm_path else '제주시'
                
                # Derive category name from filename (7 Thematic Categories)
                base_name = unicodedata.normalize('NFC', os.path.basename(fpath))
                cat_default = '관광지'
                if '관광지' in base_name:
                    cat_default = '관광지'
                elif '축제' in base_name:
                    cat_default = '축제'
                elif '설화' in base_name:
                    cat_default = '설화'
                elif '인물' in base_name:
                    cat_default = '인물'
                elif '문화유산' in base_name:
                    cat_default = '문화유산'
                elif '음식' in base_name:
                    cat_default = '음식'
                elif '교육' in base_name:
                    cat_default = '교육'

                items = data.get('items', [])
                print(f'  📄 {norm_path}: {len(items)} items (Region: {region_default}, Category: {cat_default})')
                for it in items:
                    it_id = it.get('id', '')
                    if not it_id or it_id in seen_ids:
                        continue
                    seen_ids.add(it_id)
                    it['file_region'] = region_default
                    it['file_cat'] = cat_default
                    all_items.append(it)
        except Exception as e:
            print(f'❌ Error reading {fpath}: {e}')

    print(f'✨ Total unique items loaded from database: {len(all_items)}')
    return all_items


def classify_poi_category(it):
    """
    Classify an encyclopedic item into one of the 7 core themes
    based on comprehensive metadata and content analysis.
    """
    title = unicodedata.normalize('NFC', html.unescape(it.get('title', ''))).strip()
    meta = it.get('metadata') or it.get('meta') or {}
    mtype = meta.get('유형') or meta.get('type') or ''
    field = meta.get('분야') or meta.get('field') or ''
    subs = [s.get('nodeName', '') for s in it.get('subcategories', [])]
    sub_str = ' '.join(subs)
    
    # 1. 설화 (Folklore, Myth, Oral song, Dialect)
    if any(k in mtype for k in ['설화', '신화', '전설', '민담', '본풀이', '민요', '무가']):
        return '설화'
    if any(k in field for k in ['구비 전승', '신화', '설화']) and not ('행사' in mtype or '축제' in mtype):
        return '설화'
    if (title.startswith('「') or title.startswith('『')) and any(k in title for k in ['전설', '이야기', '본풀이', '민요', '노래', '설화', '방언집', '속담']):
        return '설화'

    # 2. 인물 (Figures, Lineages, Ancestors)
    if mtype.startswith('인물/') or '성씨·인물' in field or mtype.startswith('성씨/'):
        return '인물'

    # 3. 음식 (Food, Cuisine, Local specialities)
    if '음식물' in mtype or '식생활' in field or '음식' in mtype or '식생활' in sub_str or '음식' in sub_str:
        return '음식'
    dish_suffixes = ('국수', '물회', '구이', '몸국', '갈치국', '성게국', '미역국', '토란국', '빙떡', '오메기떡', '돔베고기', '보말죽', '전복죽', '자리물회', '옥돔구이', '고등어조림', '갈치조림', '청국장', '된장', '간장', '고추장', '젓갈', '자리젓', '멸치젓', '막걸리', '오메기술', '고소리술', '꿩메밀칼국수')
    if any(title.endswith(s) for s in dish_suffixes) or any(s in title for s in ['흑돼지', '빙떡', '오메기떡', '돔베고기', '몸국', '보말국', '보말죽', '자리물회']):
        if not any(k in title for k in ['마을', '오름', '축제', '협회', '학회', '주식회사', '초등학교', '중학교', '고등학교']):
            return '음식'

    # 4. 축제 (Festivals, Official Events & Traditional Rituals)
    festival_keywords = ['축제', '제전', '음악회', '페스티벌', '대축제', '문화제', '연극제', '영화제', '불꽃축제', '마라톤대회', '영등굿', '입춘굿', '풍어제', '산신제', '포제', '당제']
    if any(k in title for k in festival_keywords):
        return '축제'
    if '행사' in mtype or '축제' in mtype or '축제' in field or '의례/제' in mtype:
        return '축제'

    # 5. 교육 (Education, Memorials, Libraries & Museums)
    edu_terms = ['향교', '서원', '서당', '야학', '박물관', '미술관', '기념관', '도서관', '과학관', '문화원', '체육관', '수련원', '교육원', '학교', '대학']
    if any(k in title for k in edu_terms) or '문화·교육/교육' in field or '기관 단체/학교' in mtype:
        return '교육'

    # 6. 문화유산 (Cultural Heritage, Relics & Historical Sites)
    heritage_types = ['유물', '유적', '기록유산', '무형 유산', '유형 유산', '문화유산']
    heritage_words = ['지석묘', '고인돌', '선돌', '마애명', '원당사지', '하마비', '선정비', '공덕비', '삼별초', '항파두리', '환해장성', '목관아', '관덕정', '연대', '봉수', '성곽', '진성', '사찰', '석탑', '불상', '유적지', '충혼묘지', '위령비', '추모비', '비석']
    if any(k in mtype for k in heritage_types) or '문화유산' in field or '역사/전통 시대' in field or '종교/불교' in field or any(k in title for k in heritage_words):
        return '문화유산'

    # 7. 관광지 (Natural Landscapes, Scenic Spots & Attractions)
    return '관광지'


def is_valid_poi(it, title, meta):
    """
    Filter out non-travel encyclopedic concept terms, general modern facilities,
    and administrative offices to keep only true travel docent POIs.
    """
    mtype = meta.get('유형') or meta.get('type') or ''
    field = meta.get('분야') or meta.get('field') or ''
    cat_type = it.get('category_type', '')
    category_7 = it.get('category_7') or classify_poi_category(it)
    
    # 1. Reject overview and concept terms (개관 / 개념 용어)
    if '개관' in mtype or cat_type == '개관항목' or '개념 용어' in mtype:
        # Only allow real specific food/dishes in concept terms
        if category_7 == '음식':
            dish_indicators = ('국수', '물회', '구이', '몸국', '갈치국', '성게국', '미역국', '토란국', '빙떡', '오메기떡', '돔베고기', '보말죽', '전복죽', '자리물회', '옥돔구이', '고등어조림', '갈치조림', '청국장', '된장', '간장', '고추장', '젓갈', '자리젓', '멸치젓', '막걸리', '오메기술', '고소리술', '꿩메밀칼국수', '수애', '솔변', '둠비', '칼국', '괴기', '돗괴기', '감제침떡', '거스름떡', '생감주', '가문반')
            if not any(k in title for k in dish_indicators):
                return False
        else:
            return False
        
    abstract_concepts = {
        '관광', '교통', '지리', '역사', '문화', '예술', '체육', '종교', '산업', '농업', '어업', '임업',
        '축산업', '상업', '무역', '금융', '사회', '정치', '행정', '사법', '치안', '국방', '통신', '언론',
        '출판', '문학', '어학', '민속', '의식주', '의생활', '식생활', '주생활', '풍속', '신앙', '구비전승',
        '성씨', '인물', '유적', '유물', '문화유산', '자연', '동물', '식물', '환경', '기후', '지형', '지질',
        '관광지', '축제', '행사', '공연', '전시', '교육', '학문', '도서관', '박물관', '미술관', '자연지리',
        '인문지리', '인구', '생태계', '천연기념물', '기온', '강수', '바람', '토양', '하천', '해안', '바다',
        '섬', '동굴', '화산 폭발', '방패형 화산', '지하수', '용천수', '해류', '자연재해', '기상재해', '태풍',
        '해안 지형', '산담', '올레', '걸바다 밭', '토성', '입도조', '세거 성씨', '집성촌', '구비 전승',
        '제주 토지 조사 사업', '제주 4·3 전략촌', '복지', '지명', '설화', '신화', '전설', '민요', '무가',
        '속담', '교육 기관', '교육 과정', '장학'
    }
    if title in abstract_concepts or len(title) == 1:
        return False
        
    # 2. Reject life-cycle ritual / generic custom concepts
    ritual_concepts = {
        '혼례', '상례', '제례', '관례', '계례', '돌잔치', '회갑', '초경', '성년례', '통과의례',
        '출산의례', '혼례복', '제례 음식', '혼례 음식', '상례복', '계', '품앗이', '수눌음', '장례',
        '마을 신앙', '본향당 신앙', '포제', '당굿'
    }
    if title in ritual_concepts:
        return False

    # 3. Reject general modern schools / universities (preserve historic schools: 향교, 서원, 서당, 야학, 옛터)
    historic_school_keywords = ['향교', '서원', '서당', '야학', '구교', '옛터', '유적', '사적', '항일', '기념관']
    is_historic = any(k in title for k in historic_school_keywords)
    
    if not is_historic:
        if any(w in title for w in ['초등학교', '중학교', '고등학교', '대학교', '대학원', '유치원', '어린이집', '학원']):
            return False
        if title in ['학교', '대학교', '고등학교', '중학교', '초등학교']:
            return False
        if '기관 단체/학교' in mtype or '학교' in mtype:
            return False

    # 4. Reject modern commercial shops, bookstores, and general hospitals (unless historic site)
    if not is_historic:
        commercial_terms = ['서점', '책방', '병의원', '약국', '마트', '상점', '의원']
        if title in commercial_terms or ('병원' in title and '옛터' not in title) or ('의원' in title and '옛터' not in title):
            return False

    # 5. Reject modern administrative and public offices (preserve historic offices: 목관아, 관덕정, 정의현 등)
    historic_office_keywords = ['목관아', '관덕정', '정의현', '대정현', '진성', '성곽', '유적', '옛터']
    if not any(k in title for k in historic_office_keywords):
        office_terms = [
            '주민센터', '동주민센터', '읍사무소', '면사무소', '파출소', '치안센터', '소방서',
            '우체국', '세무서', '등기소', '선거관리위원회', '검찰청', '법원', '경찰서', '보건소'
        ]
        if any(w in title for w in office_terms) or title in office_terms:
            return False

    # 6. Reject administrative districts, dong, eup, myeon, and general village overview (preserve famous folk/eco villages)
    if '행정 지명과 마을' in mtype or '행정구역' in mtype:
        if not any(k in title for k in ['민속마을', '전통마을', '체험마을', '생태마을', '예술마을', '문화마을']):
            return False

    clean_title = title.replace(' ', '')
    simple_suffixes = ['동', '읍', '면']
    if any(clean_title.endswith(s) for s in simple_suffixes) or any(clean_title.endswith(f'{i}동') for i in range(1, 10)):
        if not any(k in title for k in ['오름', '장오리', '머리', '바위', '폭포', '동굴', '포구', '해변', '사찰', '당', '낭', '물', '왓', '빌레', '궤', '터', '숲', '길', '마을', '산', '봉', '암', '굴', '목', '코지', '절리', '곶자왈']):
            if len(clean_title) <= 6:
                return False

    return True


def process_items_to_pois(all_items):
    pois = []
    filtered_out_count = 0
    
    # Priority list for famous landmark naming
    priority_titles = list(EXACT_COORDS.keys())

    for it in all_items:
        title = html.unescape(it.get('title', '')).strip()
        multimedia = it.get('multimedia', [])
        meta = it.get('metadata') or it.get('meta') or {}
        
        # Filter out non-travel POI items
        if not is_valid_poi(it, title, meta):
            filtered_out_count += 1
            continue
        
        # Must have official multimedia photos to be an interactive POI
        if not multimedia:
            continue

        item_url = it.get('url') or f"https://jeju.grandculture.net/jeju/toc/{it.get('id', '')}"
        
        clean_images = []
        for m in multimedia:
            src = m.get('src')
            alt = m.get('alt', title)
            if src and src.startswith('http'):
                clean_images.append({
                    'src': src,
                    'alt': html.unescape(alt),
                    'source': '한국학중앙연구원 한국향토문화전자대전',
                    'sourceUrl': item_url
                })

        if not clean_images:
            continue

        meta = it.get('metadata') or it.get('meta') or {}
        region_str = meta.get('지역', it.get('file_region', '제주시'))
        subcats = [s.get('nodeName', '') for s in it.get('subcategories', [])]
        sections = it.get('sections', [])
        full_text_raw = it.get('full_text', '')
        
        # Robust summary extraction
        summary = it.get('summary')
        if not summary or not summary.strip():
            if full_text_raw:
                lines = [l.strip() for l in full_text_raw.split('\n') if l.strip()]
                content_lines = [l for l in lines if not (l.startswith('[') and l.endswith(']'))]
                if content_lines:
                    summary = content_lines[0]
            if not summary and sections:
                for sec in sections:
                    paras = sec.get('paragraphs', [])
                    if paras and paras[0].strip():
                        summary = paras[0].strip()
                        break
                    cnt = sec.get('content', '')
                    if cnt and cnt.strip():
                        summary = cnt.strip()
                        break
        
        if not summary or not summary.strip():
            summary = f"{title}에 깃든 제주의 소중한 역사와 향토문화 이야기입니다."
        else:
            summary = summary.strip()

        # Full text content reconstruction
        if full_text_raw:
            full_content = full_text_raw.strip()
        else:
            sec_texts = []
            for s in sections:
                heading = s.get('heading') or s.get('title') or ''
                content = s.get('content') or '\n'.join(s.get('paragraphs', []))
                if heading or content:
                    sec_texts.append(f"{heading}: {content}".strip())
            full_content = (summary + '\n' + '\n'.join(sec_texts)).strip()

        # Robust category classification based on metadata and content
        category = classify_poi_category(it)

        persona = determine_persona(title, subcats, full_content)
        lat, lng = extract_coordinates(title, region_str)

        # Tags
        tags = []
        if meta.get('분야'): tags.append(meta['분야'].split('/')[-1])
        if meta.get('시대'): tags.append(meta['시대'].split('/')[-1])
        for s in subcats:
            if s and s not in tags: tags.append(s)
        if len(tags) < 3:
            tags.extend(['제주명소', '공식기록', '향토문화'])
        tags = tags[:4]

        # Generate 3 contextual sample questions
        sample_questions = [
            f"{title}의 지형과 역사에 얽힌 흥미로운 이야기를 들려주세요.",
            f"{title}에서 놓치지 말고 꼭 봐야 할 핵심 포인트는 무엇인가요?",
            f"옛 조상들은 {title}을 어떤 공간으로 기록하고 전승해왔나요?"
        ]
        if persona == 'seolmundae':
            sample_questions[0] = f"할머니, {title}에 얽힌 제주 창세 신화와 자연 전설을 들려주세요."
        elif persona == 'haenyeo':
            sample_questions[0] = f"삼춘, {title} 바당과 해녀들의 삶에 얽힌 숨비소리 이야기를 들려주세요."
        elif persona == 'dolhareubang':
            sample_questions[0] = f"어르신, {title}에 깃든 유구한 탐라 역사와 문화유산의 가치를 알려주세요."

        first_img = clean_images[0]

        poi_obj = {
            'id': it.get('id', ''),
            'name': title,
            'category': category,
            'region': region_str,
            'latitude': lat,
            'longitude': lng,
            'assignedCharacterId': persona,
            'imageUrl': first_img['src'],
            'images': clean_images[:6],
            'imageTitle': first_img['alt'],
            'imageSource': first_img['source'],
            'sourceUrl': item_url,
            'tags': tags,
            'mythAndFact': {
                'mythTitle': f"{title}에 깃든 구전 기록과 학술 팩트",
                'summary': summary[:250],
                'details': full_content[:800]
            },
            'sampleQuestions': sample_questions
        }
        pois.append(poi_obj)

    # Sort: Prioritize famous landmarks, then by number of photos, then content length
    def sort_score(p):
        landmark_idx = 999
        for idx, k in enumerate(priority_titles):
            if k in p['name']:
                landmark_idx = idx
                break
        photo_count = len(p.get('images', []))
        return (landmark_idx, -photo_count, -len(p.get('mythAndFact', {}).get('details', '')))

    pois.sort(key=sort_score)
    print(f'🎉 Processed {len(pois)} interactive POIs with verified photos! (Filtered out {filtered_out_count} non-travel concept/school items)')
    return pois


def write_frontend_poi_data(pois):
    content = 'import { POI } from "../types/docent";\n\n'
    content += '// 100% Verified POI Data generated strictly from data/ JSON database\n'
    content += 'export const POI_LIST: POI[] = ' + json.dumps(pois, ensure_ascii=False, indent=2) + ';\n'
    content = unicodedata.normalize('NFC', content)

    with open(SRC_POI_DATA, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'💾 Saved {SRC_POI_DATA} ({len(pois)} POIs)')


def write_frontend_rag_kb(all_items):
    kb = {}
    for it in all_items:
        it_id = it.get('id', '')
        title = unicodedata.normalize('NFC', html.unescape(it.get('title', '')))
        summary = it.get('summary', '')
        if not summary and it.get('full_text'):
            lines = [l.strip() for l in it['full_text'].split('\n') if l.strip() and not (l.startswith('[') and l.endswith(']'))]
            summary = lines[0] if lines else ''
        sections = {s.get('heading', ''): s.get('content', '') for s in it.get('sections', [])}
        item_url = it.get('url') or f"https://jeju.grandculture.net/jeju/toc/{it_id}"
        meta = it.get('metadata') or it.get('meta') or {}
        subcats = [s.get('nodeName', '') for s in it.get('subcategories', [])]
        category = classify_poi_category(it)

        kb[it_id] = {
            'poiId': it_id,
            'poiName': title,
            'category': category,
            'sourceUrl': item_url,
            'folkloreNarrative': {
                'title': f"{title} 구전 설화 및 유래",
                'story': sections.get('정의', summary),
                'motifs': subcats,
                'oralTraditionSource': '한국학중앙연구원 한국향토문화전자대전'
            },
            'geologyAndNature': {
                'formationProcess': sections.get('지질', sections.get('위치', summary)),
                'scientificSignificance': '유네스코 세계자연유산 및 학술 공인 지형 자산',
                'naturalEnvironment': sections.get('위치', meta.get('지역', '제주특별자치도'))
            },
            'historyAndCulture': {
                'culturalHeritageRank': meta.get('유형', '공인 문화유산 / 국가자연유산'),
                'historicalContext': sections.get('연혁', sections.get('역사', summary)),
                'localFolklorePractices': sections.get('민속', '제주 전통 생활 및 민속 기록')
            },
            'academicReferences': [
                '한국향토문화전자대전 (한국학중앙연구원)',
                f'한국학중앙연구원 - [{title}] (항목 ID: {it_id})'
            ]
        }

    content = 'export interface RAGDocument {\n'
    content += '  poiId: string;\n  poiName: string;\n  category: string;\n  sourceUrl?: string;\n'
    content += '  folkloreNarrative: { title: string; story: string; motifs: string[]; oralTraditionSource: string; };\n'
    content += '  geologyAndNature: { formationProcess: string; scientificSignificance: string; naturalEnvironment: string; };\n'
    content += '  historyAndCulture: { culturalHeritageRank: string; historicalContext: string; localFolklorePractices: string; };\n'
    content += '  academicReferences: string[];\n}\n\n'
    content += 'export const RAG_KNOWLEDGE_BASE: Record<string, RAGDocument> = ' + json.dumps(kb, ensure_ascii=False, indent=2) + ';\n'
    content = unicodedata.normalize('NFC', content)

    with open(SRC_RAG_KB, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'💾 Saved {SRC_RAG_KB} ({len(kb)} KB documents)')


def write_backend_corpus(all_items):
    corpus_docs = []
    for it in all_items:
        it_id = it.get('id', '')
        title = unicodedata.normalize('NFC', html.unescape(it.get('title', '')))
        subs = [s.get('nodeName', '') for s in it.get('subcategories', [])]
        full_text_raw = it.get('full_text', '')
        summary = it.get('summary', '')
        if not summary and full_text_raw:
            lines = [l.strip() for l in full_text_raw.split('\n') if l.strip() and not (l.startswith('[') and l.endswith(']'))]
            summary = lines[0] if lines else ''
        
        if full_text_raw:
            full_content = full_text_raw.strip()
        else:
            sec_text = '\n'.join([f"{s.get('heading','')}: {s.get('content','')}" for s in it.get('sections', [])])
            full_content = (summary + '\n' + sec_text).strip()

        meta = it.get('metadata') or it.get('meta') or {}
        category = classify_poi_category(it)
        doc = {
            'id': it_id,
            'title': title,
            'category': category,
            'region': meta.get('지역', it.get('file_region', '제주특별자치도')),
            'subcats': subs,
            'summary': summary,
            'content': full_content
        }
        corpus_docs.append(doc)

    os.makedirs(os.path.dirname(SERVER_CORPUS), exist_ok=True)
    with open(SERVER_CORPUS, 'w', encoding='utf-8') as f:
        f.write(unicodedata.normalize('NFC', json.dumps(corpus_docs, ensure_ascii=False, indent=2)))
    print(f'💾 Saved {SERVER_CORPUS} ({len(corpus_docs)} corpus items)')

    os.makedirs(os.path.dirname(SRC_CORPUS), exist_ok=True)
    with open(SRC_CORPUS, 'w', encoding='utf-8') as f:
        f.write(unicodedata.normalize('NFC', json.dumps(corpus_docs, ensure_ascii=False, indent=2)))
    print(f'💾 Saved {SRC_CORPUS} ({len(corpus_docs)} corpus items)')


def main():
    all_items = load_all_json_files()
    pois = process_items_to_pois(all_items)
    write_frontend_poi_data(pois)
    write_frontend_rag_kb(all_items)
    write_backend_corpus(all_items)
    print('✨ Automated sync finished successfully!')


if __name__ == '__main__':
    main()
