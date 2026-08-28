class DocumentProcessor {
  async process(_buffer, _mimeType) {
    throw new Error('DocumentProcessor.process() is not implemented');
  }
}

module.exports = DocumentProcessor;
