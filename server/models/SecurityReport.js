const mongoose = require('mongoose');

const securityReportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    enum: [
      'farm_theft',
      'crop_vandalism', 
      'livestock_theft',
      'equipment_theft',
      'trespassing',
      'suspicious_activity',
      'land_dispute',
      'market_fraud',
      'other'
    ],
    required: true
  },
  title: {
    english: {
      type: String,
      required: true
    },
    yoruba: String
  },
  description: {
    english: {
      type: String,
      required: true
    },
    yoruba: String
  },
  location: {
    area: {
      type: String,
      required: true,
      enum: [
        'Igbaja Town',
        'Agbada Village',
        'Oke-Oyi',
        'Alapa',
        'Bacita',
        'Lafiagi',
        'Other'
      ]
    },
    specificLocation: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    landmarks: [String]
  },
  incidentTime: {
    occurred: {
      type: Date,
      required: true
    },
    reported: {
      type: Date,
      default: Date.now
    }
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['reported', 'investigating', 'resolved', 'closed', 'dismissed'],
    default: 'reported'
  },
  reporter: {
    isAnonymous: {
      type: Boolean,
      default: true
    },
    name: String,
    phone: String,
    email: String,
    relationship: {
      type: String,
      enum: ['victim', 'witness', 'community_member', 'security_personnel']
    }
  },
  suspects: [{
    description: String,
    knownIdentity: String,
    previousIncidents: Boolean
  }],
  witnesses: [{
    name: String,
    contact: String,
    statement: String
  }],
  evidence: {
    photos: [String],
    videos: [String],
    documents: [String],
    physicalEvidence: [String]
  },
  damages: {
    estimatedValue: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'NGN'
    },
    itemsAffected: [String],
    description: String
  },
  response: {
    actionsTaken: [String],
    responsibleAuthority: {
      type: String,
      enum: [
        'Local Security',
        'Police',
        'Vigilante Group',
        'Traditional Authority',
        'NSCDC',
        'Community Leaders'
      ]
    },
    responseTime: Number, // in hours
    outcome: String
  },
  followUp: [{
    date: {
      type: Date,
      default: Date.now
    },
    action: String,
    responsiblePerson: String,
    result: String
  }],
  communityImpact: {
    affectedFarmers: Number,
    economicImpact: Number,
    socialImpact: String
  },
  preventiveMeasures: [{
    suggested: String,
    implemented: Boolean,
    implementationDate: Date
  }],
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'disputed', 'false_report'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
securityReportSchema.index({ reportType: 1, status: 1 });
securityReportSchema.index({ 'location.area': 1, severity: 1 });
securityReportSchema.index({ incidentTime: -1, priority: 1 });
securityReportSchema.index({ verificationStatus: 1, isPublic: 1 });

module.exports = mongoose.model('SecurityReport', securityReportSchema);
