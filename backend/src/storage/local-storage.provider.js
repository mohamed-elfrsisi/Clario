const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const StorageProvider = require('./storage-provider');
const AppError = require('../errors/app-error');

const OBJECT_KEY_PATTERN = /^[0-9a-f-]{36}\.(pdf|docx|txt)$/i;

class LocalStorageProvider extends StorageProvider {
  constructor(rootDirectory = process.env.STORAGE_LOCAL_ROOT || path.join(process.cwd(), 'storage', 'documents')) {
    super();
    this.rootDirectory = path.resolve(rootDirectory);
  }

  validateObjectKey(objectKey) {
    if (typeof objectKey !== 'string' || !OBJECT_KEY_PATTERN.test(objectKey)) {
      throw new AppError(400, 'INVALID_OBJECT_KEY', 'Invalid storage object key');
    }
  }

  resolveObjectPath(objectKey) {
    this.validateObjectKey(objectKey);
    const resolved = path.resolve(this.rootDirectory, objectKey);
    const relative = path.relative(this.rootDirectory, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new AppError(400, 'INVALID_OBJECT_KEY', 'Invalid storage object key');
    }
    return resolved;
  }

  async store(buffer, { extension }) {
    const objectKey = `${crypto.randomUUID()}.${extension}`;
    const filePath = this.resolveObjectPath(objectKey);
    await fs.mkdir(this.rootDirectory, { recursive: true, mode: 0o700 });
    await fs.writeFile(filePath, buffer, { flag: 'wx', mode: 0o600 });
    return { objectKey };
  }

  async retrieve(objectKey) {
    const filePath = this.resolveObjectPath(objectKey);
    try {
      return await fs.readFile(filePath);
    } catch (err) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  }

  async exists(objectKey) {
    const filePath = this.resolveObjectPath(objectKey);
    try {
      await fs.access(filePath);
      return true;
    } catch (err) {
      if (err.code === 'ENOENT') return false;
      throw err;
    }
  }

  async delete(objectKey) {
    const filePath = this.resolveObjectPath(objectKey);
    try {
      await fs.unlink(filePath);
      return true;
    } catch (err) {
      if (err.code === 'ENOENT') return false;
      throw err;
    }
  }
}

module.exports = LocalStorageProvider;
