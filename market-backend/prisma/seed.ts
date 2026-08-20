import { PrismaClient, UserRole, OrderStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Store definitions ────────────────────────────────────────────────────────
// All within ~20 km of (6.5244, 3.3792) — the default customer query origin.

const STORES = [
  {
    email: 'freshgreens@fetchmart.com',
    ownerName: 'Amaka Obi',
    name: 'Fresh Greens Market',
    description: 'Farm-fresh produce, fruits and vegetables delivered daily',
    lat: 6.5139, lng: 3.3786,   // Yaba — 1.3 km
    isOpen: true,
    categories: [
      {
        name: 'Fruits',
        products: [
          { name: 'Banana Bunch', description: '1 bunch of ripe bananas', price: 800, stock: 60 },
          { name: 'Watermelon', description: 'Large seedless watermelon', price: 3500, stock: 20 },
          { name: 'Pineapple', description: 'Fresh whole pineapple', price: 1200, stock: 35 },
          { name: 'Pawpaw', description: 'Ripe Nigerian pawpaw', price: 1500, stock: 25 },
          { name: 'Mango (12 pack)', description: 'Julie mango, sweet and ripe', price: 2000, stock: 40 },
        ],
      },
      {
        name: 'Vegetables',
        products: [
          { name: 'Tomatoes (1kg)', description: 'Fresh plum tomatoes', price: 1200, stock: 80 },
          { name: 'Ugu Leaves (bundle)', description: 'Fresh fluted pumpkin leaves', price: 500, stock: 50 },
          { name: 'Scotch Bonnet Peppers', description: 'Fresh hot peppers, 500g', price: 800, stock: 60 },
          { name: 'Onions (1kg)', description: 'Red onions, firm and fresh', price: 900, stock: 70 },
          { name: 'Cucumber (3 pack)', description: 'Farm-fresh cucumbers', price: 600, stock: 45 },
        ],
      },
      {
        name: 'Grains',
        products: [
          { name: 'Ofada Rice (1kg)', description: 'Local Nigerian parboiled rice', price: 1800, stock: 100 },
          { name: 'Yellow Garri (1kg)', description: 'Medium-coarse yellow garri', price: 700, stock: 120 },
          { name: 'Semovita (1kg)', description: 'Golden penny semolina', price: 1500, stock: 80 },
          { name: 'Beans (1kg)', description: 'Honey beans, cleaned and sorted', price: 2000, stock: 65 },
        ],
      },
    ],
  },
  {
    email: 'citymart@fetchmart.com',
    ownerName: 'Chidi Nwosu',
    name: 'City Mart',
    description: 'Your everyday supermarket — groceries, household and more',
    lat: 6.5008, lng: 3.3586,   // Surulere — 2.7 km
    isOpen: true,
    categories: [
      {
        name: 'Beverages',
        products: [
          { name: 'Peak Milk (400g)', description: 'Full cream powdered milk', price: 2800, stock: 90 },
          { name: 'Milo (400g)', description: 'Chocolate malt drink, 400g tin', price: 3200, stock: 75 },
          { name: 'Nescafé (100g)', description: 'Classic instant coffee', price: 2500, stock: 60 },
          { name: 'Lipton Tea (50 bags)', description: 'Yellow label tea bags', price: 1200, stock: 100 },
          { name: 'Bournvita (500g)', description: 'Cocoa drink mix, 500g', price: 3500, stock: 50 },
        ],
      },
      {
        name: 'Cooking Essentials',
        products: [
          { name: 'Groundnut Oil (2L)', description: 'Pure groundnut cooking oil', price: 4500, stock: 45 },
          { name: 'Knorr Cubes (50 pack)', description: 'Seasoning cubes, value pack', price: 800, stock: 150 },
          { name: 'Tomato Paste (400g)', description: 'Tin tomato, double concentrate', price: 1200, stock: 80 },
          { name: 'Salt (500g)', description: 'Iodized table salt', price: 400, stock: 200 },
          { name: 'Curry Powder (100g)', description: 'Tropical Sun curry blend', price: 600, stock: 90 },
        ],
      },
      {
        name: 'Snacks',
        products: [
          { name: 'Digestive Biscuits', description: 'McVities digestive 400g', price: 1800, stock: 60 },
          { name: 'Gala Sausage Roll (5 pack)', description: 'UAC meat pie snack', price: 2500, stock: 40 },
          { name: 'Pringles (Original)', description: 'Potato crisps, 165g can', price: 3000, stock: 30 },
        ],
      },
    ],
  },
  {
    email: 'quickessentials@fetchmart.com',
    ownerName: 'Tunde Bakare',
    name: 'Quick Essentials',
    description: 'Fast delivery on everyday must-haves',
    lat: 6.5300, lng: 3.3580,   // Mushin — 2.9 km
    isOpen: true,
    categories: [
      {
        name: 'Personal Care',
        products: [
          { name: 'Dove Body Wash (400ml)', description: 'Moisturising shower gel', price: 3500, stock: 50 },
          { name: 'Dettol Soap (4 pack)', description: 'Antibacterial soap bars', price: 2200, stock: 80 },
          { name: 'Oral-B Toothbrush', description: 'Soft medium toothbrush', price: 1500, stock: 60 },
          { name: 'Close-Up Toothpaste', description: 'Red gel toothpaste 100ml', price: 1200, stock: 70 },
          { name: 'Shield Roll-On (150ml)', description: 'Deodorant anti-perspirant', price: 2800, stock: 40 },
        ],
      },
      {
        name: 'Household Cleaning',
        products: [
          { name: 'Omo Detergent (2kg)', description: 'Washing powder, auto formula', price: 3800, stock: 55 },
          { name: 'Jik Bleach (750ml)', description: 'Multipurpose liquid bleach', price: 1500, stock: 45 },
          { name: 'Vim Scouring Powder', description: 'Surface cleaner 500g', price: 900, stock: 60 },
          { name: 'Morning Fresh (500ml)', description: 'Dishwashing liquid', price: 1800, stock: 50 },
        ],
      },
      {
        name: 'Baby & Kids',
        products: [
          { name: 'Pampers (M, 40 count)', description: 'Baby dry diapers size M', price: 7500, stock: 30 },
          { name: 'Cerelac (400g)', description: 'Nestlé wheat baby cereal', price: 4500, stock: 25 },
          { name: 'Johnson Baby Lotion', description: 'Gentle moisturising lotion 500ml', price: 3200, stock: 35 },
        ],
      },
    ],
  },
  {
    email: 'homeharbour@fetchmart.com',
    ownerName: 'Ngozi Eze',
    name: 'Home Harbour',
    description: 'Everything your home needs, one stop shop',
    lat: 6.6018, lng: 3.3515,   // Ikeja — 8.6 km
    isOpen: true,
    categories: [
      {
        name: 'Kitchen',
        products: [
          { name: 'Non-stick Frying Pan (28cm)', description: 'Granite-coated pan with lid', price: 12000, stock: 20 },
          { name: 'Stainless Pot Set (3pc)', description: 'Medium cooking pots with lids', price: 18000, stock: 15 },
          { name: 'Wooden Stirring Spoon Set', description: '3-piece wooden kitchen spoons', price: 2500, stock: 40 },
          { name: 'Cutting Board (Large)', description: 'Bamboo chopping board', price: 4500, stock: 25 },
        ],
      },
      {
        name: 'Cleaning',
        products: [
          { name: 'Mop & Bucket Set', description: 'Spin mop with wringer bucket', price: 15000, stock: 18 },
          { name: 'Broom & Dustpan Set', description: 'Long-handled broom combo', price: 5500, stock: 30 },
          { name: 'Microfibre Cloths (10 pack)', description: 'Multi-surface cleaning cloths', price: 3000, stock: 45 },
        ],
      },
      {
        name: 'Storage',
        products: [
          { name: 'Tupperware Set (5pc)', description: 'Airtight food storage containers', price: 8500, stock: 22 },
          { name: 'Laundry Basket (Large)', description: 'Woven plastic hamper with lid', price: 6000, stock: 20 },
          { name: 'Shoe Rack (5-tier)', description: 'Metal shoe organiser', price: 11000, stock: 12 },
        ],
      },
    ],
  },
  {
    email: 'spiceroute@fetchmart.com',
    ownerName: 'Funmi Adeyemi',
    name: 'Spice Route',
    description: 'Authentic Nigerian and West African spices, herbs and seasonings',
    lat: 6.4550, lng: 3.3841,   // Lagos Island — 7.6 km
    isOpen: true,
    categories: [
      {
        name: 'Nigerian Spices',
        products: [
          { name: 'Ehuru (Calabash Nutmeg)', description: 'Dried ehuru seeds, 100g', price: 1500, stock: 60 },
          { name: 'Ogiri (Fermented Locust Bean)', description: 'Traditional seasoning, 100g', price: 800, stock: 50 },
          { name: 'Crayfish (Ground, 200g)', description: 'Premium dried crayfish powder', price: 2500, stock: 70 },
          { name: 'Uziza Seeds (100g)', description: 'Hot peppery seeds for soups', price: 1200, stock: 45 },
          { name: 'Uda (Negro Pepper)', description: 'Cloves-like spice, 100g', price: 1000, stock: 55 },
        ],
      },
      {
        name: 'Dried Herbs',
        products: [
          { name: 'Dried Scent Leaf (50g)', description: 'Efirin — aromatic herb for jollof', price: 600, stock: 80 },
          { name: 'Dried Thyme (100g)', description: 'Garden thyme, ground and sieved', price: 700, stock: 90 },
          { name: 'Bay Leaves (50g)', description: 'Dried laurel leaves', price: 500, stock: 70 },
        ],
      },
      {
        name: 'Seasoning Blends',
        products: [
          { name: 'Suya Spice Mix (200g)', description: 'Authentic suya pepper blend', price: 1800, stock: 65 },
          { name: 'Jollof Rice Blend (150g)', description: 'Pre-mixed jollof seasoning', price: 1500, stock: 80 },
          { name: 'Pepper Soup Mix (100g)', description: 'Native pepper soup spice blend', price: 1200, stock: 55 },
        ],
      },
    ],
  },
  {
    email: 'lagosbutchery@fetchmart.com',
    ownerName: 'Emeka Okafor',
    name: 'Lagos Butchery',
    description: 'Fresh halal meat, poultry and seafood — cut to order',
    lat: 6.4312, lng: 3.4120,   // Victoria Island — 10.2 km
    isOpen: false,
    categories: [
      {
        name: 'Chicken',
        products: [
          { name: 'Full Chicken (1.5kg)', description: 'Fresh whole broiler chicken', price: 5500, stock: 30 },
          { name: 'Chicken Breast (1kg)', description: 'Boneless skinless breast fillet', price: 4800, stock: 25 },
          { name: 'Chicken Wings (1kg)', description: 'Marinated party wings', price: 3500, stock: 35 },
          { name: 'Gizzard (500g)', description: 'Cleaned fresh chicken gizzards', price: 2500, stock: 40 },
        ],
      },
      {
        name: 'Beef',
        products: [
          { name: 'Beef Chuck (1kg)', description: 'Nigerian cut, bone-in stewing beef', price: 7000, stock: 20 },
          { name: 'Beef Liver (500g)', description: 'Fresh beef liver, cleaned', price: 3500, stock: 15 },
          { name: 'Minced Beef (500g)', description: 'Lean ground beef, freshly minced', price: 4000, stock: 18 },
        ],
      },
      {
        name: 'Fish & Seafood',
        products: [
          { name: 'Titus Fish (2 pieces)', description: 'Fresh mackerel, gutted and cleaned', price: 3200, stock: 25 },
          { name: 'Tilapia (1kg)', description: 'Fresh whole tilapia, scaled', price: 4500, stock: 20 },
          { name: 'Jumbo Prawns (500g)', description: 'Fresh shelled prawns', price: 8500, stock: 15 },
          { name: 'Smoked Catfish', description: 'Smoke-dried catfish, medium', price: 3500, stock: 30 },
        ],
      },
    ],
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Seeding database...\n');

  const passwordHash = await bcrypt.hash('password123', 10);

  // ── Platform settings singleton (pricing / commission defaults) ──────────
  const existingSettings = await prisma.platformSettings.findFirst();
  if (!existingSettings) {
    await prisma.platformSettings.create({ data: {} });
    console.log('Platform settings: created with defaults');
  } else {
    console.log('Platform settings: already present');
  }

  // ── Accounts: admin, customer, rider ──────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fetchmart.com' },
    update: {},
    create: {
      email: 'admin@fetchmart.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      name: 'Admin User',
      phone: '+2348000000001',
      role: UserRole.ADMIN,
    },
  });
  console.log('Admin:', admin.email);

  const customer = await prisma.user.upsert({
    where: { email: 'customer@fetchmart.com' },
    update: { address: '14 Akin Adesola Street, Victoria Island, Lagos', latitude: 6.4281, longitude: 3.4219 },
    create: {
      email: 'customer@fetchmart.com',
      passwordHash,
      name: 'Temi Adeoye',
      phone: '+2348011111111',
      role: UserRole.CUSTOMER,
      address: '14 Akin Adesola Street, Victoria Island, Lagos',
      latitude: 6.4281,
      longitude: 3.4219,
    },
  });
  console.log('Customer:', customer.email);

  const riderUser = await prisma.user.upsert({
    where: { email: 'rider@fetchmart.com' },
    update: {},
    create: {
      email: 'rider@fetchmart.com',
      passwordHash,
      name: 'Seun Ogundimu',
      phone: '+2348022222222',
      role: UserRole.RIDER,
    },
  });
  await prisma.rider.upsert({
    where: { userId: riderUser.id },
    update: { isAvailable: true, currentLatitude: 6.4310, currentLongitude: 3.4270, lastPingAt: new Date() },
    create: { userId: riderUser.id, isAvailable: true, currentLatitude: 6.4310, currentLongitude: 3.4270, lastPingAt: new Date() },
  });
  console.log('Rider:', riderUser.email);

  // ── Stores, categories and products ──────────────────────────────────────
  let totalProducts = 0;

  for (const storeDef of STORES) {
    // Owner user
    const owner = await prisma.user.upsert({
      where: { email: storeDef.email },
      update: {},
      create: {
        email: storeDef.email,
        passwordHash,
        name: storeDef.ownerName,
        phone: `+234801${Math.floor(Math.random() * 9000000 + 1000000)}`,
        role: UserRole.STORE,
        address: storeDef.name + ' HQ, Lagos',
        latitude: storeDef.lat,
        longitude: storeDef.lng,
      },
    });

    // Store
    const store = await prisma.store.upsert({
      where: { ownerUserId: owner.id },
      update: { name: storeDef.name, description: storeDef.description, isOpen: storeDef.isOpen, latitude: storeDef.lat, longitude: storeDef.lng },
      create: {
        ownerUserId: owner.id,
        name: storeDef.name,
        description: storeDef.description,
        latitude: storeDef.lat,
        longitude: storeDef.lng,
        isOpen: storeDef.isOpen,
      },
    });

    // Categories and products
    for (const catDef of storeDef.categories) {
      const existingCat = await prisma.category.findFirst({ where: { storeId: store.id, name: catDef.name } });
      const category = existingCat ?? await prisma.category.create({ data: { storeId: store.id, name: catDef.name } });

      for (const p of catDef.products) {
        const exists = await prisma.product.findFirst({ where: { storeId: store.id, name: p.name } });
        if (!exists) {
          await prisma.product.create({
            data: {
              storeId: store.id,
              categoryId: category.id,
              name: p.name,
              description: p.description,
              price: p.price,
              stockQuantity: p.stock,
              isAvailable: true,
            },
          });
          totalProducts++;
        }
      }
    }

    console.log(`Store seeded: ${storeDef.name} (${storeDef.categories.length} categories)`);
  }

  console.log(`\nTotal products created: ${totalProducts}`);

  // ── Sample orders ─────────────────────────────────────────────────────────
  const firstStore = await prisma.store.findFirst({ where: { name: 'Fresh Greens Market' } });
  const sampleProduct = firstStore ? await prisma.product.findFirst({ where: { storeId: firstStore.id } }) : null;
  const rider = await prisma.rider.findFirst({ where: { userId: riderUser.id } });

  if (firstStore && sampleProduct && rider) {
    const orderStatuses = [
      { id: 'seed-order-completed-1', status: OrderStatus.COMPLETED, riderId: rider.id, amount: 4600 },
      { id: 'seed-order-completed-2', status: OrderStatus.COMPLETED, riderId: rider.id, amount: 7200 },
      { id: 'seed-order-ready-1',     status: OrderStatus.READY,     riderId: null,     amount: 3500 },
    ];

    for (const o of orderStatuses) {
      const order = await prisma.order.upsert({
        where: { id: o.id },
        update: { status: o.status },
        create: {
          id: o.id,
          customerUserId: customer.id,
          storeId: firstStore.id,
          riderId: o.riderId,
          status: o.status,
          totalAmount: o.amount,
          assignedAt: o.riderId ? new Date(Date.now() - 86400000) : null,
        },
      });

      const itemId = `${o.id}-item-1`;
      const itemExists = await prisma.orderItem.findUnique({ where: { id: itemId } });
      if (!itemExists) {
        await prisma.orderItem.create({
          data: {
            id: itemId,
            orderId: order.id,
            productId: sampleProduct.id,
            productName: sampleProduct.name,
            unitPrice: sampleProduct.price,
            quantity: 2,
          },
        });
      }
    }
    console.log('\nSample orders created');
  }

  console.log('\nSeeding complete.');
}

main()
  .catch(e => { console.error('Seeding failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
