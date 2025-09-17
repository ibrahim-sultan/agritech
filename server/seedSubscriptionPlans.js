const mongoose = require('mongoose');
const { SubscriptionPlan } = require('./models/Subscription');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const subscriptionPlans = [
  {
    name: 'free',
    displayName: {
      english: 'Free',
      yoruba: 'Ọfẹ'
    },
    description: {
      english: 'Basic features for new farmers and youth',
      yoruba: 'Awọn ẹya ipilẹ fun awọn agbe tuntun ati ọdọ'
    },
    pricing: {
      monthly: {
        amount: 0,
        currency: 'NGN'
      },
      yearly: {
        amount: 0,
        currency: 'NGN',
        discount: 0
      }
    },
    features: [
      {
        name: 'basic_prices',
        description: {
          english: 'Basic crop prices from 5 markets',
          yoruba: 'Awọn idiyele oko ipilẹ lati ọja marun'
        },
        limit: 5
      }
    ],
    limits: {
      priceAlerts: 5,
      apiCalls: 10,
      dataExports: 0,
      supportTickets: 1,
      trainingCourses: 2,
      marketplaceListings: 0,
      consultationHours: 0
    },
    targetAudience: ['farmer', 'youth', 'all'],
    benefits: [
      {
        english: 'Basic crop price information',
        yoruba: 'Alaye idiyele oko ipilẹ',
        icon: 'price-tag'
      },
      {
        english: 'Community farming tips',
        yoruba: 'Awọn imọran oko agbegbe',
        icon: 'lightbulb'
      },
      {
        english: 'Weather updates',
        yoruba: 'Awọn imudojuiwọn oju-ọjọ',
        icon: 'cloud'
      }
    ],
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'basic',
    displayName: {
      english: 'Farmer Pro',
      yoruba: 'Alamọja Agbe'
    },
    description: {
      english: 'Advanced features for active farmers',
      yoruba: 'Awọn ẹya to ga julọ fun awọn agbe ti nṣe'
    },
    pricing: {
      monthly: {
        amount: 2500,
        currency: 'NGN'
      },
      yearly: {
        amount: 25000,
        currency: 'NGN',
        discount: 17
      }
    },
    features: [
      {
        name: 'basic_prices',
        description: {
          english: 'All crop prices from multiple markets',
          yoruba: 'Gbogbo idiyele oko lati ọpọlọpọ ọja'
        },
        limit: -1
      },
      {
        name: 'advanced_analytics',
        description: {
          english: 'Advanced price analytics and trends',
          yoruba: 'Itupalẹ idiyele to ga ati awọn aṣa'
        },
        limit: -1
      },
      {
        name: 'unlimited_alerts',
        description: {
          english: 'Unlimited price alerts',
          yoruba: 'Awọn ifikilọ idiyele ti ko lopin'
        },
        limit: -1
      },
      {
        name: 'historical_data',
        description: {
          english: '6 months historical price data',
          yoruba: 'Data idiyele oṣu mẹfa sẹhin'
        },
        limit: 6
      }
    ],
    limits: {
      priceAlerts: -1,
      apiCalls: 500,
      dataExports: 2,
      supportTickets: 3,
      trainingCourses: 5,
      marketplaceListings: 10,
      consultationHours: 2
    },
    targetAudience: ['farmer'],
    benefits: [
      {
        english: 'All free features included',
        yoruba: 'Gbogbo awọn ẹya ọfẹ wa ninu',
        icon: 'check'
      },
      {
        english: 'Advanced price predictions',
        yoruba: 'Awọn asọtẹlẹ idiyele to ga',
        icon: 'chart'
      },
      {
        english: 'Premium farming consultations',
        yoruba: 'Awọn ifọrọwanilẹnuwo oko pataki',
        icon: 'user-tie'
      },
      {
        english: 'Unlimited price alerts',
        yoruba: 'Awọn ifikilọ idiyele ti ko lopin',
        icon: 'bell'
      }
    ],
    isActive: true,
    isPopular: true,
    sortOrder: 2,
    trialPeriod: {
      enabled: true,
      duration: 7
    }
  },
  {
    name: 'premium',
    displayName: {
      english: 'Trader Premium',
      yoruba: 'Onisowo Pataki'
    },
    description: {
      english: 'Comprehensive tools for agricultural traders',
      yoruba: 'Awọn irinṣẹ pipe fun awọn onisowo oko'
    },
    pricing: {
      monthly: {
        amount: 5000,
        currency: 'NGN'
      },
      yearly: {
        amount: 50000,
        currency: 'NGN',
        discount: 17
      }
    },
    features: [
      {
        name: 'basic_prices',
        limit: -1
      },
      {
        name: 'advanced_analytics',
        limit: -1
      },
      {
        name: 'unlimited_alerts',
        limit: -1
      },
      {
        name: 'historical_data',
        limit: -1
      },
      {
        name: 'data_export',
        description: {
          english: 'Export data in multiple formats',
          yoruba: 'Gbe data jade ni awọn ọna pupọ'
        },
        limit: -1
      },
      {
        name: 'api_access',
        description: {
          english: 'API access for integration',
          yoruba: 'Iwọle API fun isopọ'
        },
        limit: 1000
      },
      {
        name: 'marketplace_access',
        description: {
          english: 'Access to trading marketplace',
          yoruba: 'Iwọle si ọja iṣowo'
        },
        limit: -1
      }
    ],
    limits: {
      priceAlerts: -1,
      apiCalls: 1000,
      dataExports: -1,
      supportTickets: 5,
      trainingCourses: 10,
      marketplaceListings: 50,
      consultationHours: 5
    },
    targetAudience: ['trader', 'buyer'],
    benefits: [
      {
        english: 'All basic features included',
        yoruba: 'Gbogbo awọn ẹya ipilẹ wa ninu',
        icon: 'check'
      },
      {
        english: 'Bulk price monitoring',
        yoruba: 'Iwọn idiyele ni ọpọlọpọ',
        icon: 'list'
      },
      {
        english: 'Market comparison dashboard',
        yoruba: 'Ọna afiwe ọja',
        icon: 'compare'
      },
      {
        english: 'Direct farmer connections',
        yoruba: 'Asopọ taara pẹlu awọn agbe',
        icon: 'handshake'
      },
      {
        english: 'API access for integration',
        yoruba: 'Iwọle API fun isopọ',
        icon: 'code'
      }
    ],
    isActive: true,
    sortOrder: 3,
    trialPeriod: {
      enabled: true,
      duration: 14
    }
  },
  {
    name: 'commercial',
    displayName: {
      english: 'Commercial',
      yoruba: 'Iṣowo'
    },
    description: {
      english: 'Enterprise solutions for agricultural companies',
      yoruba: 'Awọn ojutu ile-iṣẹ fun awọn ile-iṣẹ oko'
    },
    pricing: {
      monthly: {
        amount: 15000,
        currency: 'NGN'
      },
      yearly: {
        amount: 150000,
        currency: 'NGN',
        discount: 17
      }
    },
    features: [
      {
        name: 'basic_prices',
        limit: -1
      },
      {
        name: 'advanced_analytics',
        limit: -1
      },
      {
        name: 'unlimited_alerts',
        limit: -1
      },
      {
        name: 'historical_data',
        limit: -1
      },
      {
        name: 'data_export',
        limit: -1
      },
      {
        name: 'api_access',
        limit: 10000
      },
      {
        name: 'marketplace_access',
        limit: -1
      },
      {
        name: 'custom_reports',
        description: {
          english: 'Custom report generation',
          yoruba: 'Ipilẹṣẹ iroyin adayeba'
        },
        limit: -1
      },
      {
        name: 'premium_support',
        description: {
          english: '24/7 priority support',
          yoruba: 'Atilẹyin pataki 24/7'
        },
        limit: -1
      }
    ],
    limits: {
      priceAlerts: -1,
      apiCalls: 10000,
      dataExports: -1,
      supportTickets: -1,
      trainingCourses: -1,
      marketplaceListings: -1,
      consultationHours: 10
    },
    targetAudience: ['trader', 'buyer', 'supplier'],
    benefits: [
      {
        english: 'All premium features included',
        yoruba: 'Gbogbo awọn ẹya pataki wa ninu',
        icon: 'check'
      },
      {
        english: 'White-label options',
        yoruba: 'Awọn aṣayan ami-ẹni funra',
        icon: 'tag'
      },
      {
        english: 'Dedicated account manager',
        yoruba: 'Oluṣakoso account ti a ya sọtọ',
        icon: 'user-circle'
      },
      {
        english: 'Priority customer support',
        yoruba: 'Atilẹyin alabara pataki',
        icon: 'headset'
      },
      {
        english: 'Custom integrations',
        yoruba: 'Awọn isopọ adayeba',
        icon: 'plug'
      }
    ],
    isActive: true,
    sortOrder: 4,
    trialPeriod: {
      enabled: true,
      duration: 30
    }
  },
  {
    name: 'enterprise',
    displayName: {
      english: 'Enterprise',
      yoruba: 'Ile-iṣẹ Nla'
    },
    description: {
      english: 'Custom solutions for large organizations',
      yoruba: 'Awọn ojutu adayeba fun awọn ile-iṣẹ nla'
    },
    pricing: {
      monthly: {
        amount: 50000,
        currency: 'NGN'
      },
      yearly: {
        amount: 500000,
        currency: 'NGN',
        discount: 17
      }
    },
    features: [
      {
        name: 'basic_prices',
        limit: -1
      },
      {
        name: 'advanced_analytics',
        limit: -1
      },
      {
        name: 'unlimited_alerts',
        limit: -1
      },
      {
        name: 'historical_data',
        limit: -1
      },
      {
        name: 'data_export',
        limit: -1
      },
      {
        name: 'api_access',
        limit: -1
      },
      {
        name: 'marketplace_access',
        limit: -1
      },
      {
        name: 'custom_reports',
        limit: -1
      },
      {
        name: 'premium_support',
        limit: -1
      },
      {
        name: 'bulk_operations',
        description: {
          english: 'Bulk operations and management',
          yoruba: 'Awọn iṣẹ ati iṣakoso ni ọpọlọpọ'
        },
        limit: -1
      }
    ],
    limits: {
      priceAlerts: -1,
      apiCalls: -1,
      dataExports: -1,
      supportTickets: -1,
      trainingCourses: -1,
      marketplaceListings: -1,
      consultationHours: -1
    },
    targetAudience: ['all'],
    benefits: [
      {
        english: 'All commercial features included',
        yoruba: 'Gbogbo awọn ẹya iṣowo wa ninu',
        icon: 'check'
      },
      {
        english: 'On-premise deployment',
        yoruba: 'Imuṣiṣẹ ninu ile',
        icon: 'server'
      },
      {
        english: 'Custom feature development',
        yoruba: 'Idagbasoke ẹya adayeba',
        icon: 'tools'
      },
      {
        english: 'Unlimited API access',
        yoruba: 'Iwọle API ti ko lopin',
        icon: 'infinity'
      },
      {
        english: 'SLA guarantees',
        yoruba: 'Awọn idaniloju SLA',
        icon: 'shield'
      }
    ],
    isActive: true,
    sortOrder: 5,
    trialPeriod: {
      enabled: true,
      duration: 30
    }
  }
];

const seedSubscriptionPlans = async () => {
  try {
    console.log('🌱 Seeding subscription plans...');
    
    // Clear existing plans
    await SubscriptionPlan.deleteMany({});
    console.log('🗑️  Cleared existing subscription plans');
    
    // Insert new plans
    const createdPlans = await SubscriptionPlan.insertMany(subscriptionPlans);
    console.log(`✅ Successfully created ${createdPlans.length} subscription plans`);
    
    // Display created plans
    createdPlans.forEach(plan => {
      console.log(`   📋 ${plan.name}: ${plan.displayName.english} - ₦${plan.pricing.monthly.amount.toLocaleString()}/month`);
    });
    
    console.log('🎉 Subscription plans seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeding function
if (require.main === module) {
  seedSubscriptionPlans();
}

module.exports = { seedSubscriptionPlans, subscriptionPlans };
