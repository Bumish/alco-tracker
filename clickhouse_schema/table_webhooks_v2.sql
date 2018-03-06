-- если несколько проектов, то первыичный ключ будет (projectId, date, uid)
-- DROP TABLE IF EXISTS webhooks;
CREATE TABLE IF NOT EXISTS webhooks
(
    id UInt64,
    projectId UInt32,
    name: String,
    action String,
    service String,
    remote_ip String,
    data.key Array(String),
    data.value Array(String),
    timestamp UInt64,
    dateTime DateTime,
    date Date

) ENGINE = MergeTree(date, (date, projectId, id), 8192);

