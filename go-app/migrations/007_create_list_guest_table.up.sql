-- migrations/007_create_list_guest_table.sql
CREATE TABLE list_guest (
    list_id INT REFERENCES list(id) ON DELETE CASCADE,
    guest_id INT REFERENCES guest(id) ON DELETE CASCADE,
    PRIMARY KEY (list_id, guest_id)
);