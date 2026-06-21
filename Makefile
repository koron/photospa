photospa.db: images.tsv sql/init.sql sql/dir.sql sql/image.sql sql/tag.sql sql/cleanup.sql
	duckdb $@ < sql/init.sql
	duckdb $@ < sql/dir.sql
	duckdb $@ < sql/image.sql
	duckdb $@ < sql/tag.sql
	duckdb $@ < sql/cleanup.sql

clean:
	rm -f photospa.db
