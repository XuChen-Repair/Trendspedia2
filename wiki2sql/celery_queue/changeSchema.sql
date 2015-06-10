CREATE TABLE IF NOT EXISTS ChangeTable (
  -- Unique identifier number.
  change_id int unsigned NOT NULL PRIMARY KEY AUTO_INCREMENT,

  -- page_title of page
  -- Spaces are transformed into underscores in title storage.
  change_page_title varchar(255) binary NOT NULL,

  -- Timestamp of when change was created
  change_timestamp binary(14) NOT NULL default '',

  -- 1 indicates the change is already processed.
  -- 0 indicates the change is to be processed.
  flag tinyint unsigned NOT NULL default 0
);

-- http://stackoverflow.com/questions/1008287/illegal-mix-of-collations-mysql-error
-- to test duplicate entry: select change_page_title, count(*) from ChangeTable group by change_page_title having count(*) > 1;

CREATE TABLE IF NOT EXISTS Log (
  -- Unique identifier number.
  log_id int unsigned NOT NULL PRIMARY KEY AUTO_INCREMENT,

  -- Timestamp most recent change
  log_mostRecent binary(14) NOT NULL default '',

  -- Timestamp most recent change
  log_mostBack binary(14) NOT NULL default '',

  -- total number of changes detected
  log_count int unsigned NOT NULL,

  -- 1 indicates the change is already processed.
  -- 0 indicates the change is to be processed.
  log_noMissing tinyint unsigned NOT NULL default 0
);