'use client';

import { useRef } from 'react';
import { useMainSplitViewContext } from '@/contexts/MainSplitViewContext';
import { MainSplitViewPanel } from './MainSplitViewPanel';
import { MainSplitViewDivider } from './MainSplitViewDivider';

export function MainSplitViewContainer() {
  const { state } = useMainSplitViewContext();
  const containerRef = useRef<HTMLDivElement>(null);

  if (!state.isEnabled || !state.leftMenu || !state.rightMenu) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex z-50 bg-background lg:left-48"
    >
      {/* 왼쪽 패널 */}
      <MainSplitViewPanel
        position="left"
        menuType={state.leftMenu}
        style={{ width: `${state.splitRatio}%` }}
      />

      {/* 분할선 */}
      <MainSplitViewDivider containerRef={containerRef} />

      {/* 오른쪽 패널 */}
      <MainSplitViewPanel
        position="right"
        menuType={state.rightMenu}
        style={{ width: `${100 - state.splitRatio}%` }}
      />
    </div>
  );
}
