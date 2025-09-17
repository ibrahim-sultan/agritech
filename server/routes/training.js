const express = require('express');
const { protect, requireSubscription, logActivity } = require('../middleware/auth');
const YouthTraining = require('../models/YouthTraining');
const { Transaction, UsageTracking } = require('../models/Subscription');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const path = require('path');

const router = express.Router();

// ========== TRAINING COURSES ==========

// GET ALL COURSES - Browse training catalog
router.get('/courses', protect, async (req, res) => {
  try {
    const {
      category,
      level,
      isFree,
      language = 'english',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (isFree !== undefined) filter.isFree = isFree === 'true';

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const courses = await YouthTraining.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await YouthTraining.countDocuments(filter);

    // Check user enrollment status for each course
    const coursesWithEnrollment = await Promise.all(courses.map(async (course) => {
      const isEnrolled = req.user.activity.completedTrainings.some(
        ct => ct.trainingId?.toString() === course._id.toString()
      );

      return {
        ...course.toObject(),
        isEnrolled,
        canAccess: course.isFree || req.user.subscription.features.includes('training_certificates') || isEnrolled
      };
    }));

    // Track usage
    await UsageTracking.incrementUsage(req.user._id, 'training_access');

    res.status(200).json({
      status: 'success',
      results: courses.length,
      data: {
        courses: coursesWithEnrollment,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch courses'
    });
  }
});

// GET SINGLE COURSE
router.get('/courses/:id', protect, async (req, res) => {
  try {
    const course = await YouthTraining.findById(req.params.id);
    
    if (!course || !course.isActive) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found'
      });
    }

    // Check if user is enrolled
    const enrollment = req.user.activity.completedTrainings.find(
      ct => ct.trainingId?.toString() === course._id.toString()
    );

    const canAccess = course.isFree || 
                     req.user.subscription.features.includes('training_certificates') || 
                     !!enrollment;

    // Get user progress
    let progress = {
      isEnrolled: !!enrollment,
      completedModules: 0,
      totalModules: course.modules.length,
      completionPercentage: 0,
      certificateIssued: enrollment?.certificateIssued || false,
      enrolledAt: enrollment?.completedAt || null,
      score: enrollment?.score || null
    };

    if (enrollment) {
      // Calculate progress based on completed modules (simplified)
      progress.completionPercentage = enrollment.score || 0;
      progress.completedModules = Math.floor((progress.completionPercentage / 100) * progress.totalModules);
    }

    res.status(200).json({
      status: 'success',
      data: {
        course: {
          ...course.toObject(),
          canAccess,
          progress
        }
      }
    });

  } catch (error) {
    console.error('Get course error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch course'
    });
  }
});

