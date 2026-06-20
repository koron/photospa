(async (g)=> {
  "use strict"

  const SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/${file}`
  });

  const resp = await fetch('/photospa.db');

  const data = new Uint8Array(await resp.arrayBuffer());

  const db = new SQL.Database(data);

  const res = db.exec("SELECT * FROM categories LIMIT 10");
  console.log(res);
})(this);
