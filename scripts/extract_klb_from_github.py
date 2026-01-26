#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os

def extract_klb_to_simple_format():
    """
    GitHub 저장소의 현대인의성경(86.json)을
    현재 앱에서 사용하는 단순한 형식으로 변환
    """

    base_dir = r'C:\Lacal_workspace\project\reading-jesus\bible'
    input_file = os.path.join(base_dir, 'github-bible', 'json', '86.json')
    output_file = os.path.join(base_dir, 'bible_klb.json')

    print("=" * 60)
    print("현대인의성경 추출 스크립트")
    print("=" * 60)
    print(f"\n입력: {input_file}")
    print(f"출력: {output_file}\n")

    try:
        # GitHub 형식 JSON 읽기
        with open(input_file, 'r', encoding='utf-8') as f:
            github_data = json.load(f)

        print("[OK] GitHub JSON 파일 로드 완료")

        # 단순 형식으로 변환
        simple_bible = {}
        verse_count = 0

        # 책 약어 매핑 (이미 bibleLoader.ts에 있는 것과 동일)
        book_abbr_map = {
            '창세기': '창', '출애굽기': '출', '레위기': '레', '민수기': '민', '신명기': '신',
            '여호수아': '수', '사사기': '삿', '룻기': '룻', '사무엘상': '삼상', '사무엘하': '삼하',
            '열왕기상': '왕상', '열왕기하': '왕하', '역대상': '대상', '역대하': '대하',
            '에스라': '스', '느헤미야': '느', '에스더': '에', '욥기': '욥', '시편': '시',
            '잠언': '잠', '전도서': '전', '아가': '아', '이사야': '사', '예레미야': '렘',
            '예레미야애가': '애', '에스겔': '겔', '다니엘': '단', '호세아': '호', '요엘': '욜',
            '아모스': '암', '오바댜': '옵', '요나': '욘', '미가': '미', '나훔': '나',
            '하박국': '합', '스바냐': '습', '학개': '학', '스가랴': '슥', '말라기': '말',
            '마태복음': '마', '마가복음': '막', '누가복음': '눅', '요한복음': '요', '사도행전': '행',
            '로마서': '롬', '고린도전서': '고전', '고린도후서': '고후', '갈라디아서': '갈',
            '에베소서': '엡', '빌립보서': '빌', '골로새서': '골', '데살로니가전서': '살전',
            '데살로니가후서': '살후', '디모데전서': '딤전', '디모데후서': '딤후', '디도서': '딛',
            '빌레몬서': '몬', '히브리서': '히', '야고보서': '약', '베드로전서': '벧전',
            '베드로후서': '벧후', '요한일서': '요일', '요한이서': '요이', '요한삼서': '요삼',
            '유다서': '유', '요한계시록': '계'
        }

        # book 객체 순회
        for book_num, book_data in github_data['book'].items():
            book_name = book_data['info']['name']
            book_abbr = book_abbr_map.get(book_name, book_name)

            print(f"  처리 중: {book_name} ({book_abbr})")

            # chapter 객체 순회
            for chapter_num, chapter_data in book_data['chapter'].items():
                # verse 객체 순회
                for verse_num, verse_data in chapter_data['verse'].items():
                    # 키 형식: "창1:1"
                    key = f"{book_abbr}{chapter_num}:{verse_num}"
                    # 값: 본문 텍스트만 (앞뒤 공백 제거)
                    text = verse_data['text'].strip()

                    simple_bible[key] = text
                    verse_count += 1

        print(f"\n[OK] 변환 완료: {len(simple_bible)}절")

        # JSON 파일로 저장
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(simple_bible, f, ensure_ascii=False, indent=2)

        # 파일 크기 확인
        file_size = os.path.getsize(output_file) / (1024 * 1024)
        print(f"[OK] 파일 저장 완료: {output_file}")
        print(f"  파일 크기: {file_size:.2f} MB")

        # 샘플 출력
        print("\n" + "=" * 60)
        print("샘플 데이터 (창세기 1:1-3)")
        print("=" * 60)
        for i in range(1, 4):
            key = f"창1:{i}"
            if key in simple_bible:
                print(f"{key} {simple_bible[key]}")

        return True

    except FileNotFoundError:
        print(f"[ERROR] 파일을 찾을 수 없습니다: {input_file}")
        print("\n먼저 다음 명령어로 GitHub 저장소를 클론하세요:")
        print("git clone https://github.com/laisiangtho/bible.git github-bible")
        return False
    except Exception as e:
        print(f"[ERROR] 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    extract_klb_to_simple_format()
