import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const WINDOWS_RETRYABLE_CODES = new Set(["EPERM", "EACCES", "EBUSY"]);

function isWindowsRenameLockError(error) {
  return (
    process.platform === "win32" &&
    error &&
    WINDOWS_RETRYABLE_CODES.has(error.code) &&
    error.syscall === "rename"
  );
}

function isWindowsRetryableWriteError(error) {
  return process.platform === "win32" && error && WINDOWS_RETRYABLE_CODES.has(error.code);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function renameWithRetry(source, target) {
  const maxAttempts = 8;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fsp.rename(source, target);
      return;
    } catch (error) {
      if (!isWindowsRenameLockError(error) || attempt === maxAttempts) {
        throw error;
      }
      await sleep(25 * attempt);
    }
  }
}

async function writeWithRetry(filePath, content) {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fsp.writeFile(filePath, content, "utf8");
      return;
    } catch (error) {
      if (!isWindowsRetryableWriteError(error) || attempt === maxAttempts) {
        throw error;
      }
      await sleep(20 * attempt);
    }
  }
}

async function atomicWriteJsonFile(filePath, content) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tempPath = path.join(dir, `.${base}.tmp`);

  await fsp.mkdir(dir, { recursive: true });
  await writeWithRetry(tempPath, content);

  try {
    await renameWithRetry(tempPath, filePath);
  } catch (error) {
    if (!isWindowsRenameLockError(error)) {
      throw error;
    }

    await writeWithRetry(filePath, content);
    try {
      await fsp.unlink(tempPath);
    } catch (unlinkError) {
      if (unlinkError.code !== "ENOENT") {
        console.warn(`[DB] Failed to remove temp file ${tempPath}: ${unlinkError.message}`);
      }
    }
  }
}

export class WindowsSafeJSONFile {
  constructor(filename) {
    this.filename = filename;
  }

  async read() {
    if (!this.filename) return null;

    try {
      const data = await fsp.readFile(this.filename, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async write(obj) {
    if (!this.filename) return;
    const content = `${JSON.stringify(obj, null, 2)}\n`;
    await atomicWriteJsonFile(this.filename, content);
  }
}

export function cleanupLegacyTempFile(filePath) {
  if (!filePath) return;
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tempPath = path.join(dir, `.${base}.tmp`);

  try {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  } catch {
  }
}
