const mongoose = require('mongoose');
require('dotenv').config();

const CropPrice = require('./models/CropPrice');
const FarmingTip = require('./models/FarmingTip');
const YouthTraining = require('./models/YouthTraining');
const SecurityReport = require('./models/SecurityReport');
const Weather = require('./models/Weather');
const Farm = require('./models/Farm');

// Igbaja-specific seed data
const igbajaCropPrices = [
  {
    cropName: 'yam',
    cropNameYoruba: 'Isu',
    market: {
      name: 'Igbaja Local Market',
      location: { state: 'Kwara', lga: 'Ifelodun' }
    },
    pricePerUnit: { value: 1500, unit: 'per tuber', currency: 'NGN' },
    priceRange: { min: 1200, max: 2000 },
    season: 'harvest_season',
    quality: 'standard',
    availability: 'abundant',
    trend: { direction: 'falling', percentage: -5 },
    source: 'market_survey',
    notes: {
      english: 'Fresh yam from local farms, good quality for the season',
      yoruba: 'Isu tuturu lati oko wa, o dara fun akoko yi'
    }
  },
  {
    cropName: 'cassava',
    cropNameYoruba: 'Ege',
    market: {
      name: 'Igbaja Local Market',
      location: { state: 'Kwara', lga: 'Ifelodun' }
    },
    pricePerUnit: { value: 25000, unit: 'per bag', currency: 'NGN' },
    priceRange: { min: 22000, max: 28000 },
    season: 'dry_season',
    quality: 'premium',
    availability: 'moderate',
    trend: { direction: 'stable', percentage: 0 },
    source: 'trader_report',
    notes: {
      english: 'High starch content, good for gari production',
      yoruba: 'Ege to ni starch pupoo, o dara fun se gari'
    }
  },
  {
    cropName: 'maize',
    cropNameYoruba: 'Agbado',
    market: {
      name: 'Ilorin Central Market',
      location: { state: 'Kwara', lga: 'Ilorin West' }
    },
    pricePerUnit: { value: 45000, unit: 'per bag', currency: 'NGN' },
    priceRange: { min: 40000, max: 50000 },
    season: 'wet_season',
    quality: 'standard',
    availability: 'moderate',
    trend: { direction: 'rising', percentage: 8 },
    source: 'government_data',
    notes: {
      english: 'Yellow maize variety, suitable for poultry feed and human consumption',
      yoruba: 'Agbado pupa, o dara fun adie ati ounje eniyan'
    }
  }
];

const igbajaFarmingTips = [
  {
    title: {
      english: 'Organic Pest Control for Yam Cultivation',
      yoruba: 'Bibo Kokoro Lori Isu Laisi Kemikalo'
    },
    content: {
      english: 'Learn how to protect your yam crops from pests using natural methods that are safe and effective.',
      yoruba: 'Ko bi o se le dabo bo isu re lowo kokoro nipa lilo awon ohun adayeba ti o ni aabo ati to munadoko.'
    },
    category: 'pest_control',
    targetCrops: ['yam'],
    difficulty: 'beginner',
    season: ['planting_season', 'wet_season'],
    estimatedCost: { min: 2000, max: 5000, currency: 'NGN' },
    timeRequired: { value: 2, unit: 'hours' },
    materials: [
      {
        name: { english: 'Neem leaves', yoruba: 'Ewe dongoyaro' },
        quantity: '2 cups',
        localAvailability: 'readily_available'
      },
      {
        name: { english: 'Garlic cloves', yoruba: 'Ayu' },
        quantity: '10 pieces',
        localAvailability: 'seasonal'
      }
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: {
          english: 'Collect fresh neem leaves and crush them to extract the juice',
          yoruba: 'Gbe ewe dongoyaro tuntun ka a fo fun yo omi inu re'
        }
      },
      {
        stepNumber: 2,
        instruction: {
          english: 'Mix neem juice with crushed garlic and add water',
          yoruba: 'Po omi dongoyaro mo ayu ti a ti fo, fi omi kun'
        }
      }
    ],
    author: {
      name: 'Baba Tunde Agbara',
      title: 'Local Farming Expert',
      location: 'Igbaja',
      experience: '30 years'
    },
    tags: ['organic', 'pest_control', 'yam', 'local_methods'],
    isFeatured: true
  },
  {
    title: {
      english: 'Water Conservation Techniques for Dry Season',
      yoruba: 'Bi A Se Le Fi Omi Pamo Ni Akoko Gbigbe'
    },
    content: {
      english: 'Simple methods to conserve water and maintain your crops during the dry season in Igbaja.',
      yoruba: 'Ona riru lati fi omi pamo ati toju oko re ni akoko gbigbe ni Igbaja.'
    },
    category: 'irrigation',
    targetCrops: ['all'],
    difficulty: 'intermediate',
    season: ['dry_season'],
    estimatedCost: { min: 5000, max: 15000, currency: 'NGN' },
    timeRequired: { value: 4, unit: 'hours' },
    isFeatured: true
  }
];

