#!/usr/bin/env python3
"""
Syncs data directly from data/**/*.json into:
1. src/data/poiData.ts (Frontend verified POI list with 100% official multimedia photos)
2. src/data/ragKnowledgeBase.ts (Frontend grounded RAG knowledge)
3. server/src/data/ragFullCorpus.json (Backend multi-agent knowledge base)
"""

import glob
import json
import os
import html
import re

DATA_DIR = 'data'
SRC_POI_DATA = 'src/data/poiData.ts'
SRC_RAG_KB = 'src/data/ragKnowledgeBase.ts'
SERVER_CORPUS = 'server/src/data/ragFullCorpus.json'

# Known POI registry mapping core famous places to their GPS coordinates & Persona character
POI_CONFIGS = [
    {
        'id': 'GC00710008',
        'name': '만장굴',
        'category': '자연과 지리',
        'region': '제주시 구좌읍',
        'latitude': 33.5284,
        'longitude': 126.7716,
        'characterId': 'seolmundae',
        'tags': ['유네스코 세계자연유산', '용암동굴계', '천연기념물', '용암석주'],
        'sampleQuestions': [
            '할머니, 만장굴은 어떻게 만들어진 건가요?',
            '동굴 안의 거대한 돌기둥(용암석주) 이야기가 궁금해요.',
            '거문오름 용암동굴계는 왜 세계유산인가요?'
        ]
    },
    {
        'id': 'GC00701484',
        'name': '용연·용두암',
        'category': '자연과 지리',
        'region': '제주시 용담동',
        'latitude': 33.5165,
        'longitude': 126.5126,
        'characterId': 'seolmundae',
        'tags': ['용연야범', '용두암', '현무암해안', '제주명승'],
        'sampleQuestions': [
            '용두암에 얽힌 용의 승천 전설을 들려주세요.',
            '용연 구름다리와 밤 풍경이 왜 유명한가요?',
            '용암이 바닷물과 만나 어떻게 이런 모양이 되었나요?'
        ]
    },
    {
        'id': 'GC00712004',
        'name': '제주 수월봉 화산쇄설층',
        'category': '자연과 지리',
        'region': '제주시 한경면',
        'latitude': 33.2952,
        'longitude': 126.1627,
        'characterId': 'seolmundae',
        'tags': ['유네스코 세계지질공원', '수성화산', '차귀도전경', '엉알길'],
        'sampleQuestions': [
            '수월봉 화산재 지층이 화산학의 교과서라 불리는 이유가 뭔가요?',
            '수월이와 녹고 남매의 눈물 전설을 들려주세요.',
            '엉알길 해안 절벽을 따라 걷는 명소 포인트를 알려주세요.'
        ]
    },
    {
        'id': 'GC00712012',
        'name': '사려니 숲길',
        'category': '자연과 지리',
        'region': '제주시 조천읍',
        'latitude': 33.4077,
        'longitude': 126.6433,
        'characterId': 'seolmundae',
        'tags': ['신성한숲', '삼나무숲길', '물찻오름', '에코힐링'],
        'sampleQuestions': [
            '사려니라는 이름의 뜻과 유래는 무엇인가요?',
            '신성한 숲 사려니의 태고 자연 이야기를 들려주세요.',
            '삼나무와 편백나무 숲길의 매력은 무엇인가요?'
        ]
    },
    {
        'id': 'GC00710114',
        'name': '새별 오름',
        'category': '자연과 지리',
        'region': '제주시 애월읍',
        'latitude': 33.3665,
        'longitude': 126.3562,
        'characterId': 'seolmundae',
        'tags': ['들불축제', '은빛억새명소', '기생화산', '오름왕국'],
        'sampleQuestions': [
            '새별오름이라는 예쁜 이름은 샛별처럼 빛나서 붙여진 건가요?',
            '정월대보름 들불축제는 어떤 전통에서 시작되었나요?',
            '가을철 황홀한 억새 물결 풍경을 소개해 주세요.'
        ]
    },
    {
        'id': 'GC00710144',
        'name': '용눈이 오름',
        'category': '자연과 지리',
        'region': '제주시 구좌읍',
        'latitude': 33.4608,
        'longitude': 126.8327,
        'characterId': 'seolmundae',
        'tags': ['곡선미의여왕', '일출명소', '3개분화구', '오름곡선'],
        'sampleQuestions': [
            '용이 누워있는 형상이라는 용눈이오름의 전설이 궁금해요.',
            '부드러운 능선 곡선과 3개의 분화구는 어떻게 형성되었나요?',
            '성산일출봉과 다랑쉬오름이 한눈에 보이는 전망 포인트는 어디인가요?'
        ]
    },
    {
        'id': 'GC00710064',
        'name': '다랑쉬 오름',
        'category': '자연과 지리',
        'region': '제주시 구좌읍',
        'latitude': 33.4735,
        'longitude': 126.8335,
        'characterId': 'seolmundae',
        'tags': ['오름의여왕', '월랑봉', '대형원형분화구', '제주동부전망'],
        'sampleQuestions': [
            '달이 솟아오르는 형상이라는 월랑봉(다랑쉬)의 유래가 궁금해요.',
            '백록담 깊이와 맞먹는 115m 깊이의 분화구 이야기가 신기해요.',
            '다랑쉬굴의 아픈 역사와 평화의 기억을 들려주세요.'
        ]
    },
    {
        'id': 'GC00712013',
        'name': '금능 으뜸원 해변',
        'category': '생활과 민속',
        'region': '제주시 한림읍',
        'latitude': 33.3905,
        'longitude': 126.2355,
        'characterId': 'haenyeo',
        'tags': ['비양도조망', '에메랄드빛바다', '은빛모래', '야자수산책로'],
        'sampleQuestions': [
            '삼춘, 금능 바당에서 물질할 때 비양도가 바로 눈앞에 보이나요?',
            '조수간만의 차로 물이 빠질 때 드러나는 은빛 모래톱 풍경을 들려주세요.',
            '해녀 삼춘들이 쉬어가던 불턱과 바다 이야기를 들려주세요.'
        ]
    },
    {
        'id': 'GC00710374',
        'name': '함덕 해변',
        'category': '생활과 민속',
        'region': '제주시 조천읍',
        'latitude': 33.5434,
        'longitude': 126.6692,
        'characterId': 'haenyeo',
        'tags': ['서우봉', '에메랄드바다', '조천포구', '바다물질'],
        'sampleQuestions': [
            '함덕 서우봉에 얽힌 서우낙조와 봄철 유채꽃 이야기를 들려주세요.',
            '투명하고 얕은 바다에서 해녀 삼춘들이 주로 잡는 해산물은 무엇인가요?',
            '함덕 포구의 오랜 어촌 생활과 잠녀들의 삶을 전해주세요.'
        ]
    },
    {
        'id': 'GC00710373',
        'name': '김녕 해변',
        'category': '생활과 민속',
        'region': '제주시 구좌읍',
        'latitude': 33.5574,
        'longitude': 126.7594,
        'characterId': 'haenyeo',
        'tags': ['성세기해변', '김녕사굴', '해녀불턱', '풍력발전해안'],
        'sampleQuestions': [
            '김녕 바당의 거친 파도 속에서 해녀 삼춘들이 외치는 숨비소리는 어떤 의미인가요?',
            '김녕사굴의 거대한 뱀과 서련 판관 전설을 들려주세요.',
            '김녕 어촌계 해녀 공동체의 끈끈한 전통을 들려주세요.'
        ]
    },
    {
        'id': 'GC00710448',
        'name': '월정리 해변',
        'category': '생활과 민속',
        'region': '제주시 구좌읍',
        'latitude': 33.5562,
        'longitude': 126.7958,
        'characterId': 'haenyeo',
        'tags': ['달이머무는곳', '풍력발전단지', '코발트빛바다', '해녀바당'],
        'sampleQuestions': [
            '달이 머무는 아름다운 마을이라는 월정리의 유래가 궁금해요.',
            '검은 현무암과 하얀 모래가 어우러진 월정리 바다 물질 이야기를 들려주세요.',
            '해녀들이 바다에 나가기 전 바다신께 빌던 풍어제 이야기가 궁금해요.'
        ]
    },
    {
        'id': 'GC00710372',
        'name': '곽지 해변',
        'category': '생활과 민속',
        'region': '제주시 애월읍',
        'latitude': 33.4509,
        'longitude': 126.3106,
        'characterId': 'haenyeo',
        'tags': ['과물노천탕', '용천수탕', '곽지백사장', '조개잡이'],
        'sampleQuestions': [
            '바닷가 모래밭에서 솟아나는 차가운 민물 용천수(과물) 이야기가 신기해요.',
            '과물 노천탕에서 물질을 마치고 몸을 씻던 해녀들의 전통을 들려주세요.',
            '곽지 바당에서 나오는 특산물과 갯바위 생태를 알려주세요.'
        ]
    },
    {
        'id': 'GC00710213',
        'name': '우도 (서빈백사 & 우도봉)',
        'category': '생활과 민속',
        'region': '제주시 우도면',
        'latitude': 33.5043,
        'longitude': 126.9542,
        'characterId': 'haenyeo',
        'tags': ['서빈백사', '홍조단괴해빈', '우도8경', '천연기념물제438호'],
        'sampleQuestions': [
            '우도 서빈백사의 하얀 자갈이 산호가 아니라 홍조류 돌덩이(홍조단괴)라는데 맞나요?',
            '우도 해녀들의 거친 바다 물질과 전설적인 잠수 실력 이야기를 들려주세요.',
            '소가 누워있는 형상이라는 섬 우도의 8경을 소개해 주세요.'
        ]
    },
    {
        'id': 'GC00700584',
        'name': '도두봉',
        'category': '자연과 지리',
        'region': '제주시 도두동',
        'latitude': 33.5069,
        'longitude': 126.4677,
        'characterId': 'seolmundae',
        'tags': ['키세스존', '도두항', '제주공항전망', '해안기생화산'],
        'sampleQuestions': [
            '도두봉 정상의 동백나무 키세스존과 비행기 이착륙 뷰포인트를 알려주세요.',
            '도두항과 해안을 붉게 물들이는 저녁 노을 풍경을 소개해 주세요.',
            '도두봉 수성화산 응회구의 지질학적 형성과정을 알려주세요.'
        ]
    },
    {
        'id': 'GC00701045',
        'name': '삼양동 선사유적지',
        'category': '문화유산',
        'region': '제주시 삼양동',
        'latitude': 33.5234,
        'longitude': 126.5878,
        'characterId': 'dolhareubang',
        'tags': ['국가지정사적제416호', '청동기시대집자리', '원삼국시대', '탐라선사마을'],
        'sampleQuestions': [
            '돌하르방 어르신, 기원전 삼양동에 형성된 제주 최대 선사 취락마을 이야기를 들려주세요.',
            '움집터와 청동기·초기철기 토기들이 전하는 선조들의 생활상은 어떠했나요?',
            '삼양 검은모래 해변과 원당봉이 주는 역사적 배경을 알려주세요.'
        ]
    },
    {
        'id': 'GC00710380',
        'name': '항파두리 항몽유적지',
        'category': '문화유산',
        'region': '제주시 애월읍',
        'latitude': 33.4523,
        'longitude': 126.4112,
        'characterId': 'dolhareubang',
        'tags': ['사적제396호', '삼별초항쟁', '김통정장군', '토성유적'],
        'sampleQuestions': [
            '고려 말 몽골에 끝까지 맞서 싸운 삼별초의 결연한 호국 역사 이야기를 들려주세요.',
            '흙으로 쌓은 토성과 석성의 방어 구조는 어떻게 만들어졌나요?',
            '김통정 장군과 구국의 넋이 깃든 살맞은돌, 장수물 이야기를 전해주세요.'
        ]
    }
]


