'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import {
  Loader2,
  Database,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Edit,
  Copy,
  Check,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// 테이블 목록 정의 (orderBy: 정렬에 사용할 컬럼)
const TABLES = [
  { name: 'profiles', label: '프로필', description: '사용자 프로필 정보', orderBy: 'created_at' },
  { name: 'groups', label: '그룹', description: '성경 읽기 그룹', orderBy: 'created_at' },
  { name: 'group_members', label: '그룹 멤버', description: '그룹 멤버십', orderBy: 'joined_at' },
  { name: 'group_notices', label: '그룹 공지', description: '그룹 공지사항', orderBy: 'created_at' },
  { name: 'group_meetings', label: '그룹 모임', description: '그룹 모임 일정', orderBy: 'created_at' },
  { name: 'comments', label: '댓글', description: '그룹 댓글', orderBy: 'created_at' },
  { name: 'comment_replies', label: '댓글 답글', description: '댓글에 대한 답글', orderBy: 'created_at' },
  { name: 'comment_likes', label: '댓글 좋아요', description: '댓글 좋아요', orderBy: 'id' },
  { name: 'churches', label: '교회', description: '등록된 교회', orderBy: 'created_at' },
  { name: 'guest_comments', label: '방명록', description: '교회 방명록', orderBy: 'created_at' },
  { name: 'notifications', label: '알림', description: '사용자 알림', orderBy: 'created_at' },
  { name: 'notification_settings', label: '알림 설정', description: '알림 설정', orderBy: 'id' },
  { name: 'daily_checks', label: '일일 체크', description: '그룹 읽기 체크', orderBy: 'checked_at' },
  { name: 'personal_daily_checks', label: '개인 일일 체크', description: '개인 읽기 체크', orderBy: 'checked_at' },
  { name: 'personal_reading_projects', label: '개인 프로젝트', description: '개인 읽기 프로젝트', orderBy: 'created_at' },
  { name: 'qt_posts', label: 'QT 게시글', description: 'QT 나눔 게시글', orderBy: 'created_at' },
  { name: 'draft_posts', label: '임시저장', description: '임시저장 글', orderBy: 'created_at' },
  { name: 'member_ranks', label: '멤버 등급', description: '그룹 멤버 등급', orderBy: 'created_at' },
  { name: 'reports', label: '신고', description: '신고 내역', orderBy: 'created_at' },
  { name: 'audit_logs', label: '감사 로그', description: '시스템 감사 로그', orderBy: 'created_at' },
  { name: 'system_settings', label: '시스템 설정', description: '시스템 설정값', orderBy: 'id' },
];

const ITEMS_PER_PAGE = 20;

// DB 테이블 동적 조회를 위한 타입 (관리자 페이지 전용)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TableData = Record<string, any>

