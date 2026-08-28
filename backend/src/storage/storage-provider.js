class StorageProvider {
  async store(_buffer, _metadata) {
    throw new Error('StorageProvider.store() is not implemented');
  }

  async retrieve(_objectKey) {
    throw new Error('StorageProvider.retrieve() is not implemented');
  }

  async exists(_objectKey) {
    throw new Error('StorageProvider.exists() is not implemented');
  }

  async delete(_objectKey) {
    throw new Error('StorageProvider.delete() is not implemented');
  }
}

module.exports = StorageProvider;
