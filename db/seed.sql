-- Seed SYSTEM wallet
INSERT INTO wallets (id, user_id, currency, is_frozen, is_system)
VALUES ('00000000-0000-0000-0000-000000000000', NULL, 'NGN', FALSE, TRUE);

-- Seed amin user
INSERT INTO users (email, password, role)
VALUES ('admin@fincore.com', '<hashed_password>', 'ADMIN')