export default function DatabasePage() {
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState<string>('profiles');
  const [data, setData] = useState<TableData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // 상세 보기 다이얼로그
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TableData | null>(null);

  // 수정 다이얼로그
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<TableData | null>(null);
  const [saving, setSaving] = useState(false);

  // 삭제 다이얼로그
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TableData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 복사 상태
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 데이터 로드
  const loadData = useCallback(async () => {
    if (!selectedTable) return;

    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    try {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // 테이블별 정렬 컬럼 가져오기
      const tableConfig = TABLES.find(t => t.name === selectedTable);
      const orderByColumn = tableConfig?.orderBy || 'id';

      let query = supabase
        .from(selectedTable)
        .select('*', { count: 'exact' })
        .order(orderByColumn, { ascending: false })
        .range(from, to);

      // 검색 필터 (id 또는 문자열 필드)
      if (searchQuery) {
        // 간단한 텍스트 검색 (id 기준)
        query = query.or(`id.eq.${searchQuery}`);
      }

      const { data: result, error, count } = await query;

      if (error) throw error;

      if (result && result.length > 0) {
        setColumns(Object.keys(result[0]));
      } else {
        // 테이블 구조만 가져오기
        const { data: schemaData } = await supabase
          .from(selectedTable)
          .select('*')
          .limit(0);

        if (schemaData) {
          setColumns([]);
        }
      }

      setData(result || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Load data error:', err);
      toast({
        variant: 'error',
        title: '데이터를 불러올 수 없습니다',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedTable, currentPage, searchQuery, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 테이블 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
  }, [selectedTable]);

  // 데이터 수정
  const handleSave = async () => {
    if (!editData || !selectedTable) return;

    const supabase = getSupabaseBrowserClient();
    setSaving(true);
    try {
      const { error } = await supabase
        .from(selectedTable)
        .update(editData)
        .eq('id', editData.id);

      if (error) throw error;

      toast({
        variant: 'success',
        title: '저장되었습니다',
      });

      setEditDialogOpen(false);
      setEditData(null);
      loadData();
    } catch (err) {
      console.error('Save error:', err);
      toast({
        variant: 'error',
        title: '저장 실패',
      });
    } finally {
      setSaving(false);
    }
  };

  // 데이터 삭제 (API 라우트 사용 - Service Role로 RLS 우회)
  const handleDelete = async () => {
    if (!deleteTarget || !selectedTable) return;

    setDeleting(true);
    try {
      const response = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          id: deleteTarget.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '삭제 실패');
      }

      toast({
        variant: 'success',
        title: '삭제되었습니다',
      });

      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      toast({
        variant: 'error',
        title: '삭제 실패',
        description: errorMessage,
      });
    } finally {
      setDeleting(false);
    }
  };

  // 클립보드 복사
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({
        variant: 'error',
        title: '복사 실패',
      });
    }
  };

  // 값 포맷팅
  const formatValue = (value: unknown, maxLength = 50): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (typeof value === 'object') return JSON.stringify(value).slice(0, maxLength);
    const str = String(value);
    return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
  };

  // 날짜 포맷팅
  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleString('ko-KR');
    } catch {
      return value;
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const tableInfo = TABLES.find(t => t.name === selectedTable);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="w-6 h-6" />
          데이터베이스 관리
        </h1>
        <p className="text-muted-foreground">데이터 테이블을 조회하고 관리합니다</p>
      </div>

      {/* 테이블 선택 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">테이블 선택</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TABLES.map((table) => (
              <Button
                key={table.name}
                variant={selectedTable === table.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTable(table.name)}
              >
                {table.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 데이터 테이블 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{tableInfo?.label || selectedTable}</CardTitle>
              <CardDescription>
                {tableInfo?.description} • 총 {totalCount.toLocaleString()}개
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ID로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Button variant="outline" size="icon" onClick={loadData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              데이터가 없습니다
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.slice(0, 6).map((col) => (
                        <TableHead key={col} className="whitespace-nowrap">
                          {col}
                        </TableHead>
                      ))}
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, idx) => (
                      <TableRow key={row.id || idx}>
                        {columns.slice(0, 6).map((col) => (
                          <TableCell key={col} className="max-w-[200px] truncate">
                            {col.includes('_at') || col.includes('date')
                              ? formatDate(row[col])
                              : formatValue(row[col])}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedRow(row);
                                setDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditData({ ...row });
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                setDeleteTarget(row);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>상세 정보</DialogTitle>
          </DialogHeader>
          {selectedRow && (
            <div className="space-y-3">
              {Object.entries(selectedRow).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <Label className="w-32 shrink-0 text-muted-foreground">{key}</Label>
                  <div className="flex-1 flex items-start gap-2">
                    <code className="text-sm bg-muted p-2 rounded flex-1 break-all">
                      {typeof value === 'object'
                        ? JSON.stringify(value, null, 2)
                        : String(value ?? '-')}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copyToClipboard(String(value ?? ''), key)}
                    >
                      {copiedField === key ? (
                        <Check className="w-3 h-3 text-accent" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>데이터 수정</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="space-y-4">
              {Object.entries(editData).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label>{key}</Label>
                  {key === 'id' || key.includes('_at') ? (
                    <Input
                      value={String(value ?? '')}
                      disabled
                      className="bg-muted"
                    />
                  ) : typeof value === 'object' ? (
                    <Textarea
                      value={JSON.stringify(value, null, 2)}
                      onChange={(e) => {
                        try {
                          setEditData({
                            ...editData,
                            [key]: JSON.parse(e.target.value),
                          });
                        } catch {
                          // JSON 파싱 실패 시 문자열로 유지
                        }
                      }}
                      rows={4}
                    />
                  ) : typeof value === 'boolean' ? (
                    <Select
                      value={String(value)}
                      onValueChange={(v) =>
                        setEditData({ ...editData, [key]: v === 'true' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">true</SelectItem>
                        <SelectItem value="false">false</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={String(value ?? '')}
                      onChange={(e) =>
                        setEditData({ ...editData, [key]: e.target.value })
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>삭제 확인</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            이 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
          {deleteTarget && (
            <code className="text-xs bg-muted p-2 rounded block">
              ID: {deleteTarget.id}
            </code>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
