ALTER TABLE events ADD COLUMN page_number UInt16;
ALTER TABLE events ADD COLUMN user_id String;
ALTER TABLE events ADD COLUMN user_traits_key Array(String);
ALTER TABLE events ADD COLUMN user_traits_value Array(String);
INSERT INTO migrations (name) VALUES ('user_id_traits_and_page_num');
