-- User Roles Enum
CREATE TYPE UserRole AS ENUM ('Manager', 'Promoter', 'Host');

-- User Roles Table
CREATE TABLE UserRoles (
    id SERIAL PRIMARY KEY,
    role UserRole NOT NULL
);

-- Users Table
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    -- Other user-related fields
);

-- Events Table
CREATE TABLE Events (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    max_guests INT NOT NULL,
    qr_check_in_enabled BOOLEAN NOT NULL DEFAULT false,
    -- Other event-related fields
);

-- GuestLists Table
CREATE TABLE GuestLists (
    id SERIAL PRIMARY KEY,
    event_id INT REFERENCES Events(id),
    user_id INT REFERENCES Users(id), -- Promoter's user ID
    list_name VARCHAR(100) NOT NULL,
    entry_price DECIMAL(10, 2) DEFAULT 0.0, -- Entry price for the list
    -- Other list-related fields
);

-- Guests Table
CREATE TABLE Guests (
    id SERIAL PRIMARY KEY,
    event_id INT REFERENCES Events(id),
    guest_list_id INT REFERENCES GuestLists(id),
    user_id INT REFERENCES Users(id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    status ENUM('RSVP', 'Confirmed', 'Not Attending') NOT NULL,
    qr_code_token VARCHAR(100), -- Store the generated QR code token here
    invited_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- UserEventRoles Table
CREATE TABLE UserEventRoles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(id),
    event_id INT REFERENCES Events(id),
    role UserRole NOT NULL,
    UNIQUE(user_id, event_id)
);

