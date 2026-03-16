import { PrismaClient, UserRole, OrderStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Create store owner users
  const storeOwners = await Promise.all([
    prisma.user.upsert({
      where: { email: 'freshmart@example.com' },
      update: {},
      create: {
        email: 'freshmart@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Fresh Mart',
        phone: '+2348012345001',
        role: UserRole.STORE,
      },
    }),
    prisma.user.upsert({
      where: { email: 'groceryplus@example.com' },
      update: {},
      create: {
        email: 'groceryplus@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Grocery Plus',
        phone: '+2348012345002',
        role: UserRole.STORE,
      },
    }),
    prisma.user.upsert({
      where: { email: 'quickshop@example.com' },
      update: {},
      create: {
        email: 'quickshop@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Quick Shop',
        phone: '+2348012345003',
        role: UserRole.STORE,
      },
    }),
    prisma.user.upsert({
      where: { email: 'supervalue@example.com' },
      update: {},
      create: {
        email: 'supervalue@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Super Value',
        phone: '+2348012345004',
        role: UserRole.STORE,
      },
    }),
  ]);

  console.log(`✅ Created ${storeOwners.length} store owner users`);

  // Create stores (all in Lekki area for realistic routing)
  const stores = await Promise.all([
    prisma.store.upsert({
      where: { ownerUserId: storeOwners[0].id },
      update: { 
        isOpen: true,
        latitude: 6.4498,
        longitude: 3.4723,
      },
      create: {
        ownerUserId: storeOwners[0].id,
        name: 'Fresh Mart',
        description: 'Your one-stop shop for fresh produce and groceries',
        latitude: 6.4498,  // Lekki Phase 1
        longitude: 3.4723,
        isOpen: true,
      },
    }),
    prisma.store.upsert({
      where: { ownerUserId: storeOwners[1].id },
      update: { 
        isOpen: true,
        latitude: 6.4312,
        longitude: 3.4456,
      },
      create: {
        ownerUserId: storeOwners[1].id,
        name: 'Grocery Plus',
        description: 'Quality groceries at affordable prices',
        latitude: 6.4312,  // Victoria Island
        longitude: 3.4456,
        isOpen: true,
      },
    }),
    prisma.store.upsert({
      where: { ownerUserId: storeOwners[2].id },
      update: { 
        isOpen: true,
        latitude: 6.4401,
        longitude: 3.4589,
      },
      create: {
        ownerUserId: storeOwners[2].id,
        name: 'Quick Shop',
        description: 'Fast delivery, great selection',
        latitude: 6.4401,  // Oniru, Lekki
        longitude: 3.4589,
        isOpen: true,
      },
    }),
    prisma.store.upsert({
      where: { ownerUserId: storeOwners[3].id },
      update: { isOpen: false },
      create: {
        ownerUserId: storeOwners[3].id,
        name: 'Super Value',
        description: 'Best value for your money',
        latitude: 6.5300,
        longitude: 3.3700,
        isOpen: false,
      },
    }),
  ]);

  console.log(`✅ Created ${stores.length} stores`);

  // Sample products for each store (without category - can be assigned later via UI)
  const productData = [
    // Fresh Mart products
    { storeId: stores[0].id, name: 'Fresh Tomato', description: 'Locally grown fresh tomatoes', price: 2300, stockQuantity: 50 },
    { storeId: stores[0].id, name: 'Wine', description: 'Premium red wine', price: 2300, stockQuantity: 20 },
    { storeId: stores[0].id, name: 'Bag of Rice', description: '50kg bag of premium rice', price: 5000, stockQuantity: 30 },
    { storeId: stores[0].id, name: 'Nescafe', description: 'Instant coffee 200g', price: 2300, stockQuantity: 40 },
    { storeId: stores[0].id, name: 'Cleaning Set', description: 'Complete home cleaning set', price: 3500, stockQuantity: 15 },
    { storeId: stores[0].id, name: 'Adjustable Iron Mops', description: 'Heavy duty iron mops', price: 3500, stockQuantity: 25 },
    
    // Grocery Plus products
    { storeId: stores[1].id, name: 'Pack of HB Pencils', description: '12 pieces HB pencils', price: 2000, stockQuantity: 100 },
    { storeId: stores[1].id, name: 'Diary', description: '2024 Executive diary', price: 6000, stockQuantity: 50 },
    { storeId: stores[1].id, name: 'Marker Set', description: 'Colored markers 12 pack', price: 1000, stockQuantity: 60 },
    { storeId: stores[1].id, name: 'Cooking Oil', description: '5L vegetable oil', price: 4500, stockQuantity: 35 },
    { storeId: stores[1].id, name: 'Sugar', description: '1kg refined sugar', price: 1200, stockQuantity: 80 },
    
    // Quick Shop products
    { storeId: stores[2].id, name: 'Soap Bar', description: 'Antibacterial soap 6 pack', price: 1500, stockQuantity: 70 },
    { storeId: stores[2].id, name: 'Detergent', description: '2kg washing powder', price: 2800, stockQuantity: 45 },
    { storeId: stores[2].id, name: 'Fresh Eggs', description: 'Crate of 30 eggs', price: 3200, stockQuantity: 25 },
    { storeId: stores[2].id, name: 'Bread', description: 'Fresh baked bread loaf', price: 800, stockQuantity: 40 },
    
    // Super Value products
    { storeId: stores[3].id, name: 'Milk', description: '1L fresh milk', price: 1800, stockQuantity: 30 },
    { storeId: stores[3].id, name: 'Butter', description: '500g butter pack', price: 2500, stockQuantity: 20 },
    { storeId: stores[3].id, name: 'Cheese', description: 'Cheddar cheese 250g', price: 3000, stockQuantity: 15 },
  ];

  for (const product of productData) {
    await prisma.product.upsert({
      where: {
        id: `${product.storeId}-${product.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        ...product,
        isAvailable: true,
      },
    });
  }

  console.log(`✅ Created ${productData.length} products`);

  // Create a customer user with address and location (Chevron, Lekki)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {
      address: '15 Chevron Drive, Lekki, Lagos',
      latitude: 6.4355,
      longitude: 3.5155,
    },
    create: {
      email: 'customer@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'John Customer',
      phone: '+2348012345100',
      role: UserRole.CUSTOMER,
      address: '15 Chevron Drive, Lekki, Lagos',
      latitude: 6.4355,
      longitude: 3.5155,
    },
  });

  console.log('✅ Created customer user');

  // Create a rider user
  const riderUser = await prisma.user.upsert({
    where: { email: 'rider@example.com' },
    update: {},
    create: {
      email: 'rider@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Mike Rider',
      phone: '+2348012345200',
      role: UserRole.RIDER,
    },
  });

  // Create rider profile (Eko Hotel, Victoria Island - near Lekki)
  const rider = await prisma.rider.upsert({
    where: { userId: riderUser.id },
    update: {
      isAvailable: true,
      currentLatitude: 6.4281,
      currentLongitude: 3.4219,
    },
    create: {
      userId: riderUser.id,
      isAvailable: true,
      currentLatitude: 6.4281,
      currentLongitude: 3.4219,
      lastPingAt: new Date(),
    },
  });

  console.log('✅ Created rider user and profile');

  // Update store with address
  await prisma.user.update({
    where: { id: storeOwners[0].id },
    data: {
      address: '25 Allen Avenue, Ikeja, Lagos',
    },
  });

  // Get a product from the first store for orders
  const product = await prisma.product.findFirst({
    where: { storeId: stores[0].id },
  });

  if (product) {
    // Create 1 active order (ASSIGNED status - rider needs to pick up)
    const activeOrder = await prisma.order.upsert({
      where: { id: 'seed-active-order-1' },
      update: {
        status: OrderStatus.ASSIGNED,
        riderId: rider.id,
        assignedAt: new Date(),
      },
      create: {
        id: 'seed-active-order-1',
        customerUserId: customer.id,
        storeId: stores[0].id,
        riderId: rider.id,
        status: OrderStatus.ASSIGNED,
        totalAmount: 4600,
        assignedAt: new Date(),
      },
    });

    // Create order items for active order
    await prisma.orderItem.upsert({
      where: { id: 'seed-active-order-1-item-1' },
      update: {},
      create: {
        id: 'seed-active-order-1-item-1',
        orderId: activeOrder.id,
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 2,
      },
    });

    console.log('✅ Created 1 active delivery');

    // Create 5 available orders for riders to pick up (READY status)
    const availableOrdersData = [
      { id: 'seed-available-order-1', storeIndex: 0, amount: 3500, productQty: 2 },
      { id: 'seed-available-order-2', storeIndex: 1, amount: 4200, productQty: 3 },
      { id: 'seed-available-order-3', storeIndex: 0, amount: 2800, productQty: 1 },
      { id: 'seed-available-order-4', storeIndex: 2, amount: 5600, productQty: 4 },
      { id: 'seed-available-order-5', storeIndex: 1, amount: 3100, productQty: 2 },
    ];

    for (const orderData of availableOrdersData) {
      const storeForOrder = stores[orderData.storeIndex];
      const productForOrder = await prisma.product.findFirst({
        where: { storeId: storeForOrder.id },
      });

      if (productForOrder) {
        const availableOrder = await prisma.order.upsert({
          where: { id: orderData.id },
          update: { status: OrderStatus.READY },
          create: {
            id: orderData.id,
            customerUserId: customer.id,
            storeId: storeForOrder.id,
            riderId: null, // No rider assigned yet - available for pickup
            status: OrderStatus.READY,
            totalAmount: orderData.amount,
          },
        });

        await prisma.orderItem.upsert({
          where: { id: `${orderData.id}-item-1` },
          update: {},
          create: {
            id: `${orderData.id}-item-1`,
            orderId: availableOrder.id,
            productId: productForOrder.id,
            productName: productForOrder.name,
            unitPrice: productForOrder.price,
            quantity: orderData.productQty,
          },
        });
      }
    }

    console.log('✅ Created 5 available orders for rider pickup');

    // Create 2 completed orders
    const completedOrder1 = await prisma.order.upsert({
      where: { id: 'seed-completed-order-1' },
      update: { status: OrderStatus.COMPLETED },
      create: {
        id: 'seed-completed-order-1',
        customerUserId: customer.id,
        storeId: stores[0].id,
        riderId: rider.id,
        status: OrderStatus.COMPLETED,
        totalAmount: 5000,
        assignedAt: new Date(Date.now() - 86400000), // 1 day ago
      },
    });

    await prisma.orderItem.upsert({
      where: { id: 'seed-completed-order-1-item-1' },
      update: {},
      create: {
        id: 'seed-completed-order-1-item-1',
        orderId: completedOrder1.id,
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 2,
      },
    });

    const completedOrder2 = await prisma.order.upsert({
      where: { id: 'seed-completed-order-2' },
      update: { status: OrderStatus.COMPLETED },
      create: {
        id: 'seed-completed-order-2',
        customerUserId: customer.id,
        storeId: stores[1].id,
        riderId: rider.id,
        status: OrderStatus.COMPLETED,
        totalAmount: 8000,
        assignedAt: new Date(Date.now() - 172800000), // 2 days ago
      },
    });

    const product2 = await prisma.product.findFirst({
      where: { storeId: stores[1].id },
    });

    if (product2) {
      await prisma.orderItem.upsert({
        where: { id: 'seed-completed-order-2-item-1' },
        update: {},
        create: {
          id: 'seed-completed-order-2-item-1',
          orderId: completedOrder2.id,
          productId: product2.id,
          productName: product2.name,
          unitPrice: product2.price,
          quantity: 4,
        },
      });
    }

    console.log('✅ Created 2 completed deliveries');
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
