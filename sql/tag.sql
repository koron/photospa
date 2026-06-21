DROP SEQUENCE IF EXISTS seq_tags_id;
CREATE SEQUENCE seq_tags_id START 1;

DROP TABLE IF EXISTS tags;
CREATE TABLE tags (
    id  INTEGER DEFAULT nextval('seq_tags_id') PRIMARY KEY,
    tag TEXT UNIQUE NOT NULL
);

INSERT INTO tags (tag)
SELECT DISTINCT UNNEST(tags) AS tag
  FROM raw_images
  WHERE tags IS NOT NULL
  ORDER BY tag;

DROP TABLE IF EXISTS image_tags;
CREATE TABLE image_tags (
    image_id INTEGER NOT NULL,
    tags_id  INTEGER NOT NULL,
    PRIMARY KEY (image_id, tags_id)
);

INSERT INTO image_tags(image_id, tags_id)
SELECT r.id, t.id FROM (
    SELECT DISTINCT id, UNNEST(tags) AS tag_name FROM raw_images
) r
JOIN tags AS t ON r.tag_name = t.tag;
