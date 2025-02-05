-- migrations/004_create_user_event_role_table.sql
CREATE TABLE user_event_role (
    user_id INT REFERENCES user_account(id) ON DELETE CASCADE,
    event_id INT REFERENCES event_data(id) ON DELETE CASCADE,
    role_id INT REFERENCES user_role(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, event_id, role_id)
);