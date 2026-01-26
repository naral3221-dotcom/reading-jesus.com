#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import re
import os

# 성경 책 약어 매핑 (풀네임 추가)
BOOK_MAPPING = {
    # 구약 (39권)
    '창': {'full': '창세기', 'testament': '구약', 'order': 1},
    '출': {'full': '출애굽기', 'testament': '구약', 'order': 2},
    '레': {'full': '레위기', 'testament': '구약', 'order': 3},
    '민': {'full': '민수기', 'testament': '구약', 'order': 4},
    '신': {'full': '신명기', 'testament': '구약', 'order': 5},
    '수': {'full': '여호수아', 'testament': '구약', 'order': 6},
    '삿': {'full': '사사기', 'testament': '구약', 'order': 7},
    '룻': {'full': '룻기', 'testament': '구약', 'order': 8},
    '삼상': {'full': '사무엘상', 'testament': '구약', 'order': 9},
    '삼하': {'full': '사무엘하', 'testament': '구약', 'order': 10},
    '왕상': {'full': '열왕기상', 'testament': '구약', 'order': 11},
    '왕하': {'full': '열왕기하', 'testament': '구약', 'order': 12},
    '대상': {'full': '역대상', 'testament': '구약', 'order': 13},
    '대하': {'full': '역대하', 'testament': '구약', 'order': 14},
    '스': {'full': '에스라', 'testament': '구약', 'order': 15},
    '느': {'full': '느헤미야', 'testament': '구약', 'order': 16},
    '에': {'full': '에스더', 'testament': '구약', 'order': 17},
    '욥': {'full': '욥기', 'testament': '구약', 'order': 18},
    '시': {'full': '시편', 'testament': '구약', 'order': 19},
    '잠': {'full': '잠언', 'testament': '구약', 'order': 20},
    '전': {'full': '전도서', 'testament': '구약', 'order': 21},
    '아': {'full': '아가', 'testament': '구약', 'order': 22},
    '사': {'full': '이사야', 'testament': '구약', 'order': 23},
    '렘': {'full': '예레미야', 'testament': '구약', 'order': 24},
    '애': {'full': '예레미야애가', 'testament': '구약', 'order': 25},
    '겔': {'full': '에스겔', 'testament': '구약', 'order': 26},
    '단': {'full': '다니엘', 'testament': '구약', 'order': 27},
    '호': {'full': '호세아', 'testament': '구약', 'order': 28},
    '욜': {'full': '요엘', 'testament': '구약', 'order': 29},
    '암': {'full': '아모스', 'testament': '구약', 'order': 30},
    '옵': {'full': '오바댜', 'testament': '구약', 'order': 31},
    '욘': {'full': '요나', 'testament': '구약', 'order': 32},
    '미': {'full': '미가', 'testament': '구약', 'order': 33},
    '나': {'full': '나훔', 'testament': '구약', 'order': 34},
    '합': {'full': '하박국', 'testament': '구약', 'order': 35},
    '습': {'full': '스바냐', 'testament': '구약', 'order': 36},
    '학': {'full': '학개', 'testament': '구약', 'order': 37},
    '슥': {'full': '스가랴', 'testament': '구약', 'order': 38},
    '말': {'full': '말라기', 'testament': '구약', 'order': 39},

    # 신약 (27권)
    '마': {'full': '마태복음', 'testament': '신약', 'order': 40},
    '막': {'full': '마가복음', 'testament': '신약', 'order': 41},
    '눅': {'full': '누가복음', 'testament': '신약', 'order': 42},
    '요': {'full': '요한복음', 'testament': '신약', 'order': 43},
    '행': {'full': '사도행전', 'testament': '신약', 'order': 44},
    '롬': {'full': '로마서', 'testament': '신약', 'order': 45},
    '고전': {'full': '고린도전서', 'testament': '신약', 'order': 46},
    '고후': {'full': '고린도후서', 'testament': '신약', 'order': 47},
    '갈': {'full': '갈라디아서', 'testament': '신약', 'order': 48},
    '엡': {'full': '에베소서', 'testament': '신약', 'order': 49},
    '빌': {'full': '빌립보서', 'testament': '신약', 'order': 50},
    '골': {'full': '골로새서', 'testament': '신약', 'order': 51},
    '살전': {'full': '데살로니가전서', 'testament': '신약', 'order': 52},
    '살후': {'full': '데살로니가후서', 'testament': '신약', 'order': 53},
    '딤전': {'full': '디모데전서', 'testament': '신약', 'order': 54},
    '딤후': {'full': '디모데후서', 'testament': '신약', 'order': 55},
    '딛': {'full': '디도서', 'testament': '신약', 'order': 56},
    '몬': {'full': '빌레몬서', 'testament': '신약', 'order': 57},
    '히': {'full': '히브리서', 'testament': '신약', 'order': 58},
    '약': {'full': '야고보서', 'testament': '신약', 'order': 59},
    '벧전': {'full': '베드로전서', 'testament': '신약', 'order': 60},
    '벧후': {'full': '베드로후서', 'testament': '신약', 'order': 61},
    '요일': {'full': '요한일서', 'testament': '신약', 'order': 62},
    '요이': {'full': '요한이서', 'testament': '신약', 'order': 63},
    '요삼': {'full': '요한삼서', 'testament': '신약', 'order': 64},
    '유': {'full': '유다서', 'testament': '신약', 'order': 65},
    '계': {'full': '요한계시록', 'testament': '신약', 'order': 66},
}

