db.programs.aggregate([
  // 1️⃣ Filter programs by date
  {
    $match: {
      startTime: {
        $gte: ISODate("2026-01-30T00:00:00.000Z"),
        $lt: ISODate("2026-01-31T00:00:00.000Z")
      }
    }
  },

  // 2️⃣ Join registrations
  {
    $lookup: {
      from: "registrations",
      localField: "_id",
      foreignField: "program",
      as: "registrations"
    }
  },
  { $unwind: "$registrations" },
  { $match: { "registrations.status": { $ne: "cancelled" } } },
  { $unwind: "$registrations.participants" },

  // 3️⃣ Join students
  {
    $lookup: {
      from: "students",
      localField: "registrations.participants",
      foreignField: "_id",
      as: "student"
    }
  },
  { $unwind: "$student" },

  // 4️⃣ Join colleges
  {
    $lookup: {
      from: "colleges",
      localField: "student.college",   // 🔴 change if needed
      foreignField: "_id",
      as: "college"
    }
  },
  { $unwind: "$college" },

  // 5️⃣ Group by venue + college (unique students)
  {
    $group: {
      _id: {
        venue: "$venue",
        college: "$college.name"
      },
      collegeStudents: { $addToSet: "$student._id" }
    }
  },
  {
    $project: {
      venue: "$_id.venue",
      college: "$_id.college",
      collegeUniqueCount: { $size: "$collegeStudents" },
      collegeStudents: 1,
      _id: 0
    }
  },

  // 6️⃣ Group venue-wise
  {
    $group: {
      _id: "$venue",
      colleges: {
        $push: {
          college: "$college",
          uniqueStudents: "$collegeUniqueCount"
        }
      },
      venueStudents: { $addToSet: "$collegeStudents" }
    }
  },

  // 7️⃣ Flatten venue student sets (TRUE venue count)
  {
    $addFields: {
      venueStudents: {
        $reduce: {
          input: "$venueStudents",
          initialValue: [],
          in: { $setUnion: ["$$value", "$$this"] }
        }
      }
    }
  },

  // 8️⃣ Final shape
  {
    $project: {
      _id: 0,
      venue: "$_id",
      trueVenueUniqueCount: { $size: "$venueStudents" },
      colleges: 1
    }
  },

  { $sort: { venue: 1 } }
]);
