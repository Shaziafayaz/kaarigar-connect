const User = require('../models/User');
const { WorkerProfile, serviceCategories } = require('../models/WorkerProfile');
const asyncHandler = require('../utils/asyncHandler');

const sortOptions = {
  rating: { averageRating: -1, totalReviews: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  experience: { experienceYears: -1, averageRating: -1 },
  price_low: { hourlyRate: 1, averageRating: -1 },
  price_high: { hourlyRate: -1, averageRating: -1 }
};

function searchError(message) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

function parsePositiveInteger(value, fallback, fieldName, maxValue) {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value)) throw searchError(`${fieldName} must be a whole number.`);

  const parsed = Number(value);
  if (parsed < 1 || parsed > maxValue) throw searchError(`${fieldName} must be between 1 and ${maxValue}.`);
  return parsed;
}

function parseRate(value, fieldName) {
  if (value === undefined) return undefined;
  if (!/^\d+(\.\d{1,2})?$/.test(value) || Number(value) < 0) {
    throw searchError(`${fieldName} must be a non-negative number.`);
  }
  return Number(value);
}

function parseDiscoveryQuery(query) {
  const category = query.category ? String(query.category).trim().toLowerCase() : undefined;
  const availability = query.availability ? String(query.availability).trim().toLowerCase() : undefined;
  const area = query.area ? String(query.area).trim() : undefined;
  const search = query.q ? String(query.q).trim() : undefined;
  const sort = query.sort ? String(query.sort).trim().toLowerCase() : 'rating';
  const minRate = parseRate(query.minRate, 'minRate');
  const maxRate = parseRate(query.maxRate, 'maxRate');

  if (category && !serviceCategories.includes(category)) throw searchError('Choose a valid service category.');
  if (availability && !['available', 'busy', 'unavailable'].includes(availability)) {
    throw searchError('Choose a valid availability status.');
  }
  if (area && area.length > 80) throw searchError('area cannot exceed 80 characters.');
  if (search && search.length > 80) throw searchError('q cannot exceed 80 characters.');
  if (!sortOptions[sort]) throw searchError('Choose a valid sorting option.');
  if (minRate !== undefined && maxRate !== undefined && minRate > maxRate) {
    throw searchError('minRate cannot be greater than maxRate.');
  }

  return {
    category,
    availability,
    area,
    search,
    sort,
    minRate,
    maxRate,
    page: parsePositiveInteger(query.page, 1, 'page', 100000),
    limit: parsePositiveInteger(query.limit, 12, 'limit', 50)
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const searchWorkers = asyncHandler(async (req, res) => {
  const options = parseDiscoveryQuery(req.query);
  const filters = { isApproved: true };

  if (options.category) filters.category = options.category;
  if (options.availability) filters.availability = options.availability;
  if (options.area) filters.serviceAreas = new RegExp(escapeRegExp(options.area), 'i');
  if (options.minRate !== undefined || options.maxRate !== undefined) {
    filters.hourlyRate = {};
    if (options.minRate !== undefined) filters.hourlyRate.$gte = options.minRate;
    if (options.maxRate !== undefined) filters.hourlyRate.$lte = options.maxRate;
  }

  if (options.search) {
    const pattern = new RegExp(escapeRegExp(options.search), 'i');
    const matchedUsers = await User.find({ name: pattern }).select('_id').lean();
    filters.$or = [
      { user: { $in: matchedUsers.map((user) => user._id) } },
      { bio: pattern },
      { skills: pattern },
      { serviceAreas: pattern }
    ];
  }

  const skip = (options.page - 1) * options.limit;
  const [profiles, total] = await Promise.all([
    WorkerProfile.find(filters)
      .populate('user', 'name')
      .sort(sortOptions[options.sort])
      .skip(skip)
      .limit(options.limit)
      .lean(),
    WorkerProfile.countDocuments(filters)
  ]);

  return res.status(200).json({
    success: true,
    data: { profiles },
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
      hasNextPage: skip + profiles.length < total,
      hasPreviousPage: options.page > 1
    }
  });
});

module.exports = { searchWorkers, parseDiscoveryQuery };
