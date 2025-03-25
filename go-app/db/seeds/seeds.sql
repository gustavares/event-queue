-- Insert test user_account
INSERT INTO user_account (email) VALUES 
    ('test1', 'test1@example.com', 'hash-test', '+5521997977971'),
    ('test2', 'test2@example.com', 'hash-test', '+5521997977972'),
    ('test3', 'test3@example.com', 'hash-test', '+5521997977973');

-- Insert test event_data
INSERT INTO event_data (name, date) VALUES 
    ('Test Event 1', 'Test Venue 1', '2025-01-01', 1),
    ('Test Event 2', 'Test Venue 2', '2025-02-01'), 2);
