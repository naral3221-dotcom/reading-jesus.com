'use client';

import * as React from 'react';
import { BIBLE_BOOKS, getOldTestament, getNewTestament } from '@/data/bibleBooks';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

export interface BibleVerseValue {
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
}

interface BibleVerseSelectorProps {
  value?: BibleVerseValue | null;
  onChange: (value: BibleVerseValue | null) => void;
  className?: string;
  placeholder?: string;
}

export function BibleVerseSelector({
  value,
  onChange,
  className,
  placeholder = '성경 구절 선택',
}: BibleVerseSelectorProps) {
  const [testament, setTestament] = React.useState<'old' | 'new'>('old');
  const [selectedBook, setSelectedBook] = React.useState<string>(value?.book || '');
  const [chapter, setChapter] = React.useState<string>(value?.chapter?.toString() || '');
  const [startVerse, setStartVerse] = React.useState<string>(value?.startVerse?.toString() || '');
  const [endVerse, setEndVerse] = React.useState<string>(value?.endVerse?.toString() || '');

  const books = testament === 'old' ? getOldTestament() : getNewTestament();
  const selectedBookInfo = BIBLE_BOOKS.find(b => b.name === selectedBook);
  const maxChapters = selectedBookInfo?.chapters || 1;

  // value가 변경되면 로컬 상태도 업데이트
  React.useEffect(() => {
    if (value) {
      const bookInfo = BIBLE_BOOKS.find(b => b.name === value.book);
      if (bookInfo) {
        setTestament(bookInfo.testament);
        setSelectedBook(value.book);
        setChapter(value.chapter?.toString() || '');
        setStartVerse(value.startVerse?.toString() || '');
        setEndVerse(value.endVerse?.toString() || '');
      }
    }
  }, [value]);

  // 값이 변경될 때마다 부모에게 알림
  const updateValue = React.useCallback(() => {
    if (!selectedBook || !chapter) {
      onChange(null);
      return;
    }

    const chapterNum = parseInt(chapter, 10);
    if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > maxChapters) {
      onChange(null);
      return;
    }

    const newValue: BibleVerseValue = {
      book: selectedBook,
      chapter: chapterNum,
    };

    if (startVerse) {
      const startNum = parseInt(startVerse, 10);
      if (!isNaN(startNum) && startNum > 0) {
        newValue.startVerse = startNum;
      }
    }

    if (endVerse && startVerse) {
      const endNum = parseInt(endVerse, 10);
      const startNum = parseInt(startVerse, 10);
      if (!isNaN(endNum) && endNum >= startNum) {
        newValue.endVerse = endNum;
      }
    }

    onChange(newValue);
  }, [selectedBook, chapter, startVerse, endVerse, maxChapters, onChange]);

  // 책이 변경되면 장/절 초기화
  const handleBookChange = (bookName: string) => {
    setSelectedBook(bookName);
    setChapter('');
    setStartVerse('');
    setEndVerse('');
    onChange(null);
  };

  // 장 입력 처리
  const handleChapterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setChapter(val);
    }
  };

  // 절 입력 처리
  const handleStartVerseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setStartVerse(val);
    }
  };

  const handleEndVerseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setEndVerse(val);
    }
  };

  // blur 시 값 업데이트
  const handleBlur = () => {
    updateValue();
  };

  // 표시용 문자열 생성
  const displayValue = React.useMemo(() => {
    if (!selectedBook || !chapter) return '';
    let result = `${selectedBook} ${chapter}장`;
    if (startVerse) {
      result += ` ${startVerse}절`;
      if (endVerse && endVerse !== startVerse) {
        result += `-${endVerse}절`;
      }
    }
    return result;
  }, [selectedBook, chapter, startVerse, endVerse]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* 구약/신약 토글 */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={testament === 'old' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setTestament('old');
            setSelectedBook('');
            setChapter('');
            setStartVerse('');
            setEndVerse('');
            onChange(null);
          }}
          className="flex-1"
        >
          구약
        </Button>
        <Button
          type="button"
          variant={testament === 'new' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setTestament('new');
            setSelectedBook('');
            setChapter('');
            setStartVerse('');
            setEndVerse('');
            onChange(null);
          }}
          className="flex-1"
        >
          신약
        </Button>
      </div>

      {/* 성경책 선택 */}
      <Select value={selectedBook} onValueChange={handleBookChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="성경책 선택">
            {selectedBook && (
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                {selectedBook}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{testament === 'old' ? '구약' : '신약'}</SelectLabel>
            {books.map((book) => (
              <SelectItem key={book.name} value={book.name}>
                {book.name} ({book.chapters}장)
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* 장/절 입력 */}
      {selectedBook && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              type="text"
              inputMode="numeric"
              placeholder={`장 (1-${maxChapters})`}
              value={chapter}
              onChange={handleChapterChange}
              onBlur={handleBlur}
              className="text-center"
            />
          </div>
          <span className="text-muted-foreground">:</span>
          <div className="flex-1">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="시작 절"
              value={startVerse}
              onChange={handleStartVerseChange}
              onBlur={handleBlur}
              className="text-center"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="flex-1">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="끝 절"
              value={endVerse}
              onChange={handleEndVerseChange}
              onBlur={handleBlur}
              className="text-center"
            />
          </div>
        </div>
      )}

      {/* 선택된 구절 표시 */}
      {displayValue && (
        <div className="text-sm text-primary font-medium bg-primary/10 rounded-lg px-3 py-2">
          {displayValue}
        </div>
      )}
    </div>
  );
}

// 헬퍼 함수: BibleVerseValue를 문자열로 변환
export function formatBibleVerse(value: BibleVerseValue | null): string {
  if (!value) return '';

  let result = `${value.book} ${value.chapter}장`;
  if (value.startVerse) {
    result += ` ${value.startVerse}절`;
    if (value.endVerse && value.endVerse !== value.startVerse) {
      result += `-${value.endVerse}절`;
    }
  }
  return result;
}

// 헬퍼 함수: BibleVerseValue를 축약형 문자열로 변환
export function formatBibleVerseShort(value: BibleVerseValue | null): string {
  if (!value) return '';

  const bookInfo = BIBLE_BOOKS.find(b => b.name === value.book);
  const abbr = bookInfo?.abbr || value.book;

  let result = `${abbr} ${value.chapter}`;
  if (value.startVerse) {
    result += `:${value.startVerse}`;
    if (value.endVerse && value.endVerse !== value.startVerse) {
      result += `-${value.endVerse}`;
    }
  }
  return result;
}
