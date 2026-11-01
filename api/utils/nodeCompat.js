// Node >= 25 removed `buffer.SlowBuffer`, which `buffer-equal-constant-time`
// (a dependency of jsonwebtoken) still reads at load time. Restore it as an alias.
const buffer = require('buffer');
if (!buffer.SlowBuffer) buffer.SlowBuffer = buffer.Buffer;
