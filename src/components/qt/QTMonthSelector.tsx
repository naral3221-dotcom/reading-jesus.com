'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type QTMonthInfo } from '@/lib/qt-content';
import { CalendarDays } from 'lucide-react';

interface QTMonthSelectorProps {
  selectedYear: number;
  selectedMonth: number;
  onMonthChange: (year: number, month: number) => void;
  availableMonths: QTMonthInfo[];
  className?: string;
}

export function QTMonthSelector({
  selectedYear,
  selectedMonth,
  onMonthChange,
  availableMonths,
  className,
}: QTMonthSelectorProps) {
  const selectedValue = `${selectedYear}-${selectedMonth}`;

  const handleValueChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month)) {
      onMonthChange(year, month);
    }
  };

  // 현재 선택된 월의 표시 이름 찾기
  const selectedMonthInfo = availableMonths.find(
    (m) => m.year === selectedYear && m.month === selectedMonth
  );

  return (
    <Select value={selectedValue} onValueChange={handleValueChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <SelectValue>
            {selectedMonthInfo?.displayName || `${selectedYear}년 ${selectedMonth}월`}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {availableMonths.map((m) => (
          <SelectItem
            key={`${m.year}-${m.month}`}
            value={`${m.year}-${m.month}`}
            disabled={!m.available}
          >
            {m.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default QTMonthSelector;
