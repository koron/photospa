import * as duckdb from 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.33.1-dev56.0/+esm';

const photospa = {};
globalThis.photospa = photospa;

const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
const worker_url = URL.createObjectURL(new Blob([`importScripts("${bundle.mainWorker}");`], {type: 'text/javascript'}));

// Create a worker and instantiate the database
const worker = new Worker(worker_url);
const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
// Revoke the worker URL.
URL.revokeObjectURL(worker_url);


const conn = await db.connect();
await conn.query(`INSTALL httpfs; LOAD httpfs; ATTACH '${window.location.origin}/photospa.db' AS photospa (READONLY); USE photospa;`);

photospa.duckdb = db;
photospa.conn = conn;

console.log('Ready!');

async function getImage(path) {
  const r = await conn.query(`SELECT id, directory_id, category_id, path, created_at, hash, title, description, (SELECT name FROM categories WHERE id = i.category_id) AS category FROM images AS i WHERE path = '${path}';`);
  return r.toArray()[0]?.toJSON()
}

async function getTags(imageID) {
  const r = await conn.query(`SELECT t.tag FROM tags AS t JOIN image_tags AS i ON t.id = i.tag_id WHERE i.image_id = ${imageID} ORDER BY t.tag COLLATE NOCASE ASC`);
  return r.toArray().map(row => row.toJSON());
}

async function getDir(path) {
  const r = await conn.query(`SELECT id, parent_id, name, full_path FROM directories WHERE full_path = '${path}';`);
  return r.toArray()[0]?.toJSON();
}

async function getDirImages(dirID) {
  const r = await conn.query(`SELECT i.id, i.directory_id, i.category_id, i.path, i.created_at, i.hash, i.title, i.description, c.name AS category FROM images AS i JOIN categories AS c ON c.id = i.category_id WHERE i.directory_id = ${dirID} ORDER BY i.created_at ASC`);
  return r.toArray().map(row => row.toJSON());
}

async function getDirSubdirs(dirID) {
  const result = await conn.query(`SELECT id, parent_id, name, full_path FROM directories WHERE parent_id = ${dirID} ORDER BY name COLLATE NOCASE ASC`);
  return result.toArray().map(row => row.toJSON());
}

async function handleImage(image) {
  const tags = await getTags(image.id);
  console.log('handleImage', 'image:', image, 'tags:', tags);
  photospa.image = image;
  photospa.tags = tags;
  // TODO: Prepare #photo_image page
  const el = document.querySelector('#photo_img');
  el.src = image.path.slice(1);
  activatePage('#photo_image');
}



async function handleDir(dir) {
  const subdirs = await getDirSubdirs(dir.id);
  const images = await getDirImages(dir.id);
  console.log('handleDir', 'dir:', dir, 'subdirs:', subdirs, 'images:', images);
  photospa.dir = dir;
  photospa.subdirs = subdirs;
  photospa.images = images;

  // Fill subdirs
  const container = document.querySelector('#photo_dir .subdir.container');
  const tmpl = document.querySelector('#tmpl_dir_subdir').content;
  container.replaceChildren();
  subdirs.forEach((subdir) => {
    const clone = tmpl.cloneNode(true);
    const anchor = clone.querySelector('.anchor');
    anchor.innerText = subdir.name;
    anchor.href = '#d/' + subdir.full_path;
    container.appendChild(clone);
  });
  // Fill images
  const imageContainer = document.querySelector('#photo_dir .image.container');
  const imageTempalte = document.querySelector('#tmpl_dir_image').content;
  imageContainer.replaceChildren();
  images.forEach((image) => {
    const clone = imageTempalte.cloneNode(true);
    const [name, category, title, desc, date] = clone.querySelectorAll('.name, .category, .title, .desc, .date');
    name.href = "#i/" + image.path;
    name.innerText = image.path.replace(/^.*\//, '');
    category.innerText = image.category;
    title.innerText = image.title;
    desc.innerText = image.description;
    date.innerText = new Date(image.created_at).toLocaleString();
    imageContainer.appendChild(clone);
  });

  activatePage('#photo_dir');
}

async function handleRouting() {
  const hash = decodeURIComponent(window.location.hash.replace('#', '')) || 'home';
  console.log(`handleRouting: hash=${hash}`);

  switch (hash.slice(0, 2)) {

    case "i/":
      const image = await getImage(hash.slice(2));
      if (typeof image !== 'undefined') {
        return handleImage(image);
      }
      console.log(`no images: hash=${hash}`)
      break;

    case 'd/':
      // Normalization: If the directory path ends with "/", remove it and
      // redirect.
      if (hash.endsWith('/')) {
        location.replace('#' + hash.slice(0, -1));
        return
      }
      const dir = await getDir(hash.slice(2));
      if (typeof dir !== 'undefined') {
        return handleDir(dir);
      }
      console.log(`no directories: hash=${hash}`)
      break;

    // TODO: handle other category.

    default:
      console.log(`no handlers: hash=${hash}`);
      break;
  }

  // TODO: default fallback.
}

async function activatePage(id) {
  id = id.startsWith('#') ? id.slice(1) : id;
  document.querySelectorAll('.page').forEach((el) => {
    if (el.id === id) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);

handleRouting();
