-- migrations/005_create_list_table.sql
CREATE TABLE list (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    event_id INT REFERENCES event_data(id) ON DELETE CASCADE,
    public BOOLEAN NOT NULL DEFAULT FALSE,
    cost VARCHAR(50) NOT NULL, -- Store monetary values as strings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);