-- ============================================================================
-- Migration 001: PostgreSQL Extensions
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Enables required cryptographic and UUID generation extensions.
-- ============================================================================

-- Enable pgcrypto for cryptographic functions and secure UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable uuid-ossp for UUID utility functions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for Arabic and multilingual text searching capabilities
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