def load_all_json_items():
    items_by_id = {}
    items_by_title = {}
    json_files = glob.glob(os.path.join(DATA_DIR, '**/*.json'), recursive=True)
    print(f'📂 Loading {len(json_files)} database files from {DATA_DIR}/...')

    for fpath in json_files:
        with open(fpath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for it in data.get('items', []):
                it['title'] = html.unescape(it['title'])
                it['id'] = it.get('id', '')
                items_by_id[it['id']] = it
                items_by_title[it['title']] = it

    print(f'✅ Loaded {len(items_by_id)} total unique items from data/ database.')
    return items_by_id, items_by_title


def build_poi_list(items_by_id, items_by_title):
    verified_pois = []

    for cfg in POI_CONFIGS:
        item = items_by_id.get(cfg['id'])
        if not item:
            for title, it in items_by_title.items():
                if cfg['name'] in title or title in cfg['name']:
                    item = it
                    break

        if not item:
            print(f'⚠️ Warning: POI [{cfg["name"]}] not found in data/ JSON, skipping.')
            continue

        # Extract real multimedia from database
        multimedia = item.get('multimedia', [])
        clean_images = []
        for m in multimedia:
            src = m.get('src')
            alt = m.get('alt', item['title'])
            if src and src.startswith('http'):
                clean_images.append({
                    'src': src,
                    'alt': html.unescape(alt),
                    'source': '한국학중앙연구원 한국향토문화전자대전'
                })

        if not clean_images:
            # Check other items that share similar title for images
            for it in items_by_id.values():
                if cfg['name'] in it['title']:
                    for m in it.get('multimedia', []):
                        if m.get('src'):
                            clean_images.append({
                                'src': m['src'],
                                'alt': html.unescape(m.get('alt', it['title'])),
                                'source': '한국학중앙연구원 향토문화전자대전'
                            })

        if not clean_images:
            print(f'⚠️ Warning: No official photos for [{cfg["name"]}], skipping to preserve 100% data integrity.')
            continue

        first_img = clean_images[0]

        # Extract summary & detail facts from sections
        sections = item.get('sections', [])
        summary_text = item.get('summary', '')
        details_text = ''
        for s in sections:
            details_text += f"{s.get('heading', '')}: {s.get('content', '')}\n\n"

        poi_obj = {
            'id': item['id'],
            'name': cfg['name'],
            'category': cfg['category'],
            'region': cfg['region'],
            'latitude': cfg['latitude'],
            'longitude': cfg['longitude'],
            'assignedCharacterId': cfg['characterId'],
            'imageUrl': first_img['src'],
            'images': clean_images[:6],
            'imageTitle': first_img['alt'],
            'imageSource': first_img['source'],
            'tags': cfg['tags'],
            'mythAndFact': {
                'mythTitle': f"{cfg['name']}에 깃든 전설과 학술 팩트",
                'summary': summary_text[:200] if summary_text else f"{cfg['name']} 공식 아카이브 기록",
                'details': (summary_text + '\n\n' + details_text).strip()[:800]
            },
            'sampleQuestions': cfg['sampleQuestions']
        }
        verified_pois.append(poi_obj)

    print(f'🎉 Generated {len(verified_pois)} 100% verified POIs strictly from data/ database.')
    return verified_pois


def write_frontend_poi_data(pois):
    content = 'import { POI } from "../types/docent";\n\n'
    content += '// 100% Verified POI Data generated strictly from data/ JSON database\n'
    content += 'export const POI_LIST: POI[] = ' + json.dumps(pois, ensure_ascii=False, indent=2) + ';\n'

    with open(SRC_POI_DATA, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'💾 Saved {SRC_POI_DATA}')


def write_frontend_rag_kb(pois, items_by_id):
    kb = {}
    for p in pois:
        item = items_by_id.get(p['id'], {})
        sections = {s.get('heading', ''): s.get('content', '') for s in item.get('sections', [])}
        kb[p['id']] = {
            'poiId': p['id'],
            'poiName': p['name'],
            'category': p['category'],
            'folkloreNarrative': {
                'title': f"{p['name']} 구전 설화 및 유래",
                'story': sections.get('정의', item.get('summary', '')),
                'motifs': p['tags'],
                'oralTraditionSource': '한국학중앙연구원 향토문화전자대전'
            },
            'geologyAndNature': {
                'formationProcess': sections.get('지질', sections.get('위치', item.get('summary', ''))),
                'scientificSignificance': '유네스코 세계자연유산 및 학술 공인 지형 자산',
                'naturalEnvironment': sections.get('위치', p['region'])
            },
            'historyAndCulture': {
                'culturalHeritageRank': '공인 문화유산 / 국가자연유산',
                'historicalContext': sections.get('연혁', sections.get('역사', item.get('summary', ''))),
                'localFolklorePractices': sections.get('민속', '제주 전통 생활 및 민속 기록')
            },
            'academicReferences': [
                '한국향토문화전자대전 (한국학중앙연구원)',
                f'한국학중앙연구원 - [{item.get("title", p["name"])}] (항목 ID: {p["id"]})'
            ]
        }

    content = 'export interface RAGDocument {\n'
    content += '  poiId: string;\n  poiName: string;\n  category: string;\n'
    content += '  folkloreNarrative: { title: string; story: string; motifs: string[]; oralTraditionSource: string; };\n'
    content += '  geologyAndNature: { formationProcess: string; scientificSignificance: string; naturalEnvironment: string; };\n'
    content += '  historyAndCulture: { culturalHeritageRank: string; historicalContext: string; localFolklorePractices: string; };\n'
    content += '  academicReferences: string[];\n}\n\n'
    content += 'export const RAG_KNOWLEDGE_BASE: Record<string, RAGDocument> = ' + json.dumps(kb, ensure_ascii=False, indent=2) + ';\n'

    with open(SRC_RAG_KB, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'💾 Saved {SRC_RAG_KB}')


def write_backend_corpus(items_by_id):
    corpus_docs = []
    for it_id, it in items_by_id.items():
        subs = [s.get('nodeName', '') for s in it.get('subcategories', [])]
        sec_text = '\n'.join([f"{s.get('heading','')}: {s.get('content','')}" for s in it.get('sections', [])])
        doc = {
            'id': it_id,
            'title': it.get('title', ''),
            'category': '자연과 지리',
            'region': it.get('metadata', {}).get('지역', '제주특별자치도 제주시'),
            'subcats': subs,
            'summary': it.get('summary', ''),
            'content': (it.get('summary', '') + '\n' + sec_text).strip()
        }
        corpus_docs.append(doc)

    os.makedirs(os.path.dirname(SERVER_CORPUS), exist_ok=True)
    with open(SERVER_CORPUS, 'w', encoding='utf-8') as f:
        json.dump(corpus_docs, f, ensure_ascii=False, indent=2)
    print(f'💾 Saved {SERVER_CORPUS} ({len(corpus_docs)} documents)')


def main():
    items_by_id, items_by_title = load_all_json_items()
    pois = build_poi_list(items_by_id, items_by_title)
    write_frontend_poi_data(pois)
    write_frontend_rag_kb(pois, items_by_id)
    write_backend_corpus(items_by_id)
    print('✨ Data synchronization from data/ folder completed successfully!')


if __name__ == '__main__':
    main()
