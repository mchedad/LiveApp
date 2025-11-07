const WINDOW_MS = 60_000;
const MAX_ACTIONS_PER_WINDOW = 40;

const buckets = new Map();

function cleanup() {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.windowStart > WINDOW_MS) {
      buckets.delete(key);
    }
  }
}

setInterval(cleanup, WINDOW_MS).unref();

function assertWithinRateLimit(key) {
  if (!key) {
    return;
  }
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    bucket = { windowStart: now, count: 0 };
  }
  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > MAX_ACTIONS_PER_WINDOW) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - bucket.windowStart)) / 1000);
    const error = new Error('RATE_LIMITED');
    error.code = 'RATE_LIMITED';
    error.retryAfter = Math.max(retryAfter, 1);
    throw error;
  }
}

module.exports = {
  assertWithinRateLimit,
};

