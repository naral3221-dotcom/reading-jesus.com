'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ListSkeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/toast';
import dynamic from 'next/dynamic';

// TipTap 에디터 동적 로드 (번들 최적화)
const RichEditor = dynamic(
  () => import('@/components/ui/rich-editor').then(mod => mod.RichEditor),
  { ssr: false, loading: () => <div className="h-[150px] border rounded-lg bg-muted/30 animate-pulse" /> }
);
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Pencil,
  Trash2,
  Plus,
  HelpCircle,
  Calendar,
  User,
  MessageCircle,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { QTPostWithAuthor, ReadingPlan } from '@/types';
import readingPlan from '@/data/reading_plan.json';
import { useGroupCompat } from '@/presentation/hooks/stores/useGroupStore';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useIsGroupAdmin } from '@/presentation/hooks/queries/useGroup';

export default function QTPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { activeGroup } = useGroupCompat();
  const dayNumber = parseInt(params.day as string) || 1;

  // 사용자 정보 (React Query)
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const userId = userData?.user?.id ?? null;

  // 관리자 여부 (React Query)
  const { isAdmin } = useIsGroupAdmin(activeGroup?.id ?? null, userId);

  const [loading, setLoading] = useState(true);
  const [qtPost, setQtPost] = useState<QTPostWithAuthor | null>(null);

  // 편집 모달
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    questions: ['', '', ''],
  });

  // 오늘의 읽기 계획
  const todayPlan: ReadingPlan | undefined = (readingPlan as ReadingPlan[])[dayNumber - 1];

  // QT 게시글 로드 (사용자/관리자 정보는 이미 훅으로 가져옴)
  const loadQTPost = useCallback(async () => {
    if (!activeGroup || userLoading) {
      if (!userLoading && !activeGroup) setLoading(false);
      return;
    }

    // 로그인 확인
    if (!userId) {
      router.push('/login');
      return;
    }

    const supabase = getSupabaseBrowserClient();

    // QT 게시글 조회
    const { data: qtData } = await supabase
      .from('qt_posts')
      .select('*')
      .eq('group_id', activeGroup.id)
      .eq('day_number', dayNumber)
      .maybeSingle();

    if (qtData) {
      // author 정보를 별도로 조회
      let author = null;
      if (qtData.author_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, avatar_url')
          .eq('id', qtData.author_id)
          .maybeSingle();
        author = profile;
      }
      setQtPost({
        ...qtData,
        author: author as { nickname: string | null; avatar_url: string | null } | null,
      });
    } else {
      setQtPost(null);
    }

    setLoading(false);
  }, [activeGroup, dayNumber, router, userId, userLoading]);

  useEffect(() => {
    loadQTPost();
  }, [loadQTPost]);

  const openCreateDialog = () => {
    setFormData({
      title: `Day ${dayNumber} QT`,
      content: '',
      questions: ['', '', ''],
    });
    setEditDialog(true);
  };

  const openEditDialog = () => {
    if (qtPost) {
      setFormData({
        title: qtPost.title,
        content: qtPost.content,
        questions: qtPost.questions.length > 0 ? [...qtPost.questions, '', '', ''].slice(0, 3) : ['', '', ''],
      });
      setEditDialog(true);
    }
  };

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = async () => {
    if (!activeGroup || !userId) return;

    if (!formData.title.trim()) {
      toast({ variant: 'error', title: '제목을 입력하세요' });
      return;
    }
    if (!formData.content.trim()) {
      toast({ variant: 'error', title: '내용을 입력하세요' });
      return;
    }

    setSubmitting(true);

    const supabase = getSupabaseBrowserClient();
    const questions = formData.questions.filter(q => q.trim() !== '');

    try {
      if (qtPost) {
        // 수정
        const { error } = await supabase
          .from('qt_posts')
          .update({
            title: formData.title.trim(),
            content: formData.content,
            questions,
          })
          .eq('id', qtPost.id);

        if (error) throw error;

        toast({ variant: 'success', title: 'QT가 수정되었습니다' });
      } else {
        // 생성
        const { error } = await supabase
          .from('qt_posts')
          .insert({
            group_id: activeGroup.id,
            author_id: userId,
            day_number: dayNumber,
            title: formData.title.trim(),
            content: formData.content,
            questions,
          });

        if (error) throw error;

        toast({ variant: 'success', title: 'QT가 등록되었습니다' });
      }

      setEditDialog(false);
      loadQTPost();
    } catch (err) {
      console.error('QT 저장 실패:', err);
      toast({ variant: 'error', title: '저장에 실패했습니다', description: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!qtPost) return;

    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('qt_posts')
        .delete()
        .eq('id', qtPost.id);

      if (error) throw error;

      toast({ variant: 'success', title: 'QT가 삭제되었습니다' });
      setDeleteDialog(false);
      setQtPost(null);
    } catch {
      toast({ variant: 'error', title: '삭제에 실패했습니다' });
    }
  };

  const goToDay = (day: number) => {
    if (day >= 1 && day <= readingPlan.length) {
      router.push(`/qt/${day}`);
    }
  };

  if (!activeGroup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium mb-2">그룹을 선택해주세요</h2>
        <p className="text-sm text-muted-foreground mb-4">
          QT를 보려면 활성 그룹이 필요합니다
        </p>
        <Link href="/group">
          <Button>그룹 선택하기</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="h-7 w-40 bg-muted rounded animate-pulse" />
        </div>
        <ListSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/bible">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Day {dayNumber} QT</h1>
            <p className="text-sm text-muted-foreground">{activeGroup.name}</p>
          </div>
        </div>

        {/* Day 이동 */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToDay(dayNumber - 1)}
            disabled={dayNumber <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium w-12 text-center">
            {dayNumber}/{readingPlan.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToDay(dayNumber + 1)}
            disabled={dayNumber >= readingPlan.length}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 오늘의 읽기 범위 */}
      {todayPlan && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>{todayPlan.display_date}</span>
                </div>
                <p className="font-medium">{todayPlan.range}</p>
                {todayPlan.reading && (
                  <p className="text-sm text-muted-foreground mt-1">{todayPlan.reading}</p>
                )}
              </div>
              <Link href={`/bible-reader?day=${dayNumber}`}>
                <Button size="sm" variant="outline">
                  <BookOpen className="w-4 h-4 mr-2" />
                  성경 읽기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QT 내용 */}
      {qtPost ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{qtPost.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={qtPost.author?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {qtPost.author?.nickname?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span>{qtPost.author?.nickname || '알 수 없음'}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{format(new Date(qtPost.updated_at), 'M월 d일', { locale: ko })}</span>
                </CardDescription>
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openEditDialog}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 본문 */}
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: qtPost.content }}
            />

            {/* QT 질문 */}
            {qtPost.questions.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium flex items-center gap-2 mb-3">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  나눔 질문
                </h3>
                <ul className="space-y-3">
                  {qtPost.questions.map((question, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <p className="text-sm pt-0.5">{question}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              아직 등록된 QT가 없습니다
            </p>
            {isAdmin && (
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                QT 작성하기
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 묵상 나눔 바로가기 */}
      <Card>
        <CardContent className="pt-4">
          <Link href={`/community?day=${dayNumber}`} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Day {dayNumber} 묵상 나눔</p>
                <p className="text-sm text-muted-foreground">다른 멤버들의 묵상을 읽어보세요</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      {/* QT 작성/수정 다이얼로그 */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{qtPost ? 'QT 수정' : 'QT 작성'}</DialogTitle>
            <DialogDescription>
              Day {dayNumber}에 대한 QT를 작성하세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">제목 *</label>
              <Input
                placeholder="QT 제목"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">내용 *</label>
              <RichEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="QT 내용을 작성하세요"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                나눔 질문 (선택)
              </label>
              <div className="space-y-2">
                {formData.questions.map((question, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground text-sm flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <Input
                      placeholder={`질문 ${index + 1}`}
                      value={question}
                      onChange={(e) => handleQuestionChange(index, e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                멤버들이 함께 나눌 수 있는 질문을 작성하세요
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)} disabled={submitting}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>QT 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 QT를 삭제하시겠습니까? 삭제된 내용은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
