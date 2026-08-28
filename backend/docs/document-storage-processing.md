# Document storage and processing

The Documents domain now uses a `StorageProvider` abstraction. The default local-development provider stores files below `STORAGE_LOCAL_ROOT` and exposes only opaque UUID-based `objectKey` values to the application/API.

No S3, Google Cloud Storage, Azure Blob Storage, or cloud credentials are configured or implemented.

## Upload contract

`POST /api/documents/upload` accepts the raw file bytes. Required headers:

- `Content-Type`: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, or `text/plain`
- `X-File-Name`: safe basename with `.pdf`, `.docx`, or `.txt`

Optional headers:

- `X-Checksum-Sha256`
- `X-Document-Type`
- `X-Parent-Document-Id`

The server computes the SHA-256 checksum itself and generates the `objectKey`.

## Processing dependencies

The repository contains no PDF/DOCX npm parser library. Real extraction is therefore implemented behind `DocumentProcessor` using the operating-system tools available in the local environment:

- PDF: `pdftotext` (Poppler)
- DOCX: `unzip`
- TXT: Node.js UTF-8 decoding

If `pdftotext` or `unzip` is unavailable, the corresponding document is not reported as successfully processed. The service returns a processing/dependency error and persists `scan_status = 'failed'` when a document row has already been created.

For production, the deployment must provide equivalent PDF/DOCX processing dependencies or replace the processor implementation with an approved library-backed provider. No cloud parser or credentials are assumed here.
