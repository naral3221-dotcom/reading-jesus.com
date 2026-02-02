'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { extractYoutubeId } from '@/components/ui/link-preview';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Highlighter,
  Heading2,
  Undo,
  Redo,
} from 'lucide-react';
import { Button } from './button';

interface RichEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  disabled?: boolean;
  minHeight?: string;
  // 외부에서 삽입할 콘텐츠 (변경 시 에디터에 삽입)
  insertContent?: string;
  onInsertComplete?: () => void;
  // 이미지 삽입 (base64 또는 URL)
  insertImage?: string;
  onInsertImageComplete?: () => void;
}

interface MenuButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

const MenuButton = ({ onClick, isActive, disabled, children, title }: MenuButtonProps) => (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'h-8 w-8',
      isActive && 'bg-muted text-primary'
    )}
  >
    {children}
  </Button>
);

interface MenuBarProps {
  editor: Editor | null;
}

const MenuBar = ({ editor }: MenuBarProps) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30 sticky top-0 z-10">
      {/* 텍스트 스타일 */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="굵게 (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="기울임 (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="밑줄 (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="취소선"
      >
        <Strikethrough className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title="하이라이트"
      >
        <Highlighter className="w-4 h-4" />
      </MenuButton>

      <div className="w-px h-6 bg-border mx-1 self-center" />

      {/* 구조 */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="제목"
      >
        <Heading2 className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="글머리 기호"
      >
        <List className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="번호 매기기"
      >
        <ListOrdered className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="인용구"
      >
        <Quote className="w-4 h-4" />
      </MenuButton>

      <div className="w-px h-6 bg-border mx-1 self-center" />

      {/* 실행 취소/다시 실행 */}
      <MenuButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="실행 취소 (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="다시 실행 (Ctrl+Y)"
      >
        <Redo className="w-4 h-4" />
      </MenuButton>
    </div>
  );
};

export function RichEditor({
  content = '',
  onChange,
  placeholder = '내용을 입력하세요...',
  className,
  editable = true,
  disabled = false,
  minHeight = '150px',
  insertContent,
  onInsertComplete,
  insertImage,
  onInsertImageComplete,
}: RichEditorProps) {
  const isEditable = editable && !disabled;
  const lastInsertedRef = useRef<string>('');
  const lastInsertedImageRef = useRef<string>('');
  // 외부 content prop 변경 감지용
  const prevContentRef = useRef<string>(content);
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2],
        },
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Underline.extend({ name: 'customUnderline' }).configure({
        HTMLAttributes: {
          class: 'underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-[180px] h-auto my-2 cursor-pointer hover:opacity-90 transition-opacity',
        },
      }),
    ],
    content,
    editable: isEditable,
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none',
          'prose-headings:font-bold prose-headings:text-foreground',
          'prose-p:text-foreground prose-p:leading-relaxed',
          'prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground',
          'prose-strong:text-foreground prose-strong:font-bold',
          'prose-ul:list-disc prose-ol:list-decimal',
          'prose-li:text-foreground',
          '[&_mark]:bg-yellow-200 [&_mark]:text-foreground'
        ),
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // 외부에서 content prop이 변경되면 에디터 내용 동기화 (임시저장 불러오기 등)
  useEffect(() => {
    if (!editor) return;

    // 내부 업데이트(사용자 타이핑)로 인한 변경은 무시
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      prevContentRef.current = content;
      return;
    }

    // 외부에서 content가 변경되었을 때만 에디터 내용 교체
    if (content !== prevContentRef.current) {
      const currentContent = editor.getHTML();
      // 에디터의 현재 내용과 다를 때만 업데이트 (불필요한 업데이트 방지)
      if (content !== currentContent) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
      prevContentRef.current = content;
    }
  }, [editor, content]);

  // 외부에서 콘텐츠 삽입 요청 시 처리
  useEffect(() => {
    if (editor && insertContent && insertContent !== lastInsertedRef.current) {
      // 현재 커서 위치에 삽입 (또는 끝에 삽입)
      editor.chain().focus().insertContent(insertContent).run();
      lastInsertedRef.current = insertContent;
      onInsertComplete?.();
    }
  }, [editor, insertContent, onInsertComplete]);

  // 외부에서 이미지 삽입 요청 시 처리
  useEffect(() => {
    if (editor && insertImage && insertImage !== lastInsertedImageRef.current) {
      // 이미지를 에디터에 삽입
      editor.chain().focus().setImage({ src: insertImage }).run();
      lastInsertedImageRef.current = insertImage;
      onInsertImageComplete?.();
    }
  }, [editor, insertImage, onInsertImageComplete]);

  return (
    <div className={cn('border rounded-lg bg-background flex flex-col', className)}>
      {editable && <MenuBar editor={editor} />}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// 읽기 전용 뷰어 컴포넌트
export function RichViewer({ content, className }: { content: string; className?: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2],
        },
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Underline.extend({ name: 'customUnderline' }).configure({
        HTMLAttributes: {
          class: 'underline',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-2',
        },
      }),
    ],
    content,
    editable: false,
  });

  return (
    <div className={cn(
      'prose prose-sm max-w-none',
      'prose-headings:font-bold prose-headings:text-foreground',
      'prose-p:text-foreground prose-p:leading-relaxed prose-p:my-1',
      'prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground',
      'prose-strong:text-foreground prose-strong:font-bold',
      'prose-ul:list-disc prose-ol:list-decimal',
      'prose-li:text-foreground',
      '[&_mark]:bg-yellow-200 [&_mark]:text-foreground',
      className
    )}>
      <EditorContent editor={editor} />
    </div>
  );
}

