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
    name: 'Mama\'s Kitchen',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
    cuisine: 'African',
    rating: 4.6,
    ratingCount: 189,
    deliveryFee: 1500,
    deliveryTime: '20-30 min',
    distance: '0.8 km',
    address: '456 Kivukoni Road, Dar es Salaam',
    latitude: -6.8000,
    longitude: 39.2200,
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
    latitude: -6.8100,
    longitude: 39.2400,
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
    latitude: -6.8200,
    longitude: 39.2600,
    isOpen: true,
  },
];

const menuItemsByRestaurant: Record<number, { name: string; description: string; price: number; image: string; category: string; isPopular?: boolean }[]> = {
  0: [
    { name: 'Octopus Curry', description: 'Tender octopus simmered in aromatic coconut curry sauce with traditional spices', price: 15000, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641', category: 'Main Course', isPopular: true },
    { name: 'Zanzibar Pizza', description: 'Stuffed flatbread with minced meat, eggs, and vegetables', price: 8000, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38', category: 'Appetizer', isPopular: true },
    { name: 'Coconut Rice', description: 'Fragrant basmati rice cooked in coconut milk with spices', price: 5000, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19', category: 'Sides' },
    { name: 'Mango Lassi', description: 'Creamy yogurt drink blended with fresh mango', price: 4000, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e', category: 'Drinks' },
    { name: 'Grilled Tilapia', description: 'Fresh tilapia grilled with herbs and served with ugali', price: 12000, image: 'https://images.unsplash.com/photo-1559742811-822f4580b12e', category: 'Main Course', isPopular: true },
    { name: 'Samosa Platter', description: 'Crispy triangular pastries filled with spiced meat or vegetables', price: 6000, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641', category: 'Appetizer' },
  ],
  1: [
    { name: 'Ugali & Fish', description: 'Traditional maize meal served with fried tilapia and kachumbari', price: 10000, image: 'https://images.unsplash.com/photo-1559742811-822f4580b12e', category: 'Main Course', isPopular: true },
    { name: 'Nyama Choma', description: 'Grilled beef served with kachumbari and ugali', price: 18000, image: 'https://images.unsplash.com/photo-1544025162-d76694265947', category: 'Main Course', isPopular: true },
    { name: 'Chipsi Mayai', description: 'Tanzanian-style fries and eggs omelette', price: 5000, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38', category: 'Breakfast' },
    { name: 'Mandazi', description: 'Sweet fried dough, perfect with chai', price: 2000, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b', category: 'Snacks' },
  ],
  2: [
    { name: 'Margherita Pizza', description: 'Classic tomato sauce, mozzarella, and fresh basil', price: 14000, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38', category: 'Pizza', isPopular: true },
    { name: 'Pepperoni Pizza', description: 'Loaded with pepperoni and melted mozzarella', price: 16000, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38', category: 'Pizza', isPopular: true },
    { name: 'BBQ Chicken Pizza', description: 'Grilled chicken, BBQ sauce, onions, and peppers', price: 18000, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38', category: 'Pizza' },
    { name: 'Garlic Bread', description: 'Toasted bread with garlic butter and herbs', price: 5000, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b', category: 'Sides' },
    { name: 'Tiramisu', description: 'Classic Italian coffee-flavored layered dessert', price: 8000, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b', category: 'Dessert' },
  ],
  3: [
    { name: 'Kung Pao Chicken', description: 'Spicy stir-fried chicken with peanuts and vegetables', price: 13000, image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e', category: 'Main Course', isPopular: true },
    { name: 'Spring Rolls', description: 'Crispy vegetable spring rolls with sweet chili dip', price: 6000, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641', category: 'Appetizer', isPopular: true },
    { name: 'Fried Rice', description: 'Egg fried rice with vegetables and soy sauce', price: 8000, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19', category: 'Main Course' },
    { name: 'Chow Mein', description: 'Stir-fried noodles with vegetables and your choice of protein', price: 10000, image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e', category: 'Main Course' },
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
  const createdCategories = await Promise.all(
    categories.map((cat) =>
      prisma.category.create({ data: cat })
    )
  );
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

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📱 Test credentials:');
  console.log('  Customer: phone +255712000001 (OTP: check console)');
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
