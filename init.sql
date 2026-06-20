DROP TABLE IF EXISTS raw_images;

CREATE TABLE raw_images (
    path        TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    hash        TEXT NOT NULL,
    category    TEXT NOT NULL,
    tags        TEXT,
    description TEXT,
    duration    TEXT
);

.mode tabs

.import images.tsv raw_images

DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

INSERT INTO categories(name)
    SELECT DISTINCT category FROM raw_images ORDER BY category ASC;
