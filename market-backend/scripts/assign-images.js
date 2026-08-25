/**
 * Assign self-hosted catalogue images to every product and store.
 *
 * Idempotent: safe to rerun. Matches by keyword on the product name (first
 * hit wins), and by store name. Junk test rows are hidden rather than imaged.
 *
 *   node scripts/assign-images.js
 */
require('dotenv').config();
const { Client } = require('pg');

const BASE = process.env.STATIC_BASE_URL || 'https://api.fetchmart.com.ng/static';

// [regex on lowercased product name, image slug]
const PRODUCT_RULES = [
  [/cerelac/, 'cerelac'], [/lotion/, 'baby-lotion'], [/pampers|diaper/, 'diapers'],
  [/minced beef/, 'minced-beef'], [/liver/, 'liver'], [/beef/, 'beef'],
  [/bournvita/, 'bournvita'], [/lipton|tea/, 'tea'], [/milo/, 'milo'],
  [/nescaf|coffee/, 'coffee'], [/peak|milk/, 'milk'],
  [/chicken breast/, 'chicken-breast'], [/wings/, 'chicken-wings'],
  [/full chicken/, 'whole-chicken'], [/gizzard/, 'gizzard'],
  [/broom/, 'broom'], [/cloth/, 'cloths'], [/mop/, 'mop'],
  [/curry/, 'curry'], [/groundnut oil/, 'groundnut-oil'], [/knorr|cube/, 'bouillon'],
  [/salt/, 'salt'], [/tomato paste/, 'tomato-paste'],
  [/bay lea/, 'bay-leaves'], [/scent leaf/, 'scent-leaf'], [/thyme/, 'thyme'],
  [/prawn/, 'prawns'], [/catfish/, 'catfish'], [/tilapia/, 'tilapia'], [/titus/, 'mackerel'],
  [/banana/, 'banana'], [/mango/, 'mango'], [/pawpaw/, 'pawpaw'],
  [/pineapple/, 'pineapple'], [/watermelon/, 'watermelon'],
  [/beans/, 'beans'], [/rice/, 'rice'], [/semovita/, 'semolina'], [/garri/, 'garri'],
  [/jik|bleach/, 'bleach'], [/morning fresh/, 'dish-soap'], [/omo|detergent/, 'detergent'],
  [/vim|scouring/, 'scouring'],
  [/cutting board/, 'cutting-board'], [/frying pan/, 'frying-pan'],
  [/pot set/, 'pots'], [/spoon/, 'spoons'],
  [/crayfish/, 'crayfish'], [/ehuru/, 'nutmeg'], [/ogiri/, 'locust-bean'],
  [/uda/, 'uda'], [/uziza/, 'uziza'],
  [/bread/, 'bread'], [/cake/, 'cake'],
  [/close-up|toothpaste/, 'toothpaste'], [/dettol|soap \(/, 'soap'],
  [/dove|body wash/, 'body-wash'], [/toothbrush/, 'toothbrush'], [/shield|roll-on/, 'deodorant'],
  [/jollof/, 'jollof'], [/pepper soup/, 'pepper-soup'], [/suya/, 'suya'],
  [/digestive|biscuit/, 'biscuits'], [/gala|sausage/, 'sausage-roll'], [/pringles|chips/, 'chips'],
  [/ginger/, 'ginger'],
  [/laundry basket/, 'basket'], [/shoe rack/, 'shoe-rack'], [/tupperware|container/, 'containers'],
  [/cucumber/, 'cucumber'], [/onion/, 'onions'], [/scotch bonnet|pepper/, 'scotch-bonnet'],
  [/tomato/, 'tomatoes'], [/ugu/, 'ugu'],
];

const STORE_RULES = [
  [/fresh greens/, 'greengrocer'], [/city mart/, 'supermarket'],
  [/quick essentials/, 'convenience'], [/butchery|butcher/, 'butcher'],
  [/spice route/, 'spices'], [/home harbour/, 'market'],
  [/t-medix|demo grocery/, 'grocery'],
];

// Test artifacts that must never show to customers.
const HIDE = [/^audit /i, /^flower$/i, /^test/i];

function slugFor(rules, name) {
  const n = name.toLowerCase();
  for (const [re, slug] of rules) if (re.test(n)) return slug;
  return null;
}

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  let set = 0, hidden = 0, unmatched = [];
  for (const p of (await c.query('SELECT id, name FROM products')).rows) {
    if (HIDE.some((re) => re.test(p.name))) {
      await c.query('UPDATE products SET is_available=false WHERE id=$1', [p.id]);
      hidden++; continue;
    }
    const slug = slugFor(PRODUCT_RULES, p.name);
    if (!slug) { unmatched.push(p.name); continue; }
    await c.query('UPDATE products SET image_url=$1 WHERE id=$2',
      [`${BASE}/products/${slug}.jpg`, p.id]);
    set++;
  }

  let sset = 0;
  for (const s of (await c.query('SELECT id, name FROM stores')).rows) {
    const slug = slugFor(STORE_RULES, s.name) || 'grocery';
    await c.query('UPDATE stores SET image_url=$1 WHERE id=$2',
      [`${BASE}/stores/${slug}.jpg`, s.id]);
    sset++;
  }

  console.log(`products imaged: ${set}, hidden: ${hidden}, unmatched: ${unmatched.length}`);
  if (unmatched.length) console.log('  unmatched:', unmatched.join(' | '));
  console.log(`stores imaged: ${sset}`);
  await c.end();
})();
