const Course = require('../models/Course');
const Score = require('../models/Score');

const migrateUnits = async () => {
  try {
    const courses = await Course.find({});
    
    let migratedCount = 0;
    
    for (const course of courses) {
      if (course.units && course.units.length > 0) {
        continue;
      }
      
      const legacyAssessments = course.assessments || [];
      
      const defaultUnit = {
        _id: new (require('mongoose').Types.ObjectId)(),
        name: 'Default Unit',
        code: course.courseCode || '',
        weight: 100,
        assessments: legacyAssessments.map(a => ({
          type: a.type,
          number: a.number,
          title: a.title,
          maxScore: a.maxScore,
          createdAt: a.createdAt || new Date()
        })),
        createdAt: new Date()
      };
      
      course.units = [defaultUnit];
      
      if (course.assessments) {
        course.assessments = undefined;
      }
      
      await course.save();
      
      await Score.updateMany(
        { 
          courseId: course._id,
          unitId: { $exists: false }
        },
        { 
          $set: { unitId: defaultUnit._id }
        }
      );
      
      const scoresWithNullUnit = await Score.find({
        courseId: course._id,
        $or: [
          { unitId: null },
          { unitId: { $exists: false } }
        ]
      });
      
      for (const score of scoresWithNullUnit) {
        score.unitId = defaultUnit._id;
        await score.save();
      }
      
      migratedCount++;
    }
    
    if (migratedCount > 0) {
      console.log(`Migrated ${migratedCount} courses to unit-based structure`);
    }
    
    return migratedCount;
  } catch (error) {
    console.error('Migration error:', error);
    return 0;
  }
};

module.exports = migrateUnits;