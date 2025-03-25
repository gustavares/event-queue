-- migrations/002_create_role_table.sql
CREATE TABLE user_role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Seed the roles
INSERT INTO user_role (name) VALUES
('Manager'),
('Promoter'),
('Host');