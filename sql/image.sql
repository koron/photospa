DROP SEQUENCE IF EXISTS seq_images_id;
CREATE SEQUENCE seq_images_id START 1;

DROP TABLE IF EXISTS images;
CREATE TABLE images (
    id           INTEGER DEFAULT nextval('seq_images_id') PRIMARY KEY,
    directory_id INTEGER NOT NULL,
    category_id  INTEGER NOT NULL,

    path        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL,
    hash        TEXT NOT NULL,
    description TEXT,
);

INSERT INTO images(id, path, created_at, hash, description, directory_id, category_id)
SELECT id, path, created_at, hash, description, 
    (SELECT id FROM directories WHERE full_path = regexp_replace(raw_images.path, '/[^/]+$', '')),
    (SELECT id FROM categories WHERE name = raw_images.category)
    FROM raw_images;
