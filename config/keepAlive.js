const FIRST_DELAY_MS = 60 * 1000;
const TIMEOUT_MS = 10 * 1000;
const DEFAULT_INTERVAL_MS = 10 * 60 * 1000;

let firstTimer = null;
let intervalTimer = null;

function getEnv() {
  return {
    enabled: String(process.env.KEEP_ALIVE_ENABLED || '').toLowerCase() === 'true',
    verbose: String(process.env.KEEP_ALIVE_VERBOSE || '').toLowerCase() === 'true',
    intervalMs:
      parseInt(process.env.KEEP_ALIVE_INTERVAL_MS, 10) || DEFAULT_INTERVAL_MS,
    apiUrl:
      process.env.API_URL ||
      `http://localhost:${process.env.PORT || 5000}`,
  };
}

function getLogger() {
  // Lazy require to avoid circular imports (logger -> env -> keepAlive, etc.)
  try {
    return require('../utils/logger');
  } catch {
    return null;
  }
}

function formatMsg(prefix, meta) {
  if (!meta || typeof meta !== 'object') return `${prefix} ${meta || ''}`.trim();
  const parts = Object.entries(meta)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
  return `${prefix} ${parts}`.trim();
}

function log(level, prefix, meta) {
  const logger = getLogger();
  const msg = formatMsg(prefix, meta);
  if (logger && typeof logger[level] === 'function') {
    logger[level](msg);
  } else if (level === 'warn') {
    console.warn(msg);
  } else {
    console.log(msg);
  }
}

async function pingHealth({ forceLog = false } = {}) {
  const { apiUrl, verbose } = getEnv();
  const url = apiUrl.replace(/\/+$/, '') + '/health';
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    const duration = Date.now() - started;

    if (!res.ok) {
      log('warn', '[keepAlive] non-OK', { url, status: res.status, duration });
      return;
    }

    if (verbose || forceLog) {
      log('info', '[keepAlive] ping OK', { url, status: res.status, duration });
    }
  } catch (err) {
    const duration = Date.now() - started;
    const msg =
      err.name === 'AbortError'
        ? `timeout after ${duration}ms`
        : err.message;
    log('warn', '[keepAlive] ping failed', { url, err: msg });
  } finally {
    clearTimeout(timeout);
  }
}

function startKeepAlive() {
  const { enabled, intervalMs, verbose } = getEnv();

  if (!enabled) {
    log('info', '[keepAlive] Disabled');
    return;
  }

  if (firstTimer || intervalTimer) {
    log('warn', '[keepAlive] Already running');
    return;
  }

  log('info', '[keepAlive] Enabled', {
    firstDelayMs: FIRST_DELAY_MS,
    intervalMs,
    verbose,
  });

  firstTimer = setTimeout(() => {
    firstTimer = null;
    pingHealth({ forceLog: true }).catch(() => {});

    intervalTimer = setInterval(() => {
      pingHealth().catch(() => {});
    }, intervalMs);
    if (intervalTimer.unref) intervalTimer.unref();
  }, FIRST_DELAY_MS);
  if (firstTimer.unref) firstTimer.unref();
}

function stopKeepAlive() {
  if (firstTimer) {
    clearTimeout(firstTimer);
    firstTimer = null;
  }
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
}

module.exports = { startKeepAlive, stopKeepAlive, pingHealth };