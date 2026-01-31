/**
 * 사용자 여정 시뮬레이션
 *
 * 사용자 유형:
 * 1. 교회 + 그룹 소속
 * 2. 교회만 소속
 * 3. 그룹만 소속
 * 4. 미소속 (로그인만 한 상태)
 *
 * 글 작성 경로:
 * 1. 홈 페이지 묵상 (InlineMeditationForm) → public_meditations
 * 2. 개인 묵상 (PersonalMeditationEditor) → public_meditations
 * 3. 교회 공유 페이지 - 묵상 → guest_comments
 * 4. 교회 공유 페이지 - QT → church_qt_posts
 * 5. 그룹 페이지 → unified_meditations (source_type: group)
 * 6. 교회 QT 페이지 → church_qt_posts
 *
 * 실행: npx tsx scripts/user-journey-simulation.ts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// .env.local 파싱
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env: Record<string, string> = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 사용자 유형 정의
interface UserProfile {
  id: string;
  nickname: string;
  church_id: string | null;
  groups: string[];  // group_ids
  type: 'church+group' | 'church-only' | 'group-only' | 'none';
}

// 글 작성 경로 정의
interface WritePath {
  name: string;
  table: string;
  requiredMembership: 'church' | 'group' | 'none';
  defaultVisibility: string;
  allowedVisibility: string[];
  description: string;
}

const WRITE_PATHS: WritePath[] = [
  {
    name: '홈 페이지 묵상',
    table: 'public_meditations',
    requiredMembership: 'none',
    defaultVisibility: 'public',
    allowedVisibility: ['private', 'public'],
    description: '로그인한 누구나 작성 가능, 기본 전체공개'
  },
  {
    name: '개인 묵상',
    table: 'public_meditations',
    requiredMembership: 'none',
    defaultVisibility: 'private',
    allowedVisibility: ['private', 'public'],
    description: '로그인한 누구나 작성 가능, 기본 비공개'
  },
  {
    name: '교회 공유 - 묵상',
    table: 'guest_comments',
    requiredMembership: 'church',
    defaultVisibility: 'church',
    allowedVisibility: ['private', 'church', 'public'],
    description: '교회 멤버만 작성 가능, 기본 교회공개'
  },
  {
    name: '교회 공유 - QT',
    table: 'church_qt_posts',
    requiredMembership: 'church',
    defaultVisibility: 'church',
    allowedVisibility: ['private', 'church', 'public'],
    description: '교회 멤버만 작성 가능, 기본 교회공개'
  },
  {
    name: '그룹 페이지 묵상',
    table: 'unified_meditations',
    requiredMembership: 'group',
    defaultVisibility: 'group',
    allowedVisibility: ['private', 'group', 'public'],
    description: '그룹 멤버만 작성 가능, 기본 그룹공개'
  },
  {
    name: '교회 QT 페이지',
    table: 'church_qt_posts',
    requiredMembership: 'church',
    defaultVisibility: 'church',
    allowedVisibility: ['private', 'church', 'public'],
    description: '교회 멤버만 작성 가능, 기본 교회공개'
  }
];

function log(title: string) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📋 ${title}`);
  console.log('='.repeat(70));
}

async function getTestUsers(): Promise<UserProfile[]> {
  // 모든 프로필
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nickname, church_id')
    .limit(100);

  // 그룹 멤버십
  const { data: groupMembers } = await supabase
    .from('group_members')
    .select('user_id, group_id');

  const userGroups = new Map<string, string[]>();
  groupMembers?.forEach(gm => {
    const groups = userGroups.get(gm.user_id) || [];
    groups.push(gm.group_id);
    userGroups.set(gm.user_id, groups);
  });

  // 사용자 유형별 분류
  const users: UserProfile[] = [];

  profiles?.forEach(p => {
    const hasChurch = !!p.church_id;
    const hasGroup = userGroups.has(p.id);
    const groups = userGroups.get(p.id) || [];

    let type: UserProfile['type'];
    if (hasChurch && hasGroup) type = 'church+group';
    else if (hasChurch) type = 'church-only';
    else if (hasGroup) type = 'group-only';
    else type = 'none';

    users.push({
      id: p.id,
      nickname: p.nickname || '(닉네임없음)',
      church_id: p.church_id,
      groups,
      type
    });
  });

  return users;
}

async function simulateWriteAccess(users: UserProfile[]) {
  log('1. 사용자 유형별 분포');

  const byType = {
    'church+group': users.filter(u => u.type === 'church+group'),
    'church-only': users.filter(u => u.type === 'church-only'),
    'group-only': users.filter(u => u.type === 'group-only'),
    'none': users.filter(u => u.type === 'none')
  };

  console.log(`\n교회+그룹 소속: ${byType['church+group'].length}명`);
  byType['church+group'].slice(0, 3).forEach(u => console.log(`  - ${u.nickname}`));

  console.log(`\n교회만 소속: ${byType['church-only'].length}명`);
  byType['church-only'].slice(0, 3).forEach(u => console.log(`  - ${u.nickname}`));

  console.log(`\n그룹만 소속: ${byType['group-only'].length}명`);
  byType['group-only'].slice(0, 3).forEach(u => console.log(`  - ${u.nickname}`));

  console.log(`\n미소속: ${byType['none'].length}명`);
  byType['none'].slice(0, 3).forEach(u => console.log(`  - ${u.nickname}`));

  return byType;
}

function simulateWritePermissions(byType: Record<string, UserProfile[]>) {
  log('2. 글 작성 경로별 접근 권한');

  const results: string[][] = [];
  results.push(['경로', '교회+그룹', '교회만', '그룹만', '미소속', '기본 공개범위']);

  WRITE_PATHS.forEach(path => {
    const row = [path.name];

    // 각 사용자 유형별 접근 가능 여부
    ['church+group', 'church-only', 'group-only', 'none'].forEach(userType => {
      let canAccess = false;

      if (path.requiredMembership === 'none') {
        canAccess = true;  // 로그인만 하면 됨
      } else if (path.requiredMembership === 'church') {
        canAccess = userType === 'church+group' || userType === 'church-only';
      } else if (path.requiredMembership === 'group') {
        canAccess = userType === 'church+group' || userType === 'group-only';
      }

      row.push(canAccess ? '✅ 가능' : '❌ 불가');
    });

    row.push(path.defaultVisibility);
    results.push(row);
  });

  // 테이블 출력
  console.log('\n');
  results.forEach((row, i) => {
    if (i === 0) {
      console.log(`| ${row.join(' | ')} |`);
      console.log(`|${row.map(() => '---').join('|')}|`);
    } else {
      console.log(`| ${row.join(' | ')} |`);
    }
  });
}

async function simulateRealScenarios(byType: Record<string, UserProfile[]>) {
  log('3. 실제 시나리오 시뮬레이션');

  // 각 유형에서 1명씩 선택
  const testUsers = {
    churchAndGroup: byType['church+group'][0],
    churchOnly: byType['church-only'][0],
    groupOnly: byType['group-only'][0],
    none: byType['none'][0]
  };

  console.log('\n테스트 사용자:');
  console.log(`  교회+그룹: ${testUsers.churchAndGroup?.nickname || '없음'}`);
  console.log(`  교회만: ${testUsers.churchOnly?.nickname || '없음'}`);
  console.log(`  그룹만: ${testUsers.groupOnly?.nickname || '없음'}`);
  console.log(`  미소속: ${testUsers.none?.nickname || '없음'}`);

  // 시나리오 1: 교회+그룹 사용자가 모든 경로에서 글 작성
  if (testUsers.churchAndGroup) {
    console.log(`\n--- 시나리오 1: ${testUsers.churchAndGroup.nickname} (교회+그룹) ---`);
    console.log('접근 가능 경로:');
    WRITE_PATHS.forEach(p => {
      const canAccess = p.requiredMembership === 'none' ||
        (p.requiredMembership === 'church' && testUsers.churchAndGroup.church_id) ||
        (p.requiredMembership === 'group' && testUsers.churchAndGroup.groups.length > 0);
      console.log(`  ${canAccess ? '✅' : '❌'} ${p.name} → ${p.table} (${p.allowedVisibility.join('/')})`);
    });
  }

  // 시나리오 2: 그룹만 사용자
  if (testUsers.groupOnly) {
    console.log(`\n--- 시나리오 2: ${testUsers.groupOnly.nickname} (그룹만) ---`);
    console.log('접근 가능 경로:');
    WRITE_PATHS.forEach(p => {
      const canAccess = p.requiredMembership === 'none' ||
        (p.requiredMembership === 'group' && testUsers.groupOnly.groups.length > 0);
      console.log(`  ${canAccess ? '✅' : '❌'} ${p.name} → ${p.table}`);
      if (canAccess) {
        console.log(`      선택 가능한 공개 범위: ${p.allowedVisibility.join(', ')}`);
      }
    });
  }

  // 시나리오 3: 미소속 사용자
  if (testUsers.none) {
    console.log(`\n--- 시나리오 3: ${testUsers.none.nickname} (미소속) ---`);
    console.log('접근 가능 경로:');
    WRITE_PATHS.forEach(p => {
      const canAccess = p.requiredMembership === 'none';
      console.log(`  ${canAccess ? '✅' : '❌'} ${p.name} → ${p.table}`);
      if (canAccess) {
        console.log(`      선택 가능한 공개 범위: ${p.allowedVisibility.join(', ')}`);
      }
    });
  }
}

async function simulateVisibilityFlow() {
  log('4. Visibility 데이터 흐름');

  console.log(`
┌─────────────────────────────────────────────────────────────────────────┐
│                        사용자가 글 작성 시                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [홈 페이지 묵상]                                                        │
│  └→ InlineMeditationForm                                                │
│     └→ visibility: private | public (기본: public)                      │
│     └→ 저장: public_meditations 테이블                                   │
│                                                                         │
│  [개인 묵상]                                                             │
│  └→ PersonalMeditationEditor                                            │
│     └→ visibility: private | public (기본: private)                     │
│     └→ 저장: public_meditations 테이블                                   │
│                                                                         │
│  [교회 공유 페이지 - 묵상]                                                │
│  └→ sharing/page.tsx (handleSubmitMeditation)                           │
│     └→ visibility: private | church | public (기본: church)             │
│     └→ 저장: guest_comments 테이블                                       │
│                                                                         │
│  [교회 공유 페이지 - QT]                                                  │
│  └→ sharing/page.tsx (handleSubmitQt)                                   │
│     └→ visibility: private | church | public (기본: church)             │
│     └→ 저장: church_qt_posts 테이블                                      │
│                                                                         │
│  [그룹 페이지]                                                           │
│  └→ group/[id]/page.tsx                                                 │
│     └→ visibility: private | group | public (기본: group)               │
│     └→ 저장: unified_meditations 테이블 (source_type: 'group')          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
`);
}

async function simulateFeedVisibility() {
  log('5. 피드에서 글 조회 시 Visibility 적용');

  console.log(`
┌─────────────────────────────────────────────────────────────────────────┐
│                         피드 조회 시 RLS 규칙                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  visibility = 'public'                                                  │
│  └→ 모든 사용자가 조회 가능                                              │
│                                                                         │
│  visibility = 'church'                                                  │
│  └→ 같은 교회 멤버만 조회 가능                                           │
│     (profiles.church_id = 글의 church_id인 경우)                        │
│                                                                         │
│  visibility = 'group'                                                   │
│  └→ 같은 그룹 멤버만 조회 가능                                           │
│     (group_members에 user_id + group_id가 있는 경우)                    │
│                                                                         │
│  visibility = 'private'                                                 │
│  └→ 작성자 본인만 조회 가능                                              │
│     (user_id = auth.uid()인 경우)                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

예시 시나리오:

  김도균 (교회+그룹 소속)이 교회 공유 페이지에서 묵상 작성
  └→ visibility: 'church' 선택
  └→ guest_comments 테이블에 저장
  └→ 같은 교회 멤버인 이대연, 현진 등 34명이 조회 가능
  └→ 다른 교회 멤버나 미소속 사용자는 조회 불가

  박경원 (그룹만 소속)이 그룹 페이지에서 묵상 작성
  └→ visibility: 'group' 선택
  └→ unified_meditations 테이블에 저장 (source_type: 'group')
  └→ 같은 그룹 멤버만 조회 가능
  └→ 다른 그룹 멤버나 교회 멤버는 조회 불가

  Minimini (미소속)가 홈 페이지에서 묵상 작성
  └→ visibility: 'public' 선택 (기본값)
  └→ public_meditations 테이블에 저장
  └→ 모든 로그인 사용자가 조회 가능

  Minimini (미소속)가 개인 묵상 작성
  └→ visibility: 'private' 선택 (기본값)
  └→ public_meditations 테이블에 저장
  └→ Minimini 본인만 조회 가능 (마이페이지에서)
`);
}

async function printAccessMatrix(byType: Record<string, UserProfile[]>) {
  log('6. 접근 권한 매트릭스 요약');

  console.log(`
┌──────────────────┬────────────┬────────────┬────────────┬────────────┐
│ 글 작성 경로      │ 교회+그룹  │ 교회만     │ 그룹만     │ 미소속     │
├──────────────────┼────────────┼────────────┼────────────┼────────────┤
│ 홈 페이지 묵상    │ ✅ 가능    │ ✅ 가능    │ ✅ 가능    │ ✅ 가능    │
│ 개인 묵상        │ ✅ 가능    │ ✅ 가능    │ ✅ 가능    │ ✅ 가능    │
│ 교회 공유-묵상    │ ✅ 가능    │ ✅ 가능    │ ❌ 불가    │ ❌ 불가    │
│ 교회 공유-QT     │ ✅ 가능    │ ✅ 가능    │ ❌ 불가    │ ❌ 불가    │
│ 그룹 페이지      │ ✅ 가능    │ ❌ 불가    │ ✅ 가능    │ ❌ 불가    │
│ 교회 QT 페이지   │ ✅ 가능    │ ✅ 가능    │ ❌ 불가    │ ❌ 불가    │
└──────────────────┴────────────┴────────────┴────────────┴────────────┘

사용자 수:
  교회+그룹: ${byType['church+group'].length}명
  교회만: ${byType['church-only'].length}명
  그룹만: ${byType['group-only'].length}명
  미소속: ${byType['none'].length}명
`);
}

async function main() {
  console.log('\n🎭 사용자 여정 시뮬레이션 시작\n');

  try {
    const users = await getTestUsers();
    const byType = await simulateWriteAccess(users);
    simulateWritePermissions(byType);
    await simulateRealScenarios(byType);
    await simulateVisibilityFlow();
    await simulateFeedVisibility();
    await printAccessMatrix(byType);
  } catch (error) {
    console.error('시뮬레이션 오류:', error);
  }

  console.log('\n🎭 시뮬레이션 완료\n');
}

main();
