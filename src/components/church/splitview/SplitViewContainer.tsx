'use client';

import { useRef } from 'react';
import { useSplitViewContext } from '@/contexts/SplitViewContext';
import { SplitViewPanel } from './SplitViewPanel';
import { SplitViewDivider } from './SplitViewDivider';

interface SplitViewContainerProps {
  churchCode: string;
}

export function SplitViewContainer({ churchCode }: SplitViewContainerProps) {
  const { state } = useSplitViewContext();
  const containerRef = useRef<HTMLDivElement>(null);

  if (!state.isEnabled || !state.leftMenu || !state.rightMenu) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="flex h-screen w-full"
    >
      {/* 왼쪽 패널 */}
      <SplitViewPanel
        position="left"
        menuType={state.leftMenu}
        churchCode={churchCode}
        style={{ width: `${state.splitRatio}%` }}
      />

      {/* 분할선 */}
      <SplitViewDivider containerRef={containerRef} />

      {/* 오른쪽 패널 */}
      <SplitViewPanel
        position="right"
        menuType={state.rightMenu}
        churchCode={churchCode}
        style={{ width: `${100 - state.splitRatio}%` }}
      />
    </div>
  );
}
