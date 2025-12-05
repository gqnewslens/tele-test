/**
 * Test crawler functionality
 * Usage: npx tsx scripts/test-crawler.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getCrawlerService } from '../lib/crawler';

async function testCrawler() {
  console.log('🧪 Testing Crawler Service\n');

  const service = getCrawlerService();

  // Show crawler info
  console.log('📋 Available crawlers:');
  const crawlers = service.getCrawlerInfo();
  crawlers.forEach((crawler, i) => {
    console.log(`  ${i + 1}. ${crawler.name} (${crawler.source})`);
  });
  console.log();

  // Test crawling
  console.log('🔄 Starting crawl (limit: 5 items per source)...\n');
  try {
    const results = await service.crawlAll(5);

    console.log('\n📊 Crawl Results Summary:');
    console.log('═'.repeat(60));

    results.forEach((result) => {
      console.log(`\n${result.success ? '✅' : '❌'} ${result.source.toUpperCase()}`);
      console.log(`  Fetched: ${result.items_fetched}`);
      console.log(`  New: ${result.items_new}`);
      console.log(`  Updated: ${result.items_updated}`);
      if (result.errors && result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length}`);
        result.errors.forEach((error, i) => {
          console.log(`    ${i + 1}. ${error}`);
        });
      }
    });

    console.log('\n═'.repeat(60));

    // Show recent releases
    console.log('\n📰 Recent Press Releases (5 items):');
    const recent = await service.getRecentReleases({ limit: 5 });
    recent.forEach((release, i) => {
      console.log(
        `\n${i + 1}. [${release.source.toUpperCase()}] ${release.title.substring(0, 60)}...`
      );
      console.log(`   Published: ${new Date(release.published_at).toLocaleDateString('ko-KR')}`);
      console.log(`   URL: ${release.url}`);
      if (release.category) {
        console.log(`   Category: ${release.category}`);
      }
    });

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testCrawler().catch(console.error);
