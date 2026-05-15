import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const categories = [
  { name: 'Pizza', icon: '🍕', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38' },
  { name: 'Burger', icon: '🍔', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd' },
  { name: 'African', icon: '🍛', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19' },
  { name: 'Chinese', icon: '🥡', image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e' },
  { name: 'Dessert', icon: '🍰', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b' },
  { name: 'Drinks', icon: '🥤', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e' },
  { name: 'Salad', icon: '🥗', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd' },
  { name: 'Seafood', icon: '🦐', image: 'https://images.unsplash.com/photo-1559742811-822f4580b12e' },
];

const restaurants = [
  {
    name: 'Swahili Flavors',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
    cuisine: 'African',
    rating: 4.8,
    ratingCount: 245,
    deliveryFee: 2000,
    deliveryTime: '25-35 min',
    distance: '1.2 km',
    address: '123 Mafinga Street, Dar es Salaam',
    latitude: -6.7924,
    longitude: 39.2083,
    isOpen: true,
  },
  {
    name: "Mama's Kitchen",
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
    cuisine: 'African',
    rating: 4.6,
    ratingCount: 189,
    deliveryFee: 1500,
    deliveryTime: '20-30 min',
    distance: '0.8 km',
    address: '456 Kivukoni Road, Dar es Salaam',
    latitude: -6.8,
    longitude: 39.22,
    isOpen: true,
  },
  {
    name: 'Pizza Planet',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
    cuisine: 'Italian',
    rating: 4.5,
    ratingCount: 312,
    deliveryFee: 2500,
    deliveryTime: '30-40 min',
    distance: '2.1 km',
    address: '789 Samora Avenue, Dar es Salaam',
    latitude: -6.81,
    longitude: 39.24,
    isOpen: true,
  },
  {
    name: 'Bao Bites',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
    cuisine: 'Chinese',
    rating: 4.3,
    ratingCount: 156,
    deliveryFee: 3000,
    deliveryTime: '35-45 min',
    distance: '3.0 km',
    address: '101 India Street, Dar es Salaam',
    latitude: -6.82,
    longitude: 39.26,
    isOpen: true,
  },
];

const menuItemsByRestaurant: Record<
  number,
  { name: string; description: string; price: number; image: string; category: string; isPopular?: boolean }[]
> = {
  0: [
    {
      name: 'Octopus Curry',
      description: 'Tender octopus simmered in aromatic coconut curry sauce with traditional spices',
      price: 15000,
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641',
      category: 'Main Course',
      isPopular: true,
    },
    {
      name: 'Zanzibar Pizza',
      description: 'Stuffed flatbread with minced meat, eggs, and vegetables',
      price: 8000,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
      category: 'Appetizer',
      isPopular: true,
    },
    {
      name: 'Coconut Rice',
      description: 'Fragrant basmati rice cooked in coconut milk with spices',
      price: 5000,
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19',
      category: 'Sides',
    },
    {
      name: 'Mango Lassi',
      description: 'Creamy yogurt drink blended with fresh mango',
      price: 4000,
      image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e',
      category: 'Drinks',
    },
    {
      name: 'Grilled Tilapia',
      description: 'Fresh tilapia grilled with herbs and served with ugali',
      price: 12000,
      image: 'https://images.unsplash.com/photo-1559742811-822f4580b12e',
      category: 'Main Course',
      isPopular: true,
    },
    {
      name: 'Samosa Platter',
      description: 'Crispy triangular pastries filled with spiced meat or vegetables',
      price: 6000,
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641',
      category: 'Appetizer',
    },
  ],
  1: [
    {
      name: 'Ugali & Fish',
      description: 'Traditional maize meal served with fried tilapia and kachumbari',
      price: 10000,
      image: 'https://images.unsplash.com/photo-1559742811-822f4580b12e',
      category: 'Main Course',
      isPopular: true,
    },
    {
      name: 'Nyama Choma',
      description: 'Grilled beef served with kachumbari and ugali',
      price: 18000,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947',
      category: 'Main Course',
      isPopular: true,
    },
    {
      name: 'Chipsi Mayai',
      description: 'Tanzanian-style fries and eggs omelette',
      price: 5000,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
      category: 'Breakfast',
    },
    {
      name: 'Mandazi',
      description: 'Sweet fried dough, perfect with chai',
      price: 2000,
      image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b',
      category: 'Snacks',
    },
  ],
  2: [
    {
      name: 'Margherita Pizza',
      description: 'Classic tomato sauce, mozzarella, and fresh basil',
      price: 14000,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
      category: 'Pizza',
      isPopular: true,
    },
    {
      name: 'Pepperoni Pizza',
      description: 'Loaded with pepperoni and melted mozzarella',
      price: 16000,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
      category: 'Pizza',
      isPopular: true,
    },
    {
      name: 'BBQ Chicken Pizza',
      description: 'Grilled chicken, BBQ sauce, onions, and peppers',
      price: 18000,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
      category: 'Pizza',
    },
    {
      name: 'Garlic Bread',
      description: 'Toasted bread with garlic butter and herbs',
      price: 5000,
      image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b',
      category: 'Sides',
    },
    {
      name: 'Tiramisu',
      description: 'Classic Italian coffee-flavored layered dessert',
      price: 8000,
      image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b',
      category: 'Dessert',
    },
  ],
  3: [
    {
      name: 'Kung Pao Chicken',
      description: 'Spicy stir-fried chicken with peanuts and vegetables',
      price: 13000,
      image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e',
      category: 'Main Course',
      isPopular: true,
    },
    {
      name: 'Spring Rolls',
      description: 'Crispy vegetable spring rolls with sweet chili dip',
      price: 6000,
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641',
      category: 'Appetizer',
      isPopular: true,
    },
    {
      name: 'Fried Rice',
      description: 'Egg fried rice with vegetables and soy sauce',
      price: 8000,
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19',
      category: 'Main Course',
    },
    {
      name: 'Chow Mein',
      description: 'Stir-fried noodles with vegetables and your choice of protein',
      price: 10000,
      image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e',
      category: 'Main Course',
    },
  ],
};

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.deliveryRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.category.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const customer = await prisma.user.create({
    data: {
      phone: '+255712000001',
      name: 'Juma Bakari',
      role: 'customer',
    },
  });

  const owner = await prisma.user.create({
    data: {
      phone: '+255712000002',
      name: 'Mama Nila',
      role: 'restaurant_owner',
    },
  });

  const driver = await prisma.user.create({
    data: {
      phone: '+255712000003',
      name: 'Khamisi Juma',
      role: 'driver',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    },
  });

  console.log('  ✓ Users created');

  // Create categories
  const createdCategories = await Promise.all(categories.map((cat) => prisma.category.create({ data: cat })));
  console.log('  ✓ Categories created');

  // Create restaurants
  for (let i = 0; i < restaurants.length; i++) {
    const r = restaurants[i];
    const restaurant = await prisma.restaurant.create({
      data: {
        ...r,
        ownerId: owner.id,
      },
    });

    // Create menu items
    const items = menuItemsByRestaurant[i] || [];
    for (const item of items) {
      await prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          ...item,
        },
      });
    }
  }
  console.log('  ✓ Restaurants and menu items created');

  // Fetch created restaurants and menu items
  const allRestaurants = await prisma.restaurant.findMany({ orderBy: { createdAt: 'asc' } });
  const allMenuItems = await prisma.menuItem.findMany({ orderBy: { createdAt: 'asc' } });
  const r0 = allRestaurants[0];
  const r1 = allRestaurants[1];
  const r2 = allRestaurants[2];
  const r3 = allRestaurants[3];

  const mi0 = allMenuItems.filter((m) => m.restaurantId === r0.id);
  const mi1 = allMenuItems.filter((m) => m.restaurantId === r1.id);
  const mi2 = allMenuItems.filter((m) => m.restaurantId === r2.id);
  const mi3 = allMenuItems.filter((m) => m.restaurantId === r3.id);

  // Create cart with items for customer
  const cart = await prisma.cart.create({
    data: {
      userId: customer.id,
      restaurantId: r0.id,
    },
  });

  await prisma.cartItem.createMany({
    data: [
      { cartId: cart.id, menuItemId: mi0[0].id, quantity: 2, price: mi0[0].price, name: mi0[0].name },
      { cartId: cart.id, menuItemId: mi0[4].id, quantity: 1, price: mi0[4].price, name: mi0[4].name },
      { cartId: cart.id, menuItemId: mi0[3].id, quantity: 2, price: mi0[3].price, name: mi0[3].name },
    ],
  });
  console.log('  ✓ Cart and cart items created');

  // Create orders with different statuses
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-001',
      userId: customer.id,
      restaurantId: r0.id,
      subtotal: 31000,
      deliveryFee: 2000,
      serviceFee: 1500,
      total: 34500,
      status: 'delivered',
      paymentMethod: 'mpesa',
      deliveryAddress: { street: '123 Kariakoo', city: 'Dar es Salaam', instructions: 'Call on arrival' },
      estimatedDelivery: new Date(Date.now() - 86400000),
      actualDelivery: new Date(Date.now() - 82800000),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order1.id,
        menuItemId: mi0[0].id,
        name: mi0[0].name,
        price: mi0[0].price,
        quantity: 1,
        specialInstructions: 'Extra spicy',
      },
      { orderId: order1.id, menuItemId: mi0[4].id, name: mi0[4].name, price: mi0[4].price, quantity: 1 },
      { orderId: order1.id, menuItemId: mi0[3].id, name: mi0[3].name, price: mi0[3].price, quantity: 2 },
    ],
  });

  await prisma.payment.create({
    data: {
      orderId: order1.id,
      amount: 34500,
      method: 'mpesa',
      status: 'completed',
      stripePaymentId: 'pi_test_delivered_001',
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-002',
      userId: customer.id,
      restaurantId: r1.id,
      subtotal: 23000,
      deliveryFee: 1500,
      serviceFee: 1200,
      total: 25700,
      status: 'confirmed',
      paymentMethod: 'cash',
      deliveryAddress: { street: '456 Mikocheni', city: 'Dar es Salaam', instructions: 'Leave at gate' },
      riderId: driver.id,
      estimatedDelivery: new Date(Date.now() + 1800000),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      { orderId: order2.id, menuItemId: mi1[0].id, name: mi1[0].name, price: mi1[0].price, quantity: 1 },
      { orderId: order2.id, menuItemId: mi1[1].id, name: mi1[1].name, price: mi1[1].price, quantity: 1 },
    ],
  });

  await prisma.payment.create({
    data: {
      orderId: order2.id,
      amount: 25700,
      method: 'cash',
      status: 'pending',
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-003',
      userId: customer.id,
      restaurantId: r2.id,
      subtotal: 34000,
      deliveryFee: 2500,
      serviceFee: 1700,
      total: 38200,
      status: 'preparing',
      paymentMethod: 'mpesa',
      deliveryAddress: { street: '789 Oyster Bay', city: 'Dar es Salaam', instructions: 'Ring bell twice' },
      estimatedDelivery: new Date(Date.now() + 3600000),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      { orderId: order3.id, menuItemId: mi2[0].id, name: mi2[0].name, price: mi2[0].price, quantity: 1 },
      { orderId: order3.id, menuItemId: mi2[1].id, name: mi2[1].name, price: mi2[1].price, quantity: 1 },
      { orderId: order3.id, menuItemId: mi2[3].id, name: mi2[3].name, price: mi2[3].price, quantity: 2 },
    ],
  });

  await prisma.payment.create({
    data: {
      orderId: order3.id,
      amount: 38200,
      method: 'mpesa',
      status: 'completed',
      stripePaymentId: 'pi_test_preparing_002',
    },
  });

  const order4 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-004',
      userId: customer.id,
      restaurantId: r3.id,
      subtotal: 21000,
      deliveryFee: 3000,
      serviceFee: 1000,
      total: 25000,
      status: 'on_the_way',
      paymentMethod: 'tigo_pesa',
      deliveryAddress: { street: '321 Kigamboni', city: 'Dar es Salaam', instructions: 'Near the mosque' },
      riderId: driver.id,
      estimatedDelivery: new Date(Date.now() + 600000),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      { orderId: order4.id, menuItemId: mi3[0].id, name: mi3[0].name, price: mi3[0].price, quantity: 1 },
      { orderId: order4.id, menuItemId: mi3[2].id, name: mi3[2].name, price: mi3[2].price, quantity: 1 },
    ],
  });

  await prisma.payment.create({
    data: {
      orderId: order4.id,
      amount: 25000,
      method: 'tigo_pesa',
      status: 'completed',
      stripePaymentId: 'pi_test_otw_003',
    },
  });

  console.log('  ✓ Orders, items, and payments created');

  // Create delivery requests
  await prisma.deliveryRequest.create({
    data: {
      orderId: order1.id,
      restaurant: { name: r0.name, address: r0.address, lat: r0.latitude, lng: r0.longitude },
      customer: { name: customer.name, phone: customer.phone },
      pickup: r0.address,
      dropoff: '123 Kariakoo, Dar es Salaam',
      distance: 3.2,
      deliveryFee: 2000,
      items: [mi0[0].name, mi0[4].name, mi0[3].name],
      timeLeft: 0,
      status: 'completed',
      driverId: driver.id,
    },
  });

  await prisma.deliveryRequest.create({
    data: {
      orderId: order2.id,
      restaurant: { name: r1.name, address: r1.address, lat: r1.latitude, lng: r1.longitude },
      customer: { name: customer.name, phone: customer.phone },
      pickup: r1.address,
      dropoff: '456 Mikocheni, Dar es Salaam',
      distance: 1.5,
      deliveryFee: 1500,
      items: [mi1[0].name, mi1[1].name],
      timeLeft: 25,
      status: 'accepted',
      driverId: driver.id,
    },
  });

  await prisma.deliveryRequest.create({
    data: {
      orderId: order4.id,
      restaurant: { name: r3.name, address: r3.address, lat: r3.latitude, lng: r3.longitude },
      customer: { name: customer.name, phone: customer.phone },
      pickup: r3.address,
      dropoff: '321 Kigamboni, Dar es Salaam',
      distance: 5.0,
      deliveryFee: 3000,
      items: [mi3[0].name, mi3[2].name],
      timeLeft: 8,
      status: 'available',
    },
  });

  console.log('  ✓ Delivery requests created');

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: customer.id,
        title: 'Order Delivered',
        body: 'Your order from Swahili Flavors has been delivered!',
        read: true,
      },
      {
        userId: customer.id,
        title: 'Order Confirmed',
        body: "Mama's Kitchen has confirmed your order #ORD-002",
        read: true,
      },
      {
        userId: customer.id,
        title: 'Payment Received',
        body: 'Your payment of 38,200 TZS for Pizza Planet is confirmed',
        read: false,
      },
      {
        userId: customer.id,
        title: 'Driver Assigned',
        body: 'Khamisi is on the way to pick up your Bao Bites order',
        read: false,
      },
      {
        userId: customer.id,
        title: 'Order Preparing',
        body: 'Pizza Planet is preparing your order #ORD-003',
        read: false,
      },
      {
        userId: driver.id,
        title: 'New Delivery',
        body: 'New delivery available: Bao Bites to Kigamboni - earn 3,000 TZS',
        read: false,
      },
      {
        userId: driver.id,
        title: 'Delivery Accepted',
        body: "You accepted delivery for Order #ORD-002 from Mama's Kitchen",
        read: true,
      },
      {
        userId: driver.id,
        title: 'Delivery Complete',
        body: 'Delivery #ORD-001 completed! 2,000 TZS added to your earnings',
        read: true,
      },
      { userId: owner.id, title: 'New Order', body: 'New order #ORD-003 received at Pizza Planet', read: false },
      {
        userId: owner.id,
        title: 'Order Ready',
        body: "Order #ORD-002 from Mama's Kitchen is ready for pickup",
        read: true,
      },
    ],
  });

  console.log('  ✓ Notifications created');

  // Create an admin user
  await prisma.user.create({
    data: {
      phone: '+255712000000',
      name: 'Admin User',
      role: 'admin',
    },
  });

  console.log('  ✓ Admin user created');

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📱 Test credentials:');
  console.log('  Admin:   phone +255712000000');
  console.log('  Customer: phone +255712000001');
  console.log('  Owner:    phone +255712000002');
  console.log('  Driver:   phone +255712000003');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
