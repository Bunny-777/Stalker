const leetcodeService = require('../services/leetcodeService');
const storage = require('../services/storageService');

async function runTests() {
  console.log('--- TEST 1: URL Parsing ---');
  const testUrls = [
    'https://leetcode.com/u/neal_wu/',
    'https://leetcode.com/kushal',
    'leetcode.com/u/tourist',
    '@lee215',
    'tourist'
  ];

  for (const url of testUrls) {
    const parsed = leetcodeService.extractUsername(url);
    console.log(`Parsed "${url}" -> "${parsed}"`);
  }

  console.log('\n--- TEST 2: Live Profile GraphQL Fetch ---');
  try {
    const profile = await leetcodeService.getUserProfile('lee215');
    console.log('Username:', profile.username);
    console.log('Real Name:', profile.realName);
    console.log('Avatar:', profile.avatar);
    console.log('Ranking:', profile.ranking);
    console.log('Stats:', profile.stats);
    console.log(`Recent Submissions: ${profile.recentSubmissions.length} found`);
    if (profile.recentSubmissions.length > 0) {
      console.log('Top submission:', profile.recentSubmissions[0]);
    }
  } catch (err) {
    console.error('Test 2 Error:', err.message);
  }

  console.log('\n--- TEST 3: Submissions Enrichment with Difficulty ---');
  try {
    const enriched = await leetcodeService.enrichSubmissions([
      { title: 'Two Sum', titleSlug: 'two-sum', timestamp: 1700000000, id: '1' }
    ]);
    console.log('Enriched:', enriched);
  } catch (err) {
    console.error('Test 3 Error:', err.message);
  }

  console.log('\n--- TEST 4: Storage Operations ---');
  try {
    const target = storage.addTarget({
      username: 'test_user',
      realName: 'Test Solver',
      stats: { totalSolved: 10, easySolved: 5, mediumSolved: 4, hardSolved: 1 }
    });
    console.log('Added target ID:', target.id);
    const retrieved = storage.getTargetById(target.id);
    console.log('Retrieved target username:', retrieved.username);
    storage.removeTarget(target.id);
    console.log('Cleaned up test target.');
  } catch (err) {
    console.error('Test 4 Error:', err.message);
  }

  console.log('\nAll tests completed.');
}

runTests();
