DROP TABLE IF EXISTS ledger_entries CASCADE;
DROP TABLE IF EXISTS transactions CASCADE ;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS idempotency_keys CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS otps CASCADE;
DROP TABLE IF EXISTS verification_links CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

--ENUM types
CREATE TYPE transaction_type AS ENUM (
    'TRANSFER',
    'DEPOSIT',
    'WITHDRAWAL'
);

CREATE TYPE transaction_status AS ENUM (
    'PENDING',
    'COMPLETED',
    'REVERSED'
    'CANCELED',
    'FAILED'
);

CREATE TYPE ledger_entry_type AS ENUM (
    'DEBIT',
    'CREDIT'
);



-- Users 
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(10) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT NOW()
);


-- Profile
CREATE TABLE user_profiles (
    user_id UUID NOT NULL REFERENCES users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Wallets 
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id),
    currency VARCHAR(10) DEFAULT 'NGN',
    balance INTEGER DEFAULT 0,
    is_frozen BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT now()

);


-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    amount BIGINT NOT NULL,
    status transaction_status DEFAULT 'PENDING',
    type transaction_type NOT NULL, -- DEPOSIT, TRANS, etc
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT now()

);

-- Ledger Entries
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    transaction_id UUID REFERENCES transactions(id),
    amount NUMERIC(15, 2),
    type ledger_entry_type, --DEBIT or CREDIT
    created_at TIMESTAMP DEFAULT NOW()
);

-- Idempotency
CREATE TABLE idempotency_keys (
    id SERIAL PRIMARY KEY,
    idempotency_key VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(100) NOT NULL,
    request_hash TEXT NOT NULL,
    response_status INTEGER NOT NULL,
    response_body JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(idempotency_key, user_id)
);

-- Refresh Tokens
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    role VARCHAR(10) NOT NULL,
    revoked_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
    -- user_agent TEXT
);

-- OTPs
CREATE TABLE otps (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Verification links
CREATE TABLE verification_links (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    token_hash TEXT NOT NULL
);

-- Webhook event(built by me tho.)
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_event_id TEXT UNIQUE,
    payload JSONB NOT NULL,
    processed BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW()
);


-- Trigger functions
CREATE OR REPLACE FUNCTION prevent_system_wallet_modification() 
RETURNS trigger AS $$
BEGIN 
    IF OLD.is_system = TRUE THEN
        RAISE EXCEPTION 'System wallet cannot be updated or deleted';
    END IF;
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;    

-- Attach
CREATE TRIGGER protect_system_wallet
BEFORE UPDATE OR DELETE ON wallets
FOR EACH ROW
EXECUTE FUNCTION prevent_system_wallet_modification();