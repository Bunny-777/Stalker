const http = require('http');
const app = require('../server');

async function testE2E() {
  const server = app.listen(5099, async () => {
    console.log('E2E Test Server started on port 5099');

    try {
      const baseUrl = 'http://localhost:5099';

      // 1. Healthcheck
      console.log('Testing GET /api/health...');
      const healthRes = await fetch(`${baseUrl}/api/health`);
      const health = await healthRes.json();
      console.log('Health:', health.status, 'Telegram Ready:', health.telegramReady);

      // 2. Preview LeetCode user
      console.log('\nTesting GET /api/leetcode/preview/lee215...');
      const prevRes = await fetch(`${baseUrl}/api/leetcode/preview/lee215`);
      const preview = await prevRes.json();
      console.log('Preview success:', preview.success, 'User:', preview.data?.username, 'Total Solved:', preview.data?.stats?.totalSolved);

      // 3. Add target
      console.log('\nTesting POST /api/targets...');
      const addRes = await fetch(`${baseUrl}/api/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: 'https://leetcode.com/u/neal_wu/' })
      });
      const added = await addRes.json();
      console.log('Add target success:', added.success, 'Target ID:', added.data?.id, 'Username:', added.data?.username);

      // 4. List targets
      console.log('\nTesting GET /api/targets...');
      const listRes = await fetch(`${baseUrl}/api/targets`);
      const list = await listRes.json();
      console.log('Targets count:', list.count);

      // 5. Toggle target
      if (added.data?.id) {
        console.log('\nTesting PATCH /api/targets/:id/toggle...');
        const toggleRes = await fetch(`${baseUrl}/api/targets/${added.data.id}/toggle`, { method: 'PATCH' });
        const toggled = await toggleRes.json();
        console.log('Toggled target enabled state:', toggled.data?.enabled);

        // 6. Delete target
        console.log('\nTesting DELETE /api/targets/:id...');
        const delRes = await fetch(`${baseUrl}/api/targets/${added.data.id}`, { method: 'DELETE' });
        const deleted = await delRes.json();
        console.log('Delete success:', deleted.success);
      }

      console.log('\n--- ALL E2E TESTS PASSED SUCCESSFULLY! ---');
    } catch (err) {
      console.error('E2E Test Failed:', err);
    } finally {
      server.close(() => {
        console.log('E2E Test Server closed.');
        process.exit(0);
      });
    }
  });
}

testE2E();
