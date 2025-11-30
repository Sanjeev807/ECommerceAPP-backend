require('dotenv').config();
const { sequelize } = require('../config/database');
const Product = require('../models/Product');

const sampleProducts = [
  // ========== ELECTRONICS CATEGORY (10 products) ==========
  {
    name: 'Smart LED TV 55 inch 4K Ultra HD',
    description: 'Experience the pinnacle of smartphone technology with the Samsung Galaxy S23 Ultra. Features a revolutionary 200MP main camera with advanced Nightography for crystal-clear photos in any lighting. Powered by the blazing-fast Snapdragon 8 Gen 2 processor for seamless gaming, multitasking, and content creation. The built-in S Pen transforms your phone into a creative workspace with precision note-taking and drawing. Enjoy the stunning 6.8" Dynamic AMOLED 2X display with 120Hz refresh rate and Vision Booster for outdoor visibility. All-day power with 5000mAh battery, IP68 water resistance, and premium glass design. Perfect for professionals, photographers, and power users.',
    price: 124999,
    originalPrice: 134999,
    discount: 7,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&h=500&fit=crop&q=80'],
    stock: 50,
    rating: 4.6,
    reviews: 2847,
    isFeatured: true,
    specifications: new Map([
      ['Brand', 'Samsung'],
      ['RAM', '12GB'],
      ['Storage', '256GB'],
      ['Display', '6.8" Dynamic AMOLED 2X']
    ])
  },
  {
    name: 'Apple MacBook Pro 14',
    description: 'Unleash your creativity with the MacBook Pro 14" powered by the revolutionary M3 Pro chip. Experience up to 18x faster performance than Intel-based models, with 18GB unified memory for effortless multitasking. The stunning 14.2" Liquid Retina XDR display delivers 1000 nits sustained brightness and 1600 nits peak HDR brightness with P3 wide color gamut. Enjoy up to 18 hours of battery life, six Thunderbolt 4 ports, HDMI, SDXC card slot, and a 1080p FaceTime HD camera. Premium aluminum unibody design with Magic Keyboard and Force Touch trackpad. Ideal for video editors, developers, designers, and creative professionals who demand the best performance.',
    price: 199900,
    originalPrice: 219900,
    discount: 9,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop&q=80'],
    stock: 25,
    rating: 4.9,
    reviews: 1823,
    isFeatured: true,
    specifications: new Map([
      ['Brand', 'Apple'],
      ['Processor', 'M3 Pro'],
      ['RAM', '18GB'],
      ['Display', '14.2" Liquid Retina XDR']
    ])
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Immerse yourself in pure sound with Sony\'s flagship WH-1000XM5 wireless headphones. Industry-leading noise cancellation with 8 microphones and dual processors blocks out ambient noise completely. Enjoy exceptional audio quality with 30mm drivers supporting Hi-Res Audio and LDAC codec. Ultra-comfortable lightweight design with soft-fit leather for all-day wear. Incredible 30-hour battery life with quick charging (3 min charge = 3 hours playback). Multipoint connection lets you switch between devices seamlessly. Speak-to-Chat automatically pauses music when you speak. Includes carrying case, audio cable, and USB-C charging. Perfect for travelers, audiophiles, and remote workers seeking focus.',
    price: 29990,
    originalPrice: 34990,
    discount: 14,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&h=500&fit=crop&q=80'],
    stock: 100,
    rating: 4.7,
    reviews: 1523,
    isFeatured: true
  },
  {
    name: 'Samsung 4K Smart TV 55 Inch',
    description: 'Transform your living room into a home cinema with the Samsung 55" Crystal UHD 4K Smart TV. Experience stunning clarity with 3840x2160 resolution and Dynamic Crystal Color technology displaying over a billion shades for lifelike images. The powerful Crystal Processor 4K automatically upscales content to near-4K quality. Smart Hub gives instant access to Netflix, Prime Video, Disney+, YouTube, and 100+ apps with built-in Alexa and Google Assistant voice control. Motion Xcelerator ensures smooth fast-action scenes. Purcolor technology delivers true-to-life colors. Gaming Mode reduces input lag. Sleek AirSlim design with 3 HDMI ports, 2 USB ports, WiFi, and Bluetooth. Perfect for families, movie lovers, and gamers.',
    price: 44990,
    originalPrice: 64990,
    discount: 31,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&h=500&fit=crop&q=80'],
    stock: 40,
    rating: 4.5,
    reviews: 1234,
    isFeatured: false,
    specifications: new Map([
      ['Brand', 'Samsung'],
      ['Screen Size', '55 inches'],
      ['Resolution', '4K UHD'],
      ['Smart TV', 'Yes']
    ])
  },
  {
    name: 'Canon EOS M50 Mark II',
    description: 'Capture stunning photos and videos with the Canon EOS M50 Mark II mirrorless camera. Features a powerful 24.1MP APS-C CMOS sensor and DIGIC 8 processor for exceptional image quality even in low light. Record crystal-clear 4K UHD 24p video with Dual Pixel CMOS AF for smooth autofocus tracking. The 3.0" vari-angle touchscreen LCD flips out for perfect selfies and vlogging. Eye Detection AF ensures sharp portraits. Built-in WiFi and Bluetooth enable instant photo transfer to smartphone via Canon Camera Connect app. Includes vertical video support for social media creators. Compatible with EF-M lenses. Bundle includes 15-45mm kit lens, battery, charger, and strap. Perfect for vloggers, content creators, photography enthusiasts, and aspiring professionals.',
    price: 54990,
    originalPrice: 64990,
    discount: 15,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=500&fit=crop&q=80'],
    stock: 30,
    rating: 4.7,
    reviews: 876,
    isFeatured: true,
    specifications: new Map([
      ['Brand', 'Canon'],
      ['Megapixels', '24.1MP'],
      ['Video', '4K UHD'],
      ['Type', 'Mirrorless']
    ])
  },

  // FASHION CATEGORY
  {
    name: 'Levi\'s Men\'s Slim Fit Jeans',
    description: 'Upgrade your wardrobe with the iconic Levi\'s 511 Slim Fit Jeans crafted from premium stretch denim. The classic dark blue wash offers a timeless versatile look suitable for casual outings and semi-formal occasions. Engineered with a modern slim fit through hip and thigh with a slightly tapered leg for a contemporary silhouette. Made with soft, comfortable denim that retains its shape wash after wash. Features the signature Levi\'s red tab, leather patch, and riveted pockets for durability. The 5-pocket styling and zip fly provide functionality and classic style. Perfect for everyday wear - pair with sneakers for casual look or dress shoes for smart casual occasions. Available in multiple sizes. Ideal for men who value comfort, quality, and timeless style.',
    price: 2499,
    originalPrice: 3999,
    discount: 37,
    category: 'Fashion',
    images: ['https://images.unsplash.com/photo-1542272454315-7f6fabf4b329?w=500&h=500&fit=crop&q=80'],
    stock: 200,
    rating: 4.3,
    reviews: 8945,
    specifications: new Map([
      ['Brand', 'Levi\'s'],
      ['Fit', 'Slim'],
      ['Material', 'Denim'],
      ['Color', 'Dark Blue']
    ])
  },
  {
    name: 'Nike Air Max 270 Running Shoes',
    description: 'Step into ultimate comfort with the Nike Air Max 270 featuring the brand\'s biggest heel Air unit yet for incredible cushioning with every step. The engineered mesh upper provides breathability and flexibility while maintaining structured support. The revolutionary 270 degrees of visible Max Air technology delivers all-day comfort whether you\'re running, training, or going about your daily routine. Foam midsole adds extra plush comfort. Rubber outsole with strategic tread pattern ensures excellent traction on various surfaces. The sleek modern design with bold Nike swoosh logo makes a style statement. Pull tabs on tongue and heel allow easy on and off. Available in multiple colorways. Perfect for runners, fitness enthusiasts, sneakerheads, and anyone seeking the perfect blend of performance, comfort, and street style.',
    price: 12995,
    originalPrice: 14995,
    discount: 13,
    category: 'Fashion',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop&q=80'],
    stock: 75,
    rating: 4.5,
    reviews: 567,
    isFeatured: true,
    specifications: new Map([
      ['Brand', 'Nike'],
      ['Type', 'Running Shoes'],
      ['Technology', 'Max Air'],
      ['Material', 'Mesh']
    ])
  },
  {
    name: 'Adidas Men\'s T-Shirt',
    description: 'Stay cool and comfortable during workouts with the Adidas Men\'s Sports T-Shirt featuring advanced moisture-wicking Climalite technology that pulls sweat away from your skin for rapid evaporation. Made from premium soft cotton blend fabric that feels great against your skin while providing excellent breathability. The regular fit design ensures freedom of movement for all athletic activities including gym workouts, running, yoga, or casual wear. Features the iconic Adidas 3-Stripes on sleeves and logo on chest. Ribbed crew neck maintains its shape wash after wash. The quick-dry fabric makes it perfect for intense training sessions. Available in multiple colors and sizes. Machine washable and designed for durability. Ideal for athletes, fitness enthusiasts, and active individuals who demand performance and comfort without compromising on style.',
    price: 999,
    originalPrice: 1599,
    discount: 38,
    category: 'Fashion',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop&q=80'],
    stock: 300,
    rating: 4.2,
    reviews: 2345,
    specifications: new Map([
      ['Brand', 'Adidas'],
      ['Material', 'Cotton'],
      ['Fit', 'Regular'],
      ['Feature', 'Moisture-wicking']
    ])
  },
  {
    name: 'Puma Women\'s Sports Jacket',
    description: 'Elevate your activewear collection with the Puma Women\'s Sports Jacket combining style, functionality, and performance. Crafted from high-quality polyester with a soft fleece lining for warmth without weight. The full-zip front closure allows easy on-off and adjustable ventilation. Two deep side pockets with zipper closures securely store your phone, keys, and essentials. The athletic fit is designed specifically for women\'s body shape, offering comfort without restriction during workouts or outdoor activities. Features the signature Puma cat logo, ribbed cuffs and hem to seal in warmth, and a stand-up collar for neck protection. Water-resistant outer layer repels light rain. Available in stylish colors. Perfect for running, gym sessions, outdoor sports, yoga, or casual athleisure wear. Ideal for active women who value quality, style, and versatility.',
    price: 2999,
    originalPrice: 4999,
    discount: 40,
    category: 'Fashion',
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&q=80'],
    stock: 120,
    rating: 4.4,
    reviews: 987,
    isFeatured: false,
    specifications: new Map([
      ['Brand', 'Puma'],
      ['Type', 'Sports Jacket'],
      ['Material', 'Polyester'],
      ['Gender', 'Women']
    ])
  },

  // HOME CATEGORY
  {
    name: 'Philips Air Fryer HD9252/90',
    description: 'Cook healthier delicious meals with up to 90% less fat using the Philips Air Fryer featuring patented Rapid Air Technology that circulates hot air to fry, bake, grill, and roast with little to no oil. The spacious 4.1L capacity basket is perfect for preparing meals for 4-5 people - cook a whole chicken, 1kg of fries, or multiple servings at once. Digital touchscreen display with 7 preset cooking programs for fries, meat, fish, chicken, cake, and more takes the guesswork out of cooking. Adjustable temperature control up to 200°C and 60-minute timer with auto-shut off. The non-stick basket and removable drawer are dishwasher safe for easy cleanup. QuickClean basket with unique design prevents food sticking. Includes recipe book with 30+ recipes. Safety features include cool-touch housing and non-slip feet. Perfect for health-conscious families, busy professionals, and anyone looking to enjoy crispy fried foods guilt-free.',
    price: 7999,
    originalPrice: 12995,
    discount: 38,
    category: 'Home',
    images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=500&h=500&fit=crop&q=80'],
    stock: 60,
    rating: 4.4,
    reviews: 3456,
    isFeatured: true,
    specifications: new Map([
      ['Brand', 'Philips'],
      ['Capacity', '4.1L'],
      ['Technology', 'Rapid Air'],
      ['Power', '1400W']
    ])
  },
  {
    name: 'Prestige Induction Cooktop',
    description: 'Experience fast, safe, and energy-efficient cooking with the Prestige 2000W Induction Cooktop that heats food 50% faster than traditional gas stoves while consuming less electricity. The advanced induction technology transfers heat directly to the cookware for precise temperature control and even cooking. Features 8 preset cooking menus including fry, boil, steam, curry, and more with automatic temperature and time settings. Push-button controls with LED display allow easy operation. Auto shut-off feature activates when no cookware is detected, providing safety and energy savings. Overheat protection and voltage surge protection ensure durability. The feather-touch buttons and elegant black glass top are easy to clean - just wipe with a damp cloth. Compatible with induction-ready cookware (ferromagnetic base). Includes free induction-compatible pan. Perfect for modern kitchens, small apartments, hostels, and anyone seeking convenient, safe cooking.',
    price: 2199,
    originalPrice: 3499,
    discount: 37,
    category: 'Home',
    images: ['https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&h=500&fit=crop&q=80'],
    stock: 90,
    rating: 4.1,
    reviews: 1876,
    specifications: new Map([
      ['Brand', 'Prestige'],
      ['Power', '2000W'],
      ['Feature', 'Auto Shut-off'],
      ['Type', 'Induction']
    ])
  },
  {
    name: 'Usha Ceiling Fan',
    description: 'Keep your home cool and comfortable with the Usha 1200mm (48-inch) Ceiling Fan featuring a powerful yet energy-efficient motor that delivers high air delivery while consuming minimal electricity, helping you save on power bills. The 3-blade aerodynamic design with optimal blade angle ensures maximum air circulation and whisper-quiet operation even at high speeds. Beautiful decorative finish complements any room décor from modern to traditional. Rust-resistant powder-coated finish ensures long-lasting durability. The double ball bearing motor ensures smooth, vibration-free operation for years. Operates at 1200 RPM delivering impressive airflow. Compatible with standard regulators for speed control. Easy installation with all mounting hardware included. Comes with 2-year manufacturer warranty. Suitable for living rooms, bedrooms, offices, and halls up to 150 sq ft. Perfect for Indian homes seeking reliable cooling, energy savings, and elegant design.',
    price: 1699,
    originalPrice: 2499,
    discount: 32,
    category: 'Home',
    images: ['https://images.unsplash.com/photo-1581858125209-81c2e2f5e9c7?w=500&h=500&fit=crop&q=80'],
    stock: 150,
    rating: 4.3,
    reviews: 1234,
    specifications: new Map([
      ['Brand', 'Usha'],
      ['Size', '1200mm'],
      ['Blades', '3'],
      ['Speed', '1200 RPM']
    ])
  },

  // BOOKS CATEGORY
  {
    name: 'The Alchemist by Paulo Coelho',
    description: 'Embark on a transformative journey with Paulo Coelho\'s masterpiece "The Alchemist," a timeless international bestseller that has inspired millions of readers worldwide in over 80 languages. Follow the enchanting tale of Santiago, an Andalusian shepherd boy who dreams of finding treasure at the Egyptian pyramids. This philosophical novel beautifully explores themes of destiny, personal legends, and listening to your heart. Coelho\'s simple yet profound prose delivers powerful life lessons about courage, following your dreams, and finding meaning in the journey itself. The book teaches that when you truly desire something, the entire universe conspires to help you achieve it. With 197 pages of wisdom, this quick read leaves a lasting impact on readers of all ages. Perfect for book club discussions, gift-giving, or personal reflection. Essential reading for dreamers, travelers, spiritual seekers, and anyone standing at life\'s crossroads seeking inspiration and direction.',
    price: 299,
    originalPrice: 399,
    discount: 25,
    category: 'Books',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop&q=80'],
    stock: 1000,
    rating: 4.8,
    reviews: 25678,
    specifications: new Map([
      ['Author', 'Paulo Coelho'],
      ['Pages', '197'],
      ['Language', 'English'],
      ['Publisher', 'HarperCollins']
    ])
  },
  {
    name: 'Atomic Habits by James Clear',
    description: 'Transform your life one tiny change at a time with "Atomic Habits" by James Clear, the #1 New York Times bestseller that has sold over 10 million copies worldwide. This groundbreaking book reveals the surprising power of small habits and how making tiny changes can lead to remarkable results. Clear draws on cutting-edge psychology, neuroscience, and real-world examples to explain how habits form and, most importantly, how to break bad ones and build good ones that stick. Learn the Four Laws of Behavior Change, the proven framework for improving every day. Discover strategies used by Olympic athletes, Fortune 500 companies, and championship-winning coaches. The book provides practical tactics for forming good habits, breaking bad ones, and mastering the tiny behaviors that lead to remarkable results. With 320 pages of actionable insights, clear explanations, and engaging stories, this is your blueprint for personal and professional growth. Perfect for entrepreneurs, students, professionals, and anyone committed to continuous self-improvement and achieving their goals.',
    price: 399,
    originalPrice: 599,
    discount: 33,
    category: 'Books',
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&h=500&fit=crop&q=80'],
    stock: 800,
    rating: 4.9,
    reviews: 18976,
    isFeatured: true,
    specifications: new Map([
      ['Author', 'James Clear'],
      ['Pages', '320'],
      ['Language', 'English'],
      ['Category', 'Self-Help']
    ])
  },
  {
    name: 'Harry Potter Box Set',
    description: 'Enter the magical world of Hogwarts with the complete Harry Potter Box Set featuring all 7 books by J.K. Rowling in a beautiful collector\'s edition. Follow Harry\'s incredible journey from an orphaned boy living under the stairs to the wizard who saved the wizarding world. This complete collection includes: The Philosopher\'s Stone, Chamber of Secrets, Prisoner of Azkaban, Goblet of Fire, Order of the Phoenix, Half-Blood Prince, and Deathly Hallows. Experience the epic tale of friendship, courage, love, and the eternal battle between good and evil that has captivated readers of all ages worldwide. Each book is beautifully bound with stunning cover art. The series offers rich character development, intricate plot lines, and a fully realized magical universe complete with spells, potions, magical creatures, and unforgettable characters like Hermione, Ron, Dumbledore, and Snape. Perfect for introducing young readers to the joy of reading or for adult fans wanting to relive the magic. Ideal gift for birthdays, holidays, or Harry Potter enthusiasts. A timeless treasure for any home library.',
    price: 2999,
    originalPrice: 4999,
    discount: 40,
    category: 'Books',
    images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=500&fit=crop&q=80'],
    stock: 200,
    rating: 4.9,
    reviews: 12345,
    isFeatured: true,
    specifications: new Map([
      ['Author', 'J.K. Rowling'],
      ['Books', '7 volumes'],
      ['Language', 'English'],
      ['Genre', 'Fantasy']
    ])
  },

  // SPORTS CATEGORY
  {
    name: 'Adidas Football Size 5',
    description: 'Elevate your game with the Adidas Size 5 Football engineered for match-level performance and recreational play. Features thermally bonded seamless surface technology that ensures perfect spherical shape, predictable flight path, and exceptional durability even in harsh weather conditions. The butyl bladder provides excellent air retention so the ball stays inflated longer. Made from high-quality synthetic leather that\'s soft to touch yet durable enough for intensive use on grass, turf, or hard surfaces. The textured surface enhances grip and control for precise passing, dribbling, and shooting. Official Size 5 (68-70cm circumference) regulation ball suitable for players aged 12+ and adult matches. Features the iconic Adidas three stripes and logo. Meets FIFA quality standards. Suitable for competitive matches, training sessions, or backyard fun. Perfect for football enthusiasts, school teams, amateur clubs, and anyone passionate about the beautiful game.',
    price: 1499,
    originalPrice: 2499,
    discount: 40,
    category: 'Sports',
    images: ['https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aae?w=500&h=500&fit=crop&q=80'],
    stock: 150,
    rating: 4.2,
    reviews: 892,
    specifications: new Map([
      ['Brand', 'Adidas'],
      ['Size', '5'],
      ['Material', 'Synthetic Leather'],
      ['Type', 'Match Ball']
    ])
  },
  {
    name: 'Yonex Badminton Racket',
    description: 'Dominate the court with the Yonex professional-grade badminton racket crafted from premium high-modulus carbon fiber for exceptional strength-to-weight ratio. At just 85g (unstrung), this ultra-lightweight racket enables lightning-fast reactions, powerful smashes, and precise net shots without causing arm fatigue. The isometric head shape expands the sweet spot by 7% compared to conventional round frames, providing more consistent power even on off-center hits. Aero-Frame design reduces air resistance for faster swing speed. Built-in T-Joint technology reinforces the connection between frame and shaft for enhanced durability and torque. G4 grip size fits most hand sizes comfortably with anti-slip texture. Recommended string tension: 24-26 lbs. Comes with protective full-length cover. Suitable for intermediate to advanced players. Perfect for competitive tournaments, club matches, serious training, and players looking to improve their game with professional-quality equipment trusted by Olympic champions.',
    price: 3499,
    originalPrice: 5999,
    discount: 42,
    category: 'Sports',
    images: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500&h=500&fit=crop&q=80'],
    stock: 80,
    rating: 4.6,
    reviews: 567,
    isFeatured: false,
    specifications: new Map([
      ['Brand', 'Yonex'],
      ['Weight', '85g'],
      ['Material', 'Carbon Fiber'],
      ['Grip Size', 'G4']
    ])
  },
  {
    name: 'Nike Gym Dumbbell Set',
    description: 'Build strength and muscle with the versatile Nike Adjustable Dumbbell Set offering weight range from 2kg to 20kg per dumbbell, effectively replacing 10 pairs of fixed dumbbells and saving space in your home gym. The innovative quick-adjustment dial system lets you select your desired weight in seconds - simply turn the dial to choose from 2, 4, 6, 8, 10, 12, 15, 17, or 20kg. Premium iron weight plates with durable black finish ensure longevity. The ergonomic contoured handles with textured rubber coating provide secure, comfortable grip preventing slippage during intense workouts. Compact storage trays included keep your space organized. Perfect for progressive overload training - gradually increase weight as you get stronger. Suitable for all fitness levels from beginners to advanced. Ideal for various exercises including bicep curls, shoulder presses, chest presses, lunges, and more. Perfect for home gyms, apartment workouts, personal trainers, and fitness enthusiasts seeking versatile, space-saving strength training equipment.',
    price: 4999,
    originalPrice: 7999,
    discount: 38,
    category: 'Sports',
    images: ['https://images.unsplash.com/photo-1638805982-e0442b3cacb4?w=500&h=500&fit=crop&q=80'],
    stock: 100,
    rating: 4.5,
    reviews: 1456,
    isFeatured: true,
    specifications: new Map([
      ['Brand', 'Nike'],
      ['Weight Range', '2-20kg'],
      ['Material', 'Iron + Rubber'],
      ['Type', 'Adjustable']
    ])
  },
  {
    name: 'Puma Gym Bag',
    description: 'Stay organized on the go with the Puma Gym Duffle Bag featuring a spacious 40-liter capacity perfect for gym sessions, weekend trips, or sports practice. The main compartment easily fits workout clothes, shoes, towel, and more, while multiple specialized compartments keep your gear organized. Dedicated ventilated shoe compartment with moisture barrier keeps sweaty shoes separate from clean clothes. Zippered side pocket for water bottle. Front quick-access pocket for phone, keys, wallet, and essentials. Internal zippered pocket for valuables. Made from durable water-resistant polyester fabric that withstands daily wear and tear. Padded adjustable shoulder strap for comfortable carrying, plus dual top handles for grab-and-go convenience. YKK zippers ensure smooth operation and longevity. Features the iconic Puma logo. Available in stylish colorways. Compact yet spacious design. Perfect for gym-goers, athletes, travelers, students, and active individuals who need reliable, stylish gear transportation for workouts, sports, or weekend adventures.',
    price: 1299,
    originalPrice: 2499,
    discount: 48,
    category: 'Sports',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop&q=80'],
    stock: 120,
    rating: 4.1,
    reviews: 234,
    specifications: new Map([
      ['Brand', 'Puma'],
      ['Capacity', '40L'],
      ['Material', 'Polyester'],
      ['Compartments', 'Multiple']
    ])
  }
];

const seedDatabase = async () => {
  try {
    // Sync database and create tables without dropping existing data
    await sequelize.sync({ alter: true });

    // Check if products already exist
    const existingCount = await Product.count();
    console.log(`📊 Found ${existingCount} existing products in database`);

    if (existingCount === 0) {
      console.log('📦 No products found. Seeding database with sample products...');
      
      // Insert sample products
      await Product.bulkCreate(sampleProducts.map(product => ({
        ...product,
        specifications: Object.fromEntries(product.specifications || new Map())
      })));

      const newCount = await Product.count();
      console.log(`✅ Successfully seeded ${newCount} products into the database!`);
    } else {
      console.log('✅ Database already has products. Skipping seed process.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
