import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';

/**
 * localStorage에 저장된 교회 읽기 체크 데이터를 Supabase로 마이그레이션
 */
export async function migrateLocalStorageToCloud(
  userId: string,
  churchId: string,
  churchCode: string
): Promise<{ success: boolean; migratedCount: number }> {
  const localKey = `church_${churchCode}_checked_days`;
  const saved = localStorage.getItem(localKey);

  if (!saved) {
    return { success: true, migratedCount: 0 };
  }

  try {
    const parsed = JSON.parse(saved);
    const dayNumbers = Object.keys(parsed)
      .map((k) => parseInt(k))
      .filter((n) => !isNaN(n));

    if (dayNumbers.length === 0) {
      return { success: true, migratedCount: 0 };
    }

    // 배치로 upsert
    const records = dayNumbers.map((dayNumber) => ({
      user_id: userId,
      church_id: churchId,
      day_number: dayNumber,
    }));

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('church_reading_checks')
      .upsert(records, { onConflict: 'user_id,church_id,day_number' });

    if (error) {
      console.error('마이그레이션 에러:', error);
      return { success: false, migratedCount: 0 };
    }

    // 마이그레이션 완료 표시 (로컬 데이터는 유지하되 마이그레이션 완료 플래그 추가)
    localStorage.setItem(
      `${localKey}_migrated`,
      new Date().toISOString()
    );

    return { success: true, migratedCount: dayNumbers.length };
  } catch (error) {
    console.error('마이그레이션 파싱 에러:', error);
    return { success: false, migratedCount: 0 };
  }
}

/**
 * 마이그레이션 필요 여부 확인
 */
export function needsMigration(churchCode: string): boolean {
  const localKey = `church_${churchCode}_checked_days`;
  const saved = localStorage.getItem(localKey);
  const migrated = localStorage.getItem(`${localKey}_migrated`);

  // 로컬 데이터가 있고 아직 마이그레이션되지 않은 경우
  return !!saved && !migrated;
}

/**
 * 로컬 스토리지에서 게스트 이름 가져오기
 */
export function getGuestName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('guest_name') || '';
}

/**
 * 디바이스 ID 가져오기 (없으면 생성)
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';

  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}
