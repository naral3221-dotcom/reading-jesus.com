'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { QTDailyContent } from '@/types';
import { loadQTData } from '@/lib/qt-content';
import { QTCard } from '@/components/qt';
import { Calendar, BookOpen, Loader2 } from 'lucide-react';
import { ChurchLayout } from '@/components/church/ChurchLayout';
import { SplitViewProvider } from '@/contexts/SplitViewContext';
import { getTodayDateString } from '@/lib/date-utils';

export default function ChurchQTListPage() {
  const params = useParams();
  const churchCode = params.code as string;

  const [qtList, setQtList] = useState<QTDailyContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const data = await loadQTData();
      setQtList(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  // 오늘 날짜
  const today = getTodayDateString();

  if (loading) {
    return (
      <SplitViewProvider>
        <ChurchLayout churchCode={churchCode}>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        </ChurchLayout>
      </SplitViewProvider>
    );
  }

  return (
    <SplitViewProvider>
      <ChurchLayout churchCode={churchCode}>
        <div className="min-h-screen bg-gray-50">
          {/* 헤더 */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-lg mx-auto px-4 py-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-accent" />
                  1월 QT 묵상
                </h1>
                <p className="text-sm text-gray-500">
                  창세기 ~ 출애굽기 (2026년 1월)
                </p>
              </div>
            </div>
          </div>

          {/* QT 목록 */}
          <div className="max-w-lg mx-auto px-4 py-6 space-y-3 pb-24">
            {/* 주간 그룹 */}
            {(() => {
              // 주차별로 그룹화
              const weeks: { [key: string]: QTDailyContent[] } = {};
              qtList.forEach(qt => {
                const weekNum = Math.ceil(qt.day / 7);
                const weekKey = `${weekNum}주차`;
                if (!weeks[weekKey]) weeks[weekKey] = [];
                weeks[weekKey].push(qt);
              });

              return Object.entries(weeks).map(([weekName, qts]) => (
                <div key={weekName} className="space-y-2">
                  <div className="flex items-center gap-2 py-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <h2 className="text-sm font-semibold text-gray-600">{weekName}</h2>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  {qts.map(qt => (
                    <QTCard
                      key={qt.date}
                      qt={qt}
                      href={`/church/${churchCode}/qt/${qt.date}`}
                      churchCode={churchCode}
                      isToday={qt.date === today}
                    />
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>
      </ChurchLayout>
    </SplitViewProvider>
  );
}