const igbajaYouthTraining = [
  {
    title: {
      english: 'Basic Computer Skills for Rural Youth',
      yoruba: 'Eko Kọmputa Ipile Fun Odo Ni Igberiko'
    },
    description: {
      english: 'Learn essential computer skills including typing, internet browsing, and basic software use.',
      yoruba: 'Ko awon eko kọmputa pataki bi kika leti, lilo intaneti, ati lilo ero kọmputa.'
    },
    category: 'basic_computer',
    level: 'absolute_beginner',
    duration: {
      estimated: { value: 10, unit: 'hours' }
    },
    learningObjectives: [
      {
        english: 'Understand basic computer components and how to use them',
        yoruba: 'Ni oye nipa awon eda kọmputa ati bi a se le lo won'
      }
    ],
    targetAudience: ['rural_youth', 'unemployed'],
    mobileOptimized: true,
    isFree: true
  },
  {
    title: {
      english: 'Python Programming for Beginners',
      yoruba: 'Eko Python Fun Awon Alabere'
    },
    description: {
      english: 'Introduction to Python programming with practical examples relevant to agriculture.',
      yoruba: 'Ifihan si eto Python pelu awon apere to wulo fun ise agbe.'
    },
    category: 'python_basics',
    level: 'beginner',
    duration: {
      estimated: { value: 20, unit: 'hours' }
    },
    targetAudience: ['rural_youth', 'students'],
    isFree: true
  },
  {
    title: {
      english: 'Digital Marketing for Small Farmers',
      yoruba: 'Tita Lori Ero Fun Agbe Kekere'
    },
    description: {
      english: 'Learn how to market your farm products online and reach more customers.',
      yoruba: 'Ko bi o se le ta oka re lori ero ati ri awon onibara pupoo.'
    },
    category: 'online_marketing',
    level: 'intermediate',
    duration: {
      estimated: { value: 8, unit: 'hours' }
    },
    targetAudience: ['farmers', 'entrepreneurs'],
    isFree: true
  }
];

const igbajaSecurityReports = [
  {
    reportType: 'farm_theft',
    title: {
      english: 'Yam Theft at Agbada Village Farm',
      yoruba: 'Jija Isu Ni Oko Agbada'
    },
    description: {
      english: 'Several tubers of yam were stolen from farm during early morning hours',
      yoruba: 'Won ji isu pupo lati oko ni kutukutu owuro'
    },
    location: {
      area: 'Agbada Village',
      specificLocation: 'Behind the old school building',
      landmarks: ['Old Primary School', 'Big Mango Tree']
    },
    incidentTime: {
      occurred: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    severity: 'medium',
    status: 'investigating',
    damages: {
      estimatedValue: 15000,
      currency: 'NGN',
      itemsAffected: ['Yam tubers - approximately 10 pieces'],
      description: 'Fresh yam ready for harvest'
    },
    isPublic: true,
    verificationStatus: 'verified'
  }
];

const igbajaWeather = {
  temperature: {
    current: 28,
    min: 22,
    max: 34,
    unit: 'celsius'
  },
  humidity: 75,
  windSpeed: {
    value: 12,
    direction: 'SW',
    unit: 'kmh'
  },
  precipitation: {
    amount: 5,
    probability: 40,
    type: 'rain',
    unit: 'mm'
  },
  pressure: {
    value: 1012,
    unit: 'hPa'
  },
  conditions: 'partly_cloudy',
  forecast: 'current'
};

const seedIgbajaData = async () => {
  try {
    console.log('🌱 Starting Igbaja AgriTech Dashboard seeding...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing Igbaja-specific data
    await Promise.all([
      CropPrice.deleteMany({}),
      FarmingTip.deleteMany({}),
      YouthTraining.deleteMany({}),
      SecurityReport.deleteMany({}),
      Weather.deleteMany({})
    ]);
    console.log('🗑️ Cleared existing data');

    // Seed Crop Prices
    const cropPrices = await CropPrice.insertMany(igbajaCropPrices);
    console.log(`💰 Created ${cropPrices.length} crop price entries`);

    // Seed Farming Tips
    const farmingTips = await FarmingTip.insertMany(igbajaFarmingTips);
    console.log(`🌾 Created ${farmingTips.length} farming tips`);

    // Seed Youth Training
    const youthTraining = await YouthTraining.insertMany(igbajaYouthTraining);
    console.log(`🎓 Created ${youthTraining.length} youth training courses`);

    // Seed Security Reports
    const securityReports = await SecurityReport.insertMany(igbajaSecurityReports);
    console.log(`🚨 Created ${securityReports.length} security reports`);

    // Create a dummy farm for weather data (since we need farm reference)
    const dummyFarm = await Farm.findOne() || await Farm.create({
      name: "Igbaja Community Farm",
      location: {
        address: "Igbaja Town, Ifelodun LGA, Kwara State",
        coordinates: { lat: 8.7521, lng: 4.1629 }
      },
      size: { value: 100, unit: "hectares" },
      owner: "Igbaja Community",
      farmType: "mixed"
    });

    // Seed Weather Data (create multiple entries for different days)
    const weatherData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      weatherData.push({
        farm: dummyFarm._id,
        date,
        ...igbajaWeather,
        temperature: {
          ...igbajaWeather.temperature,
          current: igbajaWeather.temperature.current + (Math.random() - 0.5) * 4
        }
      });
    }
    
    const weather = await Weather.insertMany(weatherData);
    console.log(`🌤️ Created ${weather.length} weather records`);

    console.log('✅ Igbaja AgriTech Dashboard seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Crop Prices: ${cropPrices.length}`);
    console.log(`   Farming Tips: ${farmingTips.length}`);
    console.log(`   Youth Training: ${youthTraining.length}`);
    console.log(`   Security Reports: ${securityReports.length}`);
    console.log(`   Weather Records: ${weather.length}`);
    console.log('\n🎉 Ready to serve the Igbaja rural community!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Igbaja data:', error);
    process.exit(1);
  }
};

seedIgbajaData();
