import * as duckdb from 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.33.1-dev56.0/+esm';

const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
const worker_url = URL.createObjectURL(new Blob([`importScripts("${bundle.mainWorker}");`], {type: 'text/javascript'}));

// Create a worker and instantiate the database
const worker = new Worker(worker_url);
const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
// Revoke the worker URL.
URL.revokeObjectURL(worker_url);


const conn = await db.connect();
await conn.query('INSTALL httpfs;');
await conn.query('LOAD httpfs;');

await conn.query(`ATTACH '${window.location.origin}/photospa.db' AS photospa (READONLY)`);
await conn.query(`USE photospa;`);

window.duckdb = db;
window.conn = conn;

console.log('Ready!');

async function getImage(path) {
  const r = await conn.query(`SELECT id, directory_id, category_id, path, created_at, hash, description, (SELECT name FROM categories WHERE id = i.category_id) AS category FROM images AS i WHERE path = '${path}';`);
  return r.toArray()[0];
}

async function getTags(imageID) {
  const r = await conn.query(`SELECT t.tag FROM tags AS t JOIN image_tags AS i ON t.id = i.tag_id WHERE i.image_id = ${imageID} ORDER BY t.tag ASC`);
  return r.toArray();
}

async function handleRouting() {
  const hash = window.location.hash.replace('#', '') || 'home';
  console.log(`handleRouting: hash=${hash}`);

  const entry = await getImage(hash);
  if (typeof entry !== 'undefined') {
    const tags = await getTags(entry.id);
    console.log(`found image: entry=${entry} tags=${tags}`);
    // TODO:
    //window.entry = entry;
    const el = document.querySelector('#photo_img');
    el.src = entry.path.slice(1);
    return;
  }

  // TODO: handle other category.
  console.log(`no images: hash=${hash}`)
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);

handleRouting();
