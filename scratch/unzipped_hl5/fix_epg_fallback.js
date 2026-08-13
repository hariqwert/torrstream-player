const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

// The logic inside renderNextEpgChunk handles empty days. But let's see where to ensure EPG.
// The user might mean that if a channel has no programs AT ALL, we should synthesize some.
