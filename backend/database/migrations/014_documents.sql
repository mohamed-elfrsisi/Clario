-- 014_documents.sql
-- Table 13 of 22: documents
--
-- Self-referencing (parent_document_id) to support document versioning:
-- a re-uploaded/re-parsed document can point back at the version it
-- replaces.

CREATE TABLE IF NOT EXISTS documents (
  document_id         UUID PRIMARY KEY DEFAULT uuidv7(),
  profile_id           UUID NOT NULL,
  file_name             VARCHAR(255) NOT NULL,
  object_key            TEXT NOT NULL,
  mime_type             VARCHAR(255) NOT NULL,
  file_size_bytes        BIGINT NOT NULL,
  checksum_sha256        CHAR(64),
  document_type          VARCHAR(255),
  raw_text               TEXT,
  scan_status            VARCHAR(32) NOT NULL DEFAULT 'pending',
  parseability_score     NUMERIC(5, 2),
  version_number         INTEGER NOT NULL DEFAULT 1,
  parent_document_id     UUID,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT documents_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles (profile_id)
    ON DELETE CASCADE,
  -- A parent document being deleted should not silently take every
  -- version descended from it along for the ride; RESTRICT forces that
  -- to be an explicit decision. (Deleting the whole profile still
  -- cascades through all of its documents via the FK above.)
  CONSTRAINT documents_parent_document_id_fkey
    FOREIGN KEY (parent_document_id) REFERENCES documents (document_id)
    ON DELETE RESTRICT,
  CONSTRAINT documents_file_size_bytes_check
    CHECK (file_size_bytes >= 0),
  CONSTRAINT documents_version_number_check
    CHECK (version_number >= 1),
  CONSTRAINT documents_parseability_score_range
    CHECK (
      parseability_score IS NULL
      OR parseability_score BETWEEN 0 AND 100
    ),
  CONSTRAINT documents_checksum_sha256_format
    CHECK (
      checksum_sha256 IS NULL
      OR checksum_sha256 ~ '^[0-9a-f]{64}$'
    ),
  CONSTRAINT documents_not_own_parent
    CHECK (parent_document_id IS DISTINCT FROM document_id)
);

CREATE INDEX IF NOT EXISTS idx_documents_profile_id
  ON documents (profile_id);
CREATE INDEX IF NOT EXISTS idx_documents_parent_document_id
  ON documents (parent_document_id);

COMMENT ON TABLE documents IS
  'Uploaded files (resumes, etc.) owned by a profile. object_key points '
  'at external object storage - the file bytes themselves are not '
  'stored in PostgreSQL. parent_document_id chains new versions back to '
  'what they replaced.';
COMMENT ON COLUMN documents.scan_status IS
  'Lifecycle state of async processing, e.g. pending/scanning/'
  'clean/failed. Not constrained to a fixed enum here since the '
  'approved design does not specify the exact value set - the '
  'application/service layer owns the state machine.';
