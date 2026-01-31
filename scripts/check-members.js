const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local 파싱
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('=== 테스트 데이터 정리 & 스키마 확인 ===\n');

  // 테스트 데이터 삭제
  const r1 = await supabase.from('church_qt_posts').delete().ilike('my_sentence', '%[TEST]%').select('id');
  console.log('church_qt_posts 삭제:', r1.data?.length || 0, '개');

  const r2 = await supabase.from('guest_comments').delete().ilike('content', '%[TEST]%').select('id');
  console.log('guest_comments 삭제:', r2.data?.length || 0, '개');

  const r2b = await supabase.from('unified_meditations').delete().ilike('content', '%[TEST]%').select('id');
  console.log('unified_meditations 삭제:', r2b.data?.length || 0, '개');

  // unified_meditations 스키마 확인
  console.log('\n=== unified_meditations 스키마 ===');
  const r3 = await supabase.from('unified_meditations').select('*').limit(1);
  if (r3.data && r3.data[0]) {
    console.log('컬럼:', Object.keys(r3.data[0]).join(', '));
  } else if (r3.error) {
    console.log('에러:', r3.error.message);
  }

  // visibility 분포 확인
  console.log('\n=== 현재 Visibility 분포 ===');

  const tables = ['church_qt_posts', 'guest_comments', 'unified_meditations'];
  for (const table of tables) {
    const { data } = await supabase.from(table).select('visibility');
    if (data && data.length > 0) {
      const dist = {};
      data.forEach(d => {
        const v = d.visibility || 'null';
        dist[v] = (dist[v] || 0) + 1;
      });
      console.log(table + ':', JSON.stringify(dist));
    }
  }
}

main().catch(console.error);
