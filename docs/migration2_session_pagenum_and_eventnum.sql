ALTER TABLE events ADD COLUMN session_pageNum UInt16 DEFAULT page_number;
ALTER TABLE events ADD COLUMN session_eventNum UInt16;
ALTER TABLE events ADD COLUMN user_gaId String;
ALTER TABLE events ADD COLUMN user_ymId String;
ALTER TABLE events MODIFY COLUMN isBot Int8;

INSERT INTO migrations (name) VALUES ('session_pageNum_and_eventNum');
