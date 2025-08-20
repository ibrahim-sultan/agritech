const mongoose = require('mongoose');
const CropPrice = require('./models/CropPrice');
require('dotenv').config();

// Sample crop price data for Igbaja AgriTech
const cropPricesData = [
  // Yam prices
  {
    cropName: 'yam',
    cropNameYoruba: 'Isu',
    market: {
      name: 'Igbaja Local Market',
      location: { state: 'Kwara', lga: 'Ifelodun' }
    },
    pricePerUnit: { value: 2500, unit: 'per tuber', currency: 'NGN' },
    priceRange: { min: 2200, max: 2800 },
    season: 'harvest_season',
    quality: 'premium',
    availability: 'abundant',
    trend: { direction: 'rising', percentage: 8.7 },
    source: 'market_survey',
    notes: {
      english: 'Fresh harvest, high quality tubers available',
      yoruba: 'Isu titun, didara giga wa'
    }
  },
  {
    cropName: 'yam',
    cropNameYoruba: 'Isu',
    market: {
      name: 'Ilorin Central Market',
      location: { state: 'Kwara', lga: 'Ilorin West' }
    },
    pricePerUnit: { value: 2300, unit: 'per tuber', currency: 'NGN' },
    priceRange: { min: 2000, max: 2600 },
    season: 'harvest_season',
    quality: 'standard',
    availability: 'moderate',
    trend: { direction: 'stable', percentage: 0 },
    source: 'trader_report'
  },
  
  // Cassava prices
  {
    cropName: 'cassava',
    cropNameYoruba: 'Ege',
    market: {
      name: 'Igbaja Local Market',
      location: { state: 'Kwara', lga: 'Ifelodun' }
    },
    pricePerUnit: { value: 800, unit: 'per bag', currency: 'NGN' },
    priceRange: { min: 750, max: 900 },
    season: 'dry_season',
    quality: 'standard',
    availability: 'abundant',
    trend: { direction: 'falling', percentage: -5.2 },
    source: 'market_survey',
    notes: {
      english: 'Good supply from local farms',
      yoruba: 'Ipese to dara lati oko agbegbe'
    }
  },
  {
    cropName: 'cassava',
    cropNameYoruba: 'Ege',
    market: {
      name: 'Ilorin Central Market',
      location: { state: 'Kwara', lga: 'Ilorin West' }
    },
    pricePerUnit: { value: 850, unit: 'per bag', currency: 'NGN' },
    priceRange: { min: 800, max: 950 },
    season: 'dry_season',
    quality: 'premium',
    availability: 'moderate',
    trend: { direction: 'stable', percentage: 1.2 },
    source: 'government_data'
  },
  
  // Maize prices
  {
    cropName: 'maize',
    cropNameYoruba: 'Agbado',
    market: {
      name: 'Igbaja Local Market',
      location: { state: 'Kwara', lga: 'Ifelodun' }
    },
    pricePerUnit: { value: 1200, unit: 'per bag', currency: 'NGN' },
    priceRange: { min: 1100, max: 1350 },
    season: 'wet_season',
    quality: 'standard',
    availability: 'moderate',
    trend: { direction: 'rising', percentage: 12.5 },
    source: 'market_survey'
  },
  {
    cropName: 'maize',
    cropNameYoruba: 'Agbado',
    market: {
      name: 'Ilorin Central Market',
      location: { state: 'Kwara', lga: 'Ilorin West' }
    },
    pricePerUnit: { value: 1180, unit: 'per bag', currency: 'NGN' },
    priceRange: { min: 1050, max: 1300 },
    season: 'wet_season',
    quality: 'premium',
    availability: 'scarce',
    trend: { direction: 'rising', percentage: 15.3 },
    source: 'trader_report'
  },
  
  // Tomatoes prices
  {
    cropName: 'tomatoes',
    cropNameYoruba: 'Tomati',
    market: {
      name: 'Igbaja Local Market',
      location: { state: 'Kwara', lga: 'Ifelodun' }
    },
    pricePerUnit: { value: 3500, unit: 'per basket', currency: 'NGN' },
    priceRange: { min: 3200, max: 4000 },
    season: 'dry_season',
    quality: 'premium',
    availability: 'moderate',
    trend: { direction: 'rising', percentage: 9.4 },
    source: 'market_survey',
    notes: {
      english: 'Fresh tomatoes from Jos plateau',
      yoruba: 'Tomati titun lati Jos'
    }
  },
  {
    cropName: 'tomatoes',
    cropNameYoruba: 'Tomati',
    market: {
      name: 'Offa Market',
      location: { state: 'Kwara', lga: 'Offa' }
    },
    pricePerUnit: { value: 3200, unit: 'per basket', currency: 'NGN' },
    priceRange: { min: 2900, max: 3600 },
    season: 'dry_season',
    quality: 'standard',
    availability: 'abundant',
    trend: { direction: 'stable', percentage: 2.1 },
    source: 'automated_scraping'
  },
  
  // Beans prices
  {
    cropName: 'beans',
    cropNameYoruba: 'Ewa',
    market: {
      name: 'Igbaja Local Market',
      location: { state: 'Kwara', lga: 'Ifelodun' }
    },
    pricePerUnit: { value: 1800, unit: 'per bag', currency: 'NGN' },
    priceRange: { min: 1650, max: 2000 },
    season: 'harvest_season',
    quality: 'premium',
    availability: 'abundant',
    trend: { direction: 'falling', percentage: -3.8 },
    source: 'market_survey'
  },
  {
    cropName: 'beans',
    cropNameYoruba: 'Ewa',
    market: {
      name: 'Ilorin Central Market',
      location: { state: 'Kwara', lga: 'Ilorin West' }
    },
    pricePerUnit: { value: 1900, unit: 'per bag', currency: 'NGN' },
    priceRange: { min: 1750, max: 2100 },
    season: 'harvest_season',
    quality: 'standard',
    availability: 'moderate',
    trend: { direction: 'stable', percentage: 0.5 },
    source: 'government_data'
  },
  
  // Pepper prices
  {
    cropName: 'pepper',
    cropNameYoruba: 'Ata',
    market: {
      name: 'Igbaja Local Market',
      location: { state: 'Kwara', lga: 'Ifelodun' }
    },
    pricePerUnit: { value: 2200, unit: 'per basket', currency: 'NGN' },
    priceRange: { min: 2000, max: 2500 },
    season: 'wet_season',
    quality: 'premium',
    availability: 'moderate',
    trend: { direction: 'rising', percentage: 4.7 },
    source: 'market_survey',
    notes: {
      english: 'Hot pepper variety, good for export',
      yoruba: 'Ata gbona, o dara fun titaja si oke'
    }
  }
];

