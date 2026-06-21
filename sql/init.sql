DROP SEQUENCE IF EXISTS seq_raw_images_id;
CREATE SEQUENCE seq_raw_images_id START 1;

DROP TABLE IF EXISTS raw_images;
CREATE TABLE raw_images (
    id          INTEGER DEFAULT nextval('seq_raw_images_id') PRIMARY KEY,
    path        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL,
    hash        TEXT NOT NULL,
    category    TEXT NOT NULL,
    tags        TEXT[],
    description TEXT,
);

INSERT INTO raw_images(path, created_at, hash, category, tags, description)
SELECT 
    column00 AS path,
    column01::TIMESTAMPTZ AS created_at,
    column02 AS hash,
    column03 AS category,
    string_split(column04, ',') AS tags, -- ここでカンマ分割
    column05 AS description,
FROM read_csv(
    'images.tsv', 
    delim='\t', 
    header=false, 
    columns={
        'column00': 'TEXT',
        'column01': 'TEXT',
        'column02': 'TEXT',
        'column03': 'TEXT',
        'column04': 'TEXT', -- 一度TEXTとして読み込む
        'column05': 'TEXT',
        'column06': 'TEXT'
    }
);

DROP SEQUENCE IF EXISTS seq_categories_id;
CREATE SEQUENCE seq_categories_id START 1;

DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
    id   INTEGER DEFAULT nextval('seq_categories_id') PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

INSERT INTO categories(name)
    SELECT DISTINCT category FROM raw_images ORDER BY category ASC;
