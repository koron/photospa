DROP SEQUENCE IF EXISTS seq_directroies_id;
CREATE SEQUENCE seq_directroies_id START 1;

DROP TABLE IF EXISTS directories;
CREATE TABLE directories (
    id        INTEGER DEFAULT nextval('seq_directroies_id') PRIMARY KEY,
    parent_id INTEGER,
    name      TEXT,
    full_path TEXT UNIQUE
);

-- Register the root directory (.) with id=1.
INSERT INTO directories(name, full_path) VALUES ('.', '.');

-- Step 1: Identify and insert all directories (hierarchy).
INSERT INTO directories (name, full_path)
WITH RECURSIVE path_parts AS (
    -- Extract the "full directory path" from `raw_images`, excluding the
    -- filename.
    SELECT DISTINCT 
        regexp_replace(path, '/[^/]+$', '') AS current_path
    FROM raw_images
    
    UNION
    
    -- Recursively extract the parent directory one level up.
    SELECT 
        CASE 
            WHEN current_path LIKE '%/%' THEN regexp_replace(current_path, '/[^/]+$', '')
            ELSE NULL
        END AS current_path
    FROM path_parts
    WHERE current_path IS NOT NULL AND current_path LIKE '%/%'
),
unique_directories AS (
    -- Eliminate duplicates and exclude NULLs and empty strings.
    SELECT current_path AS full_path
    FROM path_parts
    WHERE current_path IS NOT NULL AND current_path != ''
)
-- Insert name and full path uniquely (safely, using ON CONFLICT)
SELECT 
    regexp_extract(full_path, '[^/]+$') AS name,
    full_path
FROM unique_directories
ON CONFLICT (full_path) DO NOTHING;

-- Step 2: Compare the paths of the inserted data and batch-update the
-- `parent_id`.
UPDATE directories AS child
SET parent_id = parent.id
FROM directories AS parent
WHERE child.parent_id IS NULL
  AND parent.full_path = regexp_replace(child.full_path, '/[^/]+$', '')
  AND child.full_path LIKE '%/%';
