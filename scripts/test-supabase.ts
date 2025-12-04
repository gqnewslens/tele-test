/**
 * Test Supabase connection
 * Usage: npx tsx scripts/test-supabase.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getSupabaseDB } from '../lib/supabase/client';

async function testConnection() {
  console.log('Testing Supabase connection...\n');

  const db = getSupabaseDB();

  // Test insert
  console.log('1. Testing insert...');
  try {
    const testPost = await db.insertPost({
      timestamp: new Date().toISOString(),
      channel: 'test_channel',
      message_id: Date.now(),
      category: 'Test',
      subcategory: 'Connection Test',
      text: 'This is a test message from Supabase connection test',
      media_type: undefined,
      link: 'https://example.com',
      media_link: undefined,
    });
    console.log('✅ Insert successful:', testPost.id);
  } catch (error) {
    console.error('❌ Insert failed:', error);
    return;
  }

  // Test fetch
  console.log('\n2. Testing fetch...');
  try {
    const posts = await db.getPosts(5);
    console.log('✅ Fetch successful. Found', posts.length, 'posts');
    posts.forEach((post, i) => {
      console.log(`  ${i + 1}. [${post.channel}] ${post.text?.substring(0, 50)}...`);
    });
  } catch (error) {
    console.error('❌ Fetch failed:', error);
  }

  console.log('\n✅ Supabase connection test completed!');
}

testConnection().catch(console.error);
