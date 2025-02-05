-- migrations/003_create_event_table.sql
CREATE TABLE event_data (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    venue_name VARCHAR(255) NOT NULL,
    created_by INT REFERENCES user_account(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);