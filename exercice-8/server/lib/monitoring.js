const MAX_LOG_ENTRIES = 50;

const metrics = {
  activeConnections: 0,
  eventsThisMinute: 0,
  eventsPerMinute: 0,
  totalEvents: 0,
  latencySamples: [],
  lastSyncAt: null,
  logs: [],
};

setInterval(() => {
  metrics.eventsPerMinute = metrics.eventsThisMinute;
  metrics.eventsThisMinute = 0;
}, 60_000).unref();

function trackConnection(delta) {
  metrics.activeConnections = Math.max(0, metrics.activeConnections + delta);
  appendLog(`connections:${metrics.activeConnections}`);
}

function recordEvent(label) {
  metrics.eventsThisMinute += 1;
  metrics.totalEvents += 1;
  metrics.lastSyncAt = new Date().toISOString();
  appendLog(`event:${label}`);
}

function recordLatencySample(ms) {
  if (typeof ms !== 'number' || Number.isNaN(ms)) {
    return;
  }
  metrics.latencySamples.push(ms);
  if (metrics.latencySamples.length > 50) {
    metrics.latencySamples.shift();
  }
}

function appendLog(message) {
  const entry = `${new Date().toISOString()} ${message}`;
  metrics.logs.push(entry);
  if (metrics.logs.length > MAX_LOG_ENTRIES) {
    metrics.logs.shift();
  }
  console.log('[monitor]', entry);
}

function getMetricsSnapshot(extra = {}) {
  const latencyCount = metrics.latencySamples.length;
  const avgLatency = latencyCount
    ? Number((metrics.latencySamples.reduce((sum, value) => sum + value, 0) / latencyCount).toFixed(2))
    : 0;
  return {
    activeConnections: metrics.activeConnections,
    eventsPerMinute: metrics.eventsPerMinute,
    totalEvents: metrics.totalEvents,
    avgLatencyMs: avgLatency,
    lastSyncAt: metrics.lastSyncAt,
    logs: [...metrics.logs],
    ...extra,
  };
}

module.exports = {
  trackConnection,
  recordEvent,
  recordLatencySample,
  getMetricsSnapshot,
};