// ENROLL IN COURSE
router.post('/courses/:id/enroll', protect, async (req, res) => {
  try {
    const course = await YouthTraining.findById(req.params.id);
    
    if (!course || !course.isActive) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = req.user.activity.completedTrainings.find(
      ct => ct.trainingId?.toString() === course._id.toString()
    );

    if (existingEnrollment) {
      return res.status(400).json({
        status: 'fail',
        message: 'You are already enrolled in this course'
      });
    }

    // Check if course is paid and user has access
    if (!course.isFree) {
      const hasAccess = req.user.subscription.features.includes('training_certificates') ||
                       req.user.subscription.tier !== 'free';

      if (!hasAccess) {
        // Create payment transaction for course
        const reference = `TRN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const transaction = await Transaction.create({
          user: req.user._id,
          reference,
          amount: course.cost,
          type: 'training_course',
          paymentMethod: {
            provider: 'paystack'
          },
          metadata: {
            description: `Enrollment in ${course.title.english}`,
            customFields: {
              courseId: course._id.toString(),
              courseName: course.title.english
            }
          }
        });

        return res.status(402).json({
          status: 'payment_required',
          message: 'Payment required for this course',
          data: {
            transaction: {
              reference: transaction.reference,
              amount: transaction.amount,
              course: {
                id: course._id,
                title: course.title.english,
                cost: course.cost
              }
            }
          }
        });
      }
    }

    // Enroll user
    req.user.activity.completedTrainings.push({
      trainingId: course._id,
      completedAt: new Date(),
      score: 0,
      certificateIssued: false
    });

    // Increment course enrollment count
    course.enrollments += 1;

    await Promise.all([
      req.user.save(),
      course.save()
    ]);

    // Track usage
    await UsageTracking.incrementUsage(req.user._id, 'training_access');

    res.status(200).json({
      status: 'success',
      message: 'Successfully enrolled in course',
      data: {
        enrollment: {
          courseId: course._id,
          courseTitle: course.title.english,
          enrolledAt: new Date(),
          progress: 0
        }
      }
    });

  } catch (error) {
    console.error('Enroll course error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to enroll in course'
    });
  }
});

// UPDATE COURSE PROGRESS
router.post('/courses/:id/progress', protect, async (req, res) => {
  try {
    const { moduleIndex, score, completed = false } = req.body;
    
    const course = await YouthTraining.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found'
      });
    }

    // Find enrollment
    const enrollmentIndex = req.user.activity.completedTrainings.findIndex(
      ct => ct.trainingId?.toString() === course._id.toString()
    );

    if (enrollmentIndex === -1) {
      return res.status(400).json({
        status: 'fail',
        message: 'You are not enrolled in this course'
      });
    }

    // Update progress
    const enrollment = req.user.activity.completedTrainings[enrollmentIndex];
    
    if (completed && score !== undefined) {
      enrollment.score = Math.max(enrollment.score || 0, score);
      enrollment.completedAt = new Date();

      // Issue certificate if score meets requirement (80% or above)
      if (score >= 80 && !enrollment.certificateIssued && course.certification.available) {
        enrollment.certificateIssued = true;
        
        // Increment course completion count
        course.completions += 1;
        await course.save();
      }
    }

    await req.user.save();

    // Track usage
    await UsageTracking.incrementUsage(req.user._id, 'training_access');

    res.status(200).json({
      status: 'success',
      message: 'Progress updated successfully',
      data: {
        progress: {
          score: enrollment.score,
          completed: enrollment.score >= 80,
          certificateIssued: enrollment.certificateIssued,
          completedAt: enrollment.completedAt
        }
      }
    });

  } catch (error) {
    console.error('Update progress error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update progress'
    });
  }
});

// GET USER'S ENROLLED COURSES
router.get('/my-courses', protect, async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;

    let enrolledCourseIds = req.user.activity.completedTrainings.map(ct => ct.trainingId);

    // Filter by status
    if (status === 'completed') {
      enrolledCourseIds = req.user.activity.completedTrainings
        .filter(ct => ct.score >= 80)
        .map(ct => ct.trainingId);
    } else if (status === 'in_progress') {
      enrolledCourseIds = req.user.activity.completedTrainings
        .filter(ct => ct.score < 80 || !ct.score)
        .map(ct => ct.trainingId);
    }

    const courses = await YouthTraining.find({
      _id: { $in: enrolledCourseIds }
    })
    .sort({ updatedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Add progress information
    const coursesWithProgress = courses.map(course => {
      const enrollment = req.user.activity.completedTrainings.find(
        ct => ct.trainingId?.toString() === course._id.toString()
      );

      return {
        ...course.toObject(),
        progress: {
          score: enrollment?.score || 0,
          completedAt: enrollment?.completedAt,
          certificateIssued: enrollment?.certificateIssued || false,
          completionPercentage: enrollment?.score || 0
        }
      };
    });

    const total = enrolledCourseIds.length;

    res.status(200).json({
      status: 'success',
      results: courses.length,
      data: {
        courses: coursesWithProgress,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get my courses error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch enrolled courses'
    });
  }
});

// GENERATE CERTIFICATE
router.get('/certificates/:courseId', protect, async (req, res) => {
  try {
    const course = await YouthTraining.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found'
      });
    }

    // Check if user completed the course
    const enrollment = req.user.activity.completedTrainings.find(
      ct => ct.trainingId?.toString() === course._id.toString()
    );

    if (!enrollment || !enrollment.certificateIssued) {
      return res.status(400).json({
        status: 'fail',
        message: 'Certificate not available. Complete the course with 80% or higher score.'
      });
    }

    // Generate PDF certificate
    const certificate = await generateCertificate(req.user, course, enrollment);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate_${course._id}_${req.user._id}.pdf"`);
    res.send(certificate);

    // Track usage
    await UsageTracking.incrementUsage(req.user._id, 'training_access');

  } catch (error) {
    console.error('Generate certificate error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate certificate'
    });
  }
});

