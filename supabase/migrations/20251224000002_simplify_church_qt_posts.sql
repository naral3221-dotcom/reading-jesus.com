-- church_qt_posts 테이블 단순화
-- 제거: one_word(한 단어 동그라미), copy_verse(필사)
-- 유지: day_review(하루 점검) - 교회 요청 항목

-- 사용하지 않는 컬럼 제거
ALTER TABLE church_qt_posts DROP COLUMN IF EXISTS one_word;
ALTER TABLE church_qt_posts DROP COLUMN IF EXISTS copy_verse;

-- 코멘트 추가
COMMENT ON TABLE church_qt_posts IS 'QT 나눔 게시글 (5개 핵심 항목: 내 말로 한 문장, 묵상 답변, 감사/적용, 기도, 하루 점검)';
COMMENT ON COLUMN church_qt_posts.my_sentence IS '내 말로 한 문장 - 본문 요약';
COMMENT ON COLUMN church_qt_posts.meditation_answer IS '묵상 질문에 대한 답변';
COMMENT ON COLUMN church_qt_posts.gratitude IS '감사와 적용';
COMMENT ON COLUMN church_qt_posts.my_prayer IS '나의 기도';
COMMENT ON COLUMN church_qt_posts.day_review IS '말씀과 함께한 하루 점검 - 하루를 돌아보며 말씀 적용 점검';
