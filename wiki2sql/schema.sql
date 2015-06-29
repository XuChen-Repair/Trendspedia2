-- Wikidb Schema. A simplified and modified version from Wikipedia SQL DB schema
-- Wikipedia SQL DB schema: http://svn.wikimedia.org/viewvc/mediawiki/trunk/phase3/maintenance/tables.sql?view=markup
--
-- Core of the wiki: each page has an entry here which identifies
-- it by title and contains some essential metadata.
--
CREATE TABLE IF NOT EXISTS /*_*/page (
  -- Unique identifier number. The page_id will be preserved across
  -- edits and rename operations, but not deletions and recreations.
  page_id int unsigned NOT NULL PRIMARY KEY AUTO_INCREMENT,

  -- A page name is broken into a namespace and a title.
  -- The namespace keys are UI-language-independent constants,
  -- defined in includes/Defines.php
  page_namespace int NOT NULL,

  -- The rest of the title, as text.
  -- Spaces are transformed into underscores in title storage.
  page_title varchar(255) binary NOT NULL,

  -- 1 indicates the article is a redirect.
  page_is_redirect tinyint unsigned NOT NULL default 0,

  -- foreign key to revision
  page_revision int unsigned NOT NULL REFERENCES revision(rev_id) ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE page CONVERT TO CHARACTER SET utf8 COLLATE 'utf8_general_ci';

--
-- Every edit of a page creates also a revision row.
-- This stores metadata about the revision, and a reference
-- to the text storage backend.
--
CREATE TABLE IF NOT EXISTS /*_*/revision (
  -- Unique ID to identify each revision
  rev_id int unsigned NOT NULL PRIMARY KEY AUTO_INCREMENT,

  -- Key to page_id. This should _never_ be invalid.
  rev_page int unsigned NOT NULL REFERENCES page(page_id) ON DELETE RESTRICT ON UPDATE RESTRICT,

  -- Key to revision.rev_id
  -- This field is used to add support for a tree structure (The Adjacency List Model)
  rev_parent_id int unsigned default NULL,

  -- Timestamp of when revision was created
  rev_timestamp binary(14) NOT NULL default '',

  -- Key to text.old_id, where the actual bulk text is stored.
  -- It's possible for multiple revisions to use the same text,
  -- for instance revisions where only metadata is altered
  -- or a rollback to a previous version.
  rev_text_id int unsigned NOT NULL,

  -- Text comment summarizing the change.
  -- This text is shown in the history and other changes lists,
  -- rendered in a subset of wiki markup by Linker::formatComment()
  rev_comment tinyblob NOT NULL,

  -- Records whether the user marked the 'minor edit' checkbox.
  -- Many automated edits are marked as minor.
  rev_minor_edit tinyint unsigned NOT NULL default 0,

  -- SHA-1 text content hash in base-36
  rev_sha1 varbinary(32) NOT NULL default ''

) MAX_ROWS=10000000 AVG_ROW_LENGTH=1024;
-- In case tables are created as MyISAM, use row hints for MySQL <5.0 to avoid 4GB limit

ALTER TABLE revision CONVERT TO CHARACTER SET utf8 COLLATE 'utf8_general_ci';

--
-- Holds text of individual page revisions.
--
-- Field names are a holdover from the 'old' revisions table in
-- MediaWiki 1.4 and earlier: an upgrade will transform that
-- table into the 'text' table to minimize unnecessary churning
-- and downtime. If upgrading, the other fields will be left unused.
--
CREATE TABLE IF NOT EXISTS /*_*/text (
  -- Unique text storage key number.
  -- Note that the 'oldid' parameter used in URLs does *not*
  -- refer to this number anymore, but to rev_id.
  --
  -- revision.rev_text_id is a key to this column
  text_id int unsigned NOT NULL PRIMARY KEY AUTO_INCREMENT,

  -- Depending on the contents of the old_flags field, the text
  -- may be convenient plain text, or it may be funkily encoded.
  text_text mediumblob NOT NULL,

  -- Key to page_id. This should _never_ be invalid.
  text_page int unsigned NOT NULL REFERENCES page(page_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  
  -- Key to revision_id. This should _never_ be invalid.
  text_revision int unsigned NOT NULL REFERENCES revision(rev_id) ON DELETE RESTRICT ON UPDATE RESTRICT
) MAX_ROWS=10000000 AVG_ROW_LENGTH=10240;
-- In case tables are created as MyISAM, use row hints for MySQL <5.0 to avoid 4GB limit

CREATE TABLE IF NOT EXISTS/*_*/pagelinks (
  -- Key to the page_id of the page containing the link.
  pl_from_id int unsigned NOT NULL default 0,

  pl_from_title varchar(255) binary NOT NULL,

  -- Key to page_namespace/page_title of the target page.
  -- The target page may or may not exist, and due to renames
  -- and deletions may refer to different page records as time
  -- goes by.
  pl_namespace int NOT NULL default 0,
  pl_id int unsigned NOT NULL default 0,
  pl_title varchar(255) binary NOT NULL default ''
);

-- test duplicate: select pl_from_id, pl_id, count(*) from pagelinks group by pl_from_id, pl_id having count(*) > 1;