// HTML에서 빈 앵커 태그 정리 (링크 텍스트가 없거나 빈 공백만 있는 경우)
function cleanEmptyAnchors(html: string): string {
  if (!html) return html;
  // 빈 앵커 태그 제거: <a href="..."></a> 또는 <a href="...">   </a> (공백만)
  return html.replace(/<a\s+[^>]*href=["'][^"']*["'][^>]*>\s*<\/a>/gi, '');
}

// 유튜브 링크를 임베드로 변환하는 뷰어 컴포넌트
export function RichViewerWithEmbed({ content, className }: { content: string; className?: string }) {
  // 빈 앵커 태그 정리
  const cleanedContent = cleanEmptyAnchors(content);

  // HTML에서 유튜브 URL 추출 (실제 표시되는 링크만)
  const extractYoutubeUrls = (html: string): { url: string; videoId: string }[] => {
    const urls: { url: string; videoId: string }[] = [];

    // href 속성에서 유튜브 URL 추출 - 단, 앵커 태그에 내용이 있는 경우만
    // <a href="youtube.com/...">텍스트</a> 형태만 매칭
    const anchorPattern = /<a\s+[^>]*href=["'](https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    let match;
    while ((match = anchorPattern.exec(html)) !== null) {
      const linkText = match[2]?.trim();
      // 링크 텍스트가 있는 경우만 유효한 유튜브 링크로 처리
      if (linkText && linkText.length > 0) {
        const videoId = extractYoutubeId(match[1]);
        if (videoId) {
          urls.push({ url: match[1], videoId });
        }
      }
    }

    // 일반 텍스트에서 유튜브 URL 추출 (앵커 태그 밖의 URL)
    const textPattern = /(?:^|[^"'])((https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^\s<"']+|youtu\.be\/[a-zA-Z0-9_-]+[^\s<"']*)))/gi;
    while ((match = textPattern.exec(html)) !== null) {
      const videoId = extractYoutubeId(match[1]);
      if (videoId && !urls.some(u => u.videoId === videoId)) {
        urls.push({ url: match[1], videoId });
      }
    }

    return urls;
  };

  const youtubeVideos = extractYoutubeUrls(cleanedContent);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2],
        },
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Underline.extend({ name: 'customUnderline' }).configure({
        HTMLAttributes: {
          class: 'underline',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-2',
        },
      }),
    ],
    content: cleanedContent,  // 빈 앵커 태그 정리된 콘텐츠 사용
    editable: false,
  });

  return (
    <div className={cn('space-y-3', className)}>
      <div className={cn(
        'prose prose-sm max-w-none',
        'prose-headings:font-bold prose-headings:text-foreground',
        'prose-p:text-foreground prose-p:leading-relaxed prose-p:my-1',
        'prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground',
        'prose-strong:text-foreground prose-strong:font-bold',
        'prose-ul:list-disc prose-ol:list-decimal',
        'prose-li:text-foreground',
        '[&_mark]:bg-yellow-200 [&_mark]:text-foreground',
      )}>
        <EditorContent editor={editor} />
      </div>

      {/* 유튜브 임베드 */}
      {youtubeVideos.length > 0 && (
        <div className="space-y-2">
          {youtubeVideos.map(({ videoId }, index) => (
            <YoutubeEmbed key={`${videoId}-${index}`} videoId={videoId} />
          ))}
        </div>
      )}
    </div>
  );
}

// 유튜브 임베드 컴포넌트 (바로 영상 표시)
function YoutubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="aspect-video rounded-lg overflow-hidden">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

// HTML 콘텐츠를 일반 텍스트로 변환 (검색용)
export function htmlToPlainText(html: string): string {
  // 서버사이드에서는 간단한 정규식으로 처리
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]*>/g, '');
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

// 빈 콘텐츠인지 확인
export function isEmptyContent(html: string): boolean {
  const plainText = htmlToPlainText(html);
  return !plainText.trim();
}

// HTML에서 이미지 src 추출
export function extractImagesFromHtml(html: string): string[] {
  if (typeof window === 'undefined') {
    // 서버사이드에서는 정규식으로 처리
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    const matches: string[] = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img');
  return Array.from(images).map(img => img.src);
}

// HTML에서 이미지 태그 제거
export function removeImagesFromHtml(html: string): string {
  return html.replace(/<img[^>]*>/gi, '');
}
