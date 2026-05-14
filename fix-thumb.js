const { MongoClient } = require('mongodb');

const URI = 'mongodb+srv://akunrobloxkumedimemed_db_user:komiku123@komiku.e45tbfo.mongodb.net/?appName=Komiku';

function getHD(url) {
  if (!url) return url;
  return url.split('?')[0].replace(/-\d+x\d+(\.\w+)$/, '$1');
}

async function fix() {
  const client = new MongoClient(URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 60000,
    connectTimeoutMS: 30000,
  });
  await client.connect();
  const db = client.db('komiku');

  // Fix home_cache
  const home = await db.collection('home_cache').findOne({ _id: 'home' });
  if (home) {
    home.data.forEach(cat => {
      cat.items.forEach(item => {
        item.thumb = getHD(item.thumb);
      });
    });
    await db.collection('home_cache').updateOne(
      { _id: 'home' },
      { $set: { data: home.data } }
    );
    console.log('✅ home_cache fixed');
  }

  // Fix manga_detail pakai bulkWrite — 1 request aja, jauh lebih cepet
  const mangas = await db.collection('manga_detail')
    .find({}, { projection: { _id: 1, 'data.thumb': 1 } })
    .toArray();

  const bulkOps = mangas
    .filter(m => m.data && m.data.thumb)
    .map(m => ({
      updateOne: {
        filter: { _id: m._id },
        update: { $set: { 'data.thumb': getHD(m.data.thumb) } }
      }
    }));

  if (bulkOps.length > 0) {
    const result = await db.collection('manga_detail').bulkWrite(bulkOps, { ordered: false });
    console.log('✅ manga_detail fixed (' + result.modifiedCount + '/' + bulkOps.length + ' manga)');
  }

  await client.close();
  console.log('✅ SELESAI! Refresh app lo.');
}

fix().catch(console.error);
