db.programs.aggregate([
  {
    $match: {
      startTime: {
        $gte: ISODate("2026-01-30T00:00:00.000Z"),
        $lt: ISODate("2026-01-31T00:00:00.000Z")
      }
    }
  },
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

  // 1️⃣ Program-wise unique
  {
    $group: {
      _id: {
        venue: "$venue",
        program: "$name"
      },
      programStudents: { $addToSet: "$registrations.participants" }
    }
  },
  {
    $project: {
      venue: "$_id.venue",
      program: "$_id.program",
      programCount: { $size: "$programStudents" },
      programStudents: 1,
      _id: 0
    }
  },

  // 2️⃣ Venue-wise true unique
  {
    $group: {
      _id: "$venue",
      programs: {
        $push: {
          program: "$program",
          totalUniqueStudents: "$programCount"
        }
      },
      venueStudents: {
        $addToSet: "$programStudents"
      }
    }
  },
  {
    // flatten nested sets
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
  {
    $project: {
      _id: 0,
      venue: "$_id",
      trueVenueUniqueCount: { $size: "$venueStudents" },
      programs: 1
    }
  }
]);
