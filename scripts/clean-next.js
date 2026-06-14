const fs = require('fs');
const path = require('path');

const nextDir = path.join(process.cwd(), '.next');

try {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('[clean-next] Removed .next cache');
} catch (error) {
  console.warn('[clean-next] Could not remove .next:', error.message);
}
