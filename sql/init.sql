DROP SEQUENCE IF EXISTS seq_raw_images_id;
CREATE SEQUENCE seq_raw_images_id START 1;

DROP TABLE IF EXISTS raw_images;
CREATE TABLE raw_images (
    id          INTEGER DEFAULT nextval('seq_raw_images_id') PRIMARY KEY,
    path        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL,
    hash        TEXT NOT NULL,
    category    TEXT NOT NULL,
    title       TEXT,
    tags        TEXT[],
    description TEXT,
);

INSERT INTO raw_images(path, created_at, hash, category, title, tags, description)
SELECT 
    column00 AS path,
    column01::TIMESTAMPTZ AS created_at,
    column02 AS hash,
    column03 AS category,
    column04 AS title,
    string_split(column05, ',') AS tags, -- ここでカンマ分割
    column06 AS description,
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
        'column06': 'TEXT',
        'column07': 'TEXT'
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
