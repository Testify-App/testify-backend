CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS CITEXT;

DROP TYPE IF EXISTS status;
CREATE TYPE status AS ENUM (
  'inactive',
  'active',
  'deactivated',
  'pending',
  'failed'
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  first_name CITEXT NULL,
  middle_name CITEXT NULL,
  last_name CITEXT NULL,
  email CITEXT UNIQUE NULL,
  password VARCHAR(255) NULL,
  country_code VARCHAR NULL,
  phone_number VARCHAR UNIQUE NULL,
  dob DATE NULL,
  state_of_origin VARCHAR NULL,
  status status DEFAULT 'inactive',
  avatar TEXT NULL,
  verification_code VARCHAR,
  verification_code_expiry_time TIMESTAMPTZ,
  activated_at TIMESTAMPTZ DEFAULT NULL,
  username VARCHAR UNIQUE NULL,
  password_changed_count INTEGER DEFAULT 0,
  session_id VARCHAR DEFAULT NULL,
  last_login TIMESTAMPTZ DEFAULT NULL,
  device_token VARCHAR DEFAULT NULL,
  hash_id_key TEXT NULL,
  terms_and_condition BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NULL
);