// GET TRAINING ANALYTICS (for instructors/admins)
router.get('/analytics', 
  protect, 
  requireSubscription('premium'),
  async (req, res) => {
    try {
      const { courseId, timeframe = 'month' } = req.query;

      let dateFilter = {};
      const now = new Date();
      
      if (timeframe === 'week') {
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      } else if (timeframe === 'month') {
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      } else if (timeframe === 'year') {
        dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
      }

      // Course-specific analytics
      if (courseId) {
        const course = await YouthTraining.findById(courseId);
        if (!course) {
          return res.status(404).json({
            status: 'fail',
            message: 'Course not found'
          });
        }

        // Get enrolled users
        const enrolledUsers = await User.find({
          'activity.completedTrainings.trainingId': courseId
        }).select('activity.completedTrainings profile.firstName profile.lastName');

        const enrollments = enrolledUsers.map(user => {
          const training = user.activity.completedTrainings.find(
            ct => ct.trainingId?.toString() === courseId
          );
          return {
            user: {
              name: `${user.profile.firstName} ${user.profile.lastName}`,
              id: user._id
            },
            enrolledAt: training.completedAt,
            score: training.score,
            certificateIssued: training.certificateIssued
          };
        });

        const analytics = {
          course: {
            title: course.title.english,
            totalEnrollments: course.enrollments,
            completions: course.completions,
            completionRate: course.enrollments > 0 ? (course.completions / course.enrollments * 100) : 0,
            averageRating: course.rating.average
          },
          enrollments,
          statistics: {
            averageScore: enrollments.reduce((sum, e) => sum + (e.score || 0), 0) / enrollments.length,
            certificatesIssued: enrollments.filter(e => e.certificateIssued).length,
            highPerformers: enrollments.filter(e => e.score >= 90).length,
            lowPerformers: enrollments.filter(e => e.score < 60).length
          }
        };

        return res.status(200).json({
          status: 'success',
          data: { analytics }
        });
      }

      // Overall training analytics
      const overallAnalytics = await YouthTraining.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            totalCourses: { $sum: 1 },
            totalEnrollments: { $sum: '$enrollments' },
            totalCompletions: { $sum: '$completions' },
            averageRating: { $avg: '$rating.average' },
            paidCourses: { $sum: { $cond: [{ $eq: ['$isFree', false] }, 1, 0] } },
            freeCourses: { $sum: { $cond: [{ $eq: ['$isFree', true] }, 1, 0] } }
          }
        },
        { $sort: { totalEnrollments: -1 } }
      ]);

      // Revenue analytics
      const revenueData = await Transaction.aggregate([
        {
          $match: {
            type: 'training_course',
            status: 'successful',
            createdAt: dateFilter
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            totalTransactions: { $sum: 1 },
            averageTransactionValue: { $avg: '$amount' }
          }
        }
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          analytics: {
            overview: overallAnalytics,
            revenue: revenueData[0] || {
              totalRevenue: 0,
              totalTransactions: 0,
              averageTransactionValue: 0
            },
            timeframe
          }
        }
      });

    } catch (error) {
      console.error('Training analytics error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch training analytics'
      });
    }
  }
);

// CREATE COURSE (Admin only)
router.post('/courses', 
  protect, 
  async (req, res) => {
    try {
      // Check if user is admin or extension officer
      if (!['admin', 'extension_officer'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'fail',
          message: 'You do not have permission to create courses'
        });
      }

      const course = await YouthTraining.create(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Course created successfully',
        data: { course }
      });

    } catch (error) {
      console.error('Create course error:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to create course'
      });
    }
  }
);

// UPDATE COURSE (Admin only)
router.patch('/courses/:id', 
  protect, 
  async (req, res) => {
    try {
      // Check if user is admin or extension officer
      if (!['admin', 'extension_officer'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'fail',
          message: 'You do not have permission to update courses'
        });
      }

      const course = await YouthTraining.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!course) {
        return res.status(404).json({
          status: 'fail',
          message: 'Course not found'
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Course updated successfully',
        data: { course }
      });

    } catch (error) {
      console.error('Update course error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update course'
      });
    }
  }
);

// Helper Functions

async function generateCertificate(user, course, enrollment) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
  const chunks = [];

  doc.on('data', chunk => chunks.push(chunk));

  // Certificate design
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Background and border
  doc.rect(50, 50, pageWidth - 100, pageHeight - 100).stroke('#d4af37', 3);
  doc.rect(70, 70, pageWidth - 140, pageHeight - 140).stroke('#d4af37', 1);

  // Header
  doc.fontSize(28)
     .fillColor('#2c3e50')
     .text('CERTIFICATE OF COMPLETION', 0, 120, { align: 'center' });

  doc.fontSize(16)
     .fillColor('#7f8c8d')
     .text('AgricTech Training Program', 0, 160, { align: 'center' });

  // Recipient info
  doc.fontSize(18)
     .fillColor('#2c3e50')
     .text('This is to certify that', 0, 220, { align: 'center' });

  doc.fontSize(32)
     .fillColor('#d4af37')
     .text(`${user.profile.firstName} ${user.profile.lastName}`, 0, 260, { align: 'center' });

  doc.fontSize(18)
     .fillColor('#2c3e50')
     .text('has successfully completed the course', 0, 310, { align: 'center' });

  doc.fontSize(24)
     .fillColor('#2980b9')
     .text(`${course.title.english}`, 0, 350, { align: 'center' });

  // Course details
  doc.fontSize(14)
     .fillColor('#7f8c8d')
     .text(`Score: ${enrollment.score}%`, 0, 410, { align: 'center' });

  doc.text(`Completion Date: ${enrollment.completedAt.toLocaleDateString()}`, 0, 430, { align: 'center' });

  // Footer
  doc.fontSize(12)
     .text('AgricTech Platform - Empowering Nigerian Farmers', 0, 500, { align: 'center' });

  doc.text(`Certificate ID: ${course._id}-${user._id}-${Date.now()}`, 0, 520, { align: 'center' });

  doc.end();

  return new Promise(resolve => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

module.exports = router;
