const mongoose = require('mongoose');
require('dotenv').config();

const Farm = require('./models/Farm');
const Crop = require('./models/Crop');
const { Sensor, SensorData } = require('./models/Sensor');
const Weather = require('./models/Weather');
const Alert = require('./models/Alert');

// Sample data
const farmData = [
  {
    name: "Green Valley Farm",
    location: {
      address: "123 Farm Road, Valley City, CA",
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    size: { value: 150, unit: "hectares" },
    owner: "John Smith",
    contact: { email: "john@greenvalley.com", phone: "+1-555-0123" },
    farmType: "crop"
  },
  {
    name: "Sunset Organic Farm",
    location: {
      address: "456 Organic Lane, Sunset, CA",
      coordinates: { lat: 40.7589, lng: -73.9851 }
    },
    size: { value: 75, unit: "hectares" },
    owner: "Maria Garcia",
    contact: { email: "maria@sunsetorganic.com", phone: "+1-555-0124" },
    farmType: "organic"
  },
  {
    name: "Prairie Wind Ranch",
    location: {
      address: "789 Prairie Road, Windfield, TX",
      coordinates: { lat: 32.7767, lng: -96.7970 }
    },
    size: { value: 300, unit: "hectares" },
    owner: "Robert Johnson",
    contact: { email: "rob@prairiewind.com", phone: "+1-555-0125" },
    farmType: "mixed"
  }
];

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Farm.deleteMany({}),
      Crop.deleteMany({}),
      Sensor.deleteMany({}),
      SensorData.deleteMany({}),
      Weather.deleteMany({}),
      Alert.deleteMany({})
    ]);
    console.log('🗑️ Cleared existing data');

    // Seed Farms
    const farms = await Farm.insertMany(farmData);
    console.log(`🚜 Created ${farms.length} farms`);

    // Seed Crops
    const cropData = [];
    const cropNames = ['Corn', 'Wheat', 'Soybeans', 'Tomatoes', 'Lettuce', 'Carrots'];
    const varieties = {
      'Corn': ['Sweet Corn', 'Dent Corn', 'Flint Corn'],
      'Wheat': ['Hard Red Winter', 'Soft White', 'Durum'],
      'Soybeans': ['Early Maturity', 'Full Season', 'Food Grade'],
      'Tomatoes': ['Roma', 'Beefsteak', 'Cherry'],
      'Lettuce': ['Iceberg', 'Romaine', 'Butterhead'],
      'Carrots': ['Nantes', 'Imperator', 'Chantenay']
    };

    farms.forEach(farm => {
      for (let i = 0; i < 3; i++) {
        const cropName = cropNames[Math.floor(Math.random() * cropNames.length)];
        const plantingDate = new Date();
        plantingDate.setDate(plantingDate.getDate() - Math.floor(Math.random() * 90));
        
        const expectedHarvestDate = new Date(plantingDate);
        expectedHarvestDate.setDate(expectedHarvestDate.getDate() + 90 + Math.floor(Math.random() * 60));

        cropData.push({
          name: cropName,
          variety: varieties[cropName][Math.floor(Math.random() * varieties[cropName].length)],
          farm: farm._id,
          plantingDate,
          expectedHarvestDate,
          area: { value: Math.floor(Math.random() * 20) + 5, unit: 'hectares' },
          status: ['planted', 'growing', 'flowering', 'harvested'][Math.floor(Math.random() * 4)],
          growthStage: ['germination', 'vegetative', 'flowering', 'fruiting', 'maturity'][Math.floor(Math.random() * 5)],
          healthScore: Math.floor(Math.random() * 30) + 70,
          yield: {
            expected: { value: Math.floor(Math.random() * 50) + 20, unit: 'tons/hectare' },
            actual: Math.random() > 0.5 ? { value: Math.floor(Math.random() * 45) + 18, unit: 'tons/hectare' } : undefined
          },
          irrigation: {
            type: ['drip', 'sprinkler', 'flood'][Math.floor(Math.random() * 3)],
            frequency: 'Daily',
            lastWatered: new Date(Date.now() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000)
          }
        });
      }
    });

    const crops = await Crop.insertMany(cropData);
    console.log(`🌾 Created ${crops.length} crops`);

    // Seed Sensors
    const sensorData = [];
    const sensorTypes = ['temperature', 'humidity', 'soil_moisture', 'ph', 'light', 'co2'];

    farms.forEach(farm => {
      sensorTypes.forEach((type, index) => {
        sensorData.push({
          sensorId: `${farm.name.replace(/\s+/g, '_')}_${type}_${index + 1}`,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Sensor ${index + 1}`,
          type: type,
          farm: farm._id,
          location: {
            coordinates: {
              lat: farm.location.coordinates.lat + (Math.random() - 0.5) * 0.01,
              lng: farm.location.coordinates.lng + (Math.random() - 0.5) * 0.01
            },
            description: `${type} monitoring station`
          },
          status: ['active', 'active', 'active', 'inactive'][Math.floor(Math.random() * 4)],
          batteryLevel: Math.floor(Math.random() * 40) + 60,
          lastReading: {
            value: type === 'temperature' ? Math.floor(Math.random() * 20) + 15 :
                  type === 'humidity' ? Math.floor(Math.random() * 40) + 40 :
                  type === 'soil_moisture' ? Math.floor(Math.random() * 30) + 30 :
                  type === 'ph' ? Math.random() * 3 + 6 :
                  type === 'light' ? Math.floor(Math.random() * 1000) + 200 :
                  Math.floor(Math.random() * 200) + 300,
            unit: type === 'temperature' ? '°C' :
                  type === 'humidity' ? '%' :
                  type === 'soil_moisture' ? '%' :
                  type === 'ph' ? 'pH' :
                  type === 'light' ? 'lux' : 'ppm',
            timestamp: new Date()
          },
          thresholds: {
            min: type === 'temperature' ? 10 : type === 'humidity' ? 30 : type === 'soil_moisture' ? 20 : 5,
            max: type === 'temperature' ? 35 : type === 'humidity' ? 80 : type === 'soil_moisture' ? 80 : 50
          }
        });
      });
    });

    const sensors = await Sensor.insertMany(sensorData);
    console.log(`📡 Created ${sensors.length} sensors`);

    // Seed Sensor Data (last 7 days)
    const sensorDataEntries = [];
    sensors.forEach(sensor => {
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Generate multiple readings per day
        for (let h = 0; h < 24; h += 4) {
          const timestamp = new Date(date);
          timestamp.setHours(h);
          
          sensorDataEntries.push({
            sensor: sensor._id,
            value: sensor.lastReading.value + (Math.random() - 0.5) * 2,
            unit: sensor.lastReading.unit,
            quality: ['excellent', 'good', 'good', 'fair'][Math.floor(Math.random() * 4)],
            timestamp
          });
        }
      }
    });

    await SensorData.insertMany(sensorDataEntries);
    console.log(`📊 Created ${sensorDataEntries.length} sensor data entries`);

    // Seed Weather Data
    const weatherData = [];
    farms.forEach(farm => {
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const conditions = ['sunny', 'cloudy', 'partly_cloudy', 'rainy', 'overcast'];
        const currentCondition = conditions[Math.floor(Math.random() * conditions.length)];
        
        weatherData.push({
          farm: farm._id,
          date,
          temperature: {
            current: Math.floor(Math.random() * 15) + 20,
            min: Math.floor(Math.random() * 10) + 15,
            max: Math.floor(Math.random() * 10) + 25,
            unit: 'celsius'
          },
          humidity: Math.floor(Math.random() * 40) + 40,
          windSpeed: {
            value: Math.floor(Math.random() * 20) + 5,
            direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
            unit: 'kmh'
          },
          precipitation: {
            amount: currentCondition === 'rainy' ? Math.floor(Math.random() * 10) + 1 : 0,
            probability: currentCondition === 'rainy' ? 80 : Math.floor(Math.random() * 30),
            type: currentCondition === 'rainy' ? 'rain' : 'none',
            unit: 'mm'
          },
          pressure: {
            value: Math.floor(Math.random() * 50) + 1000,
            unit: 'hPa'
          },
          uvIndex: Math.floor(Math.random() * 10) + 1,
          conditions: currentCondition,
          forecast: i === 0 ? 'current' : '1_day'
        });
      }
    });

    const weather = await Weather.insertMany(weatherData);
    console.log(`🌤️ Created ${weather.length} weather records`);

    // Seed Alerts
    const alertData = [];
    const alertTypes = ['weather', 'sensor', 'crop', 'irrigation', 'pest'];
    const severities = ['low', 'medium', 'high', 'critical'];
    
    farms.forEach(farm => {
      for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
        const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        
        alertData.push({
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Alert`,
          message: type === 'weather' ? 'Heavy rain expected in the next 24 hours' :
                   type === 'sensor' ? 'Soil moisture sensor battery low' :
                   type === 'crop' ? 'Crop health score below threshold' :
                   type === 'irrigation' ? 'Irrigation system malfunction detected' :
                   'Pest activity detected in field',
          type,
          severity,
          status: ['active', 'active', 'acknowledged', 'resolved'][Math.floor(Math.random() * 4)],
          farm: farm._id,
          crop: Math.random() > 0.5 ? crops.find(c => c.farm.equals(farm._id))?._id : undefined,
          sensor: Math.random() > 0.5 ? sensors.find(s => s.farm.equals(farm._id))?._id : undefined,
          actionRequired: severity === 'high' || severity === 'critical'
        });
      }
    });

    const alerts = await Alert.insertMany(alertData);
    console.log(`🚨 Created ${alerts.length} alerts`);

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Farms: ${farms.length}`);
    console.log(`   Crops: ${crops.length}`);
    console.log(`   Sensors: ${sensors.length}`);
    console.log(`   Sensor Data: ${sensorDataEntries.length}`);
    console.log(`   Weather Records: ${weather.length}`);
    console.log(`   Alerts: ${alerts.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
