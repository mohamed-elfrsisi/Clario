const LocalStorageProvider = require('./local-storage.provider');

// No cloud storage provider exists in this project. Keep the provider behind
// one factory so a production provider can be configured later without
// leaking provider details into the Documents domain.
function createStorageProvider() {
  const provider = process.env.STORAGE_PROVIDER || 'local';
  if (provider === 'local') return new LocalStorageProvider();
  throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
}

const storageProvider = createStorageProvider();

module.exports = { storageProvider, createStorageProvider };
