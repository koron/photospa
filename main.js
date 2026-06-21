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