// Function to generate historical data (for trends and predictions)
const generateHistoricalData = (basePrice, days = 30) => {
  const historicalData = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Add some realistic price variation (±10%)
    const variation = (Math.random() - 0.5) * 0.2; // ±10%
    const price = Math.round(basePrice * (1 + variation));
    
    historicalData.push({
      date,
      price
    });
  }
  
  return historicalData;
};

// Seed function
const seedCropPrices = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agrictech', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('📊 Connected to MongoDB for seeding crop prices...');
    
    // Clear existing crop prices
    await CropPrice.deleteMany({});
    console.log('🗑️ Cleared existing crop price data');
    
    // Insert current prices
    const insertedPrices = await CropPrice.insertMany(cropPricesData);
    console.log(`✅ Inserted ${insertedPrices.length} current crop prices`);
    
    // Generate and insert historical data for trends
    const historicalData = [];
    
    for (const crop of cropPricesData) {
      const historical = generateHistoricalData(crop.pricePerUnit.value, 30);
      
      for (const entry of historical) {
        const historicalPrice = {
          ...crop,
          pricePerUnit: {
            ...crop.pricePerUnit,
            value: entry.price
          },
          lastUpdated: entry.date,
          createdAt: entry.date,
          updatedAt: entry.date
        };
        
        delete historicalPrice._id;
        historicalData.push(historicalPrice);
      }
    }
    
    const insertedHistorical = await CropPrice.insertMany(historicalData);
    console.log(`📈 Inserted ${insertedHistorical.length} historical price records`);
    
    console.log('🎉 Crop price seeding completed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Current prices: ${insertedPrices.length}`);
    console.log(`   - Historical records: ${insertedHistorical.length}`);
    console.log(`   - Total records: ${insertedPrices.length + insertedHistorical.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding crop prices:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedCropPrices();
}

module.exports = { seedCropPrices, cropPricesData };
