import lockfile from "proper-lockfile";

// Store lock releases in a Map to prevent duplicate releases
const lockReleases = new Map();

/**
 * Acquire a file lock with retry logic
 * @param {string} filePath - The file path to lock
 * @param {object} options - Lock options
 * @param {number} options.retries - Number of retries (default: 5)
 * @param {number} options.minTimeout - Minimum retry timeout in ms (default: 100)
 * @param {number} options.maxTimeout - Maximum retry timeout in ms (default: 1000)
 * @returns {Promise<{release: function}>} Object with release function
 */
export async function acquireLock(filePath, options = {}) {
  const {
    retries = 5,
    minTimeout = 100,
    maxTimeout = 1000,
  } = options;

  try {
    const release = await lockfile.lock(filePath, {
      retries,
      minTimeout,
      maxTimeout,
      stale: 30000, // Lock expires after 30 seconds if not released
    });

    // Store release function
    lockReleases.set(filePath, release);

    console.log(`[fileLock] Acquired lock for: ${filePath}`);
    return { release };
  } catch (error) {
    console.error(`[fileLock] Failed to acquire lock for ${filePath}:`, error.message);
    throw new Error(`Failed to acquire file lock for ${filePath}: ${error.message}`);
  }
}

/**
 * Release a file lock
 * @param {string} filePath - The file path to unlock
 */
export async function releaseLock(filePath) {
  const release = lockReleases.get(filePath);

  if (!release) {
    console.warn(`[fileLock] No lock found for: ${filePath}`);
    return;
  }

  try {
    await release();
    lockReleases.delete(filePath);
    console.log(`[fileLock] Released lock for: ${filePath}`);
  } catch (error) {
    console.error(`[fileLock] Failed to release lock for ${filePath}:`, error.message);
  }
}

/**
 * Execute a function with file lock protection
 * @param {string} filePath - The file path to lock
 * @param {function} fn - Async function to execute
 * @param {object} lockOptions - Lock options
 * @returns {Promise<T>} Result of the function
 */
export async function withLock(filePath, fn, lockOptions = {}) {
  const { release } = await acquireLock(filePath, lockOptions);

  try {
    return await fn();
  } finally {
    await releaseLock(filePath);
  }
}

/**
 * Check if a file is currently locked
 * @param {string} filePath - The file path to check
 * @returns {Promise<boolean>} True if locked
 */
export async function isLocked(filePath) {
  try {
    const locked = await lockfile.check(filePath);
    return locked;
  } catch (error) {
    return false;
  }
}