def parse_bible_text(file_path):
    """
    성경 텍스트 파일을 파싱하여 구조화된 데이터로 변환
    """
    bible_data = {}

    try:
        # 여러 인코딩 시도
        for encoding in ['cp949', 'euc-kr', 'utf-8']:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                print(f"[OK] 파일을 {encoding} 인코딩으로 읽었습니다.")
                break
            except UnicodeDecodeError:
                continue
        else:
            print("[ERROR] 파일 인코딩을 감지할 수 없습니다.")
            return None

        # 줄 단위로 분리
        lines = content.strip().split('\n')

        current_book = None
        current_chapter = None
        verse_count = 0

        # 패턴: 창1:1 또는 창1:1 <제목> 형식
        pattern = re.compile(r'^([가-힣]+)(\d+):(\d+)\s*(?:<[^>]+>)?\s*(.+)$')

        for line in lines:
            line = line.strip()
            if not line:
                continue

            match = pattern.match(line)
            if match:
                book_abbr, chapter, verse, text = match.groups()
                chapter = int(chapter)
                verse = int(verse)

                # 책 정보 확인
                if book_abbr not in BOOK_MAPPING:
                    continue

                book_info = BOOK_MAPPING[book_abbr]
                book_full_name = book_info['full']

                # 책 초기화
                if book_full_name not in bible_data:
                    bible_data[book_full_name] = {
                        'name': book_full_name,
                        'abbr': book_abbr,
                        'testament': book_info['testament'],
                        'order': book_info['order'],
                        'chapters': {}
                    }
                    current_book = book_full_name
                    print(f"  처리 중: {book_full_name}")

                # 장 초기화
                if str(chapter) not in bible_data[book_full_name]['chapters']:
                    bible_data[book_full_name]['chapters'][str(chapter)] = {
                        'chapter': chapter,
                        'verses': {}
                    }

                # 절 추가
                bible_data[book_full_name]['chapters'][str(chapter)]['verses'][str(verse)] = {
                    'verse': verse,
                    'text': text.strip()
                }
                verse_count += 1

        print(f"\n[DONE] 총 {len(bible_data)}권, {verse_count}절을 처리했습니다.")
        return bible_data

    except Exception as e:
        print(f"[ERROR] 오류 발생: {e}")
        return None

def save_bible_json(bible_data, output_path):
    """
    성경 데이터를 JSON 파일로 저장
    """
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(bible_data, f, ensure_ascii=False, indent=2)
        print(f"\n[OK] JSON 파일 저장 완료: {output_path}")

        # 파일 크기 확인
        file_size = os.path.getsize(output_path) / (1024 * 1024)
        print(f"  파일 크기: {file_size:.2f} MB")

        return True
    except Exception as e:
        print(f"[ERROR] JSON 저장 실패: {e}")
        return False

def main():
    base_dir = r'C:\Lacal_workspace\project\reading-jesus\bible'
    input_file = os.path.join(base_dir, '개역개정4판(구약+신약).txt')
    output_file = os.path.join(base_dir, 'bible_full.json')

    print("=" * 60)
    print("성경 텍스트 → JSON 변환 스크립트")
    print("=" * 60)
    print(f"\n입력 파일: {input_file}")
    print(f"출력 파일: {output_file}\n")

    # 파일 존재 확인
    if not os.path.exists(input_file):
        print(f"[ERROR] 입력 파일을 찾을 수 없습니다: {input_file}")
        # 대체 파일 시도
        input_file = os.path.join(base_dir, '개역한글판성경.txt')
        if os.path.exists(input_file):
            print(f"[INFO] 대체 파일 사용: {input_file}")
        else:
            return

    # 파싱 실행
    bible_data = parse_bible_text(input_file)

    if bible_data:
        # JSON 저장
        save_bible_json(bible_data, output_file)

        # 샘플 데이터 출력
        print("\n" + "=" * 60)
        print("샘플 데이터 (창세기 1:1-3)")
        print("=" * 60)
        if '창세기' in bible_data and '1' in bible_data['창세기']['chapters']:
            chapter1 = bible_data['창세기']['chapters']['1']
            for i in range(1, min(4, len(chapter1['verses']) + 1)):
                if str(i) in chapter1['verses']:
                    verse = chapter1['verses'][str(i)]
                    print(f"창세기 1:{i} {verse['text']}")
    else:
        print("\n[ERROR] 파싱에 실패했습니다.")

if __name__ == '__main__':
    main()
