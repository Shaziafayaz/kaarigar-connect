const { WorkerProfile, serviceCategories } = require('../models/WorkerProfile');
const asyncHandler = require('../utils/asyncHandler');

function normalizeStringList(value, fieldName, maxItems, maxLength) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw Object.assign(new Error(`${fieldName} must be an array.`), { statusCode: 400 });

  const values = value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
  if (values.length > maxItems || values.some((item) => item.length > maxLength || item.length < 2)) {
    throw Object.assign(new Error(`Provide up to ${maxItems} valid ${fieldName.toLowerCase()}.`), { statusCode: 400 });
  }

  return [...new Set(values)];
}

function profilePayload(body) {
  const payload = {};
  const allowedFields = ['category', 'bio', 'experienceYears', 'hourlyRate', 'availability'];

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) payload[field] = body[field];
  });

  if (payload.category && !serviceCategories.includes(payload.category)) {
    throw Object.assign(new Error('Choose a valid service category.'), { statusCode: 400 });
  }
  if (payload.bio !== undefined && (typeof payload.bio !== 'string' || payload.bio.trim().length > 800)) {
    throw Object.assign(new Error('Bio must be 800 characters or fewer.'), { statusCode: 400 });
  }
  if (payload.bio !== undefined) payload.bio = payload.bio.trim();
  if (payload.experienceYears !== undefined) payload.experienceYears = Number(payload.experienceYears);
  if (payload.hourlyRate !== undefined) payload.hourlyRate = Number(payload.hourlyRate);
  if (payload.availability && !['available', 'busy', 'unavailable'].includes(payload.availability)) {
    throw Object.assign(new Error('Choose a valid availability status.'), { statusCode: 400 });
  }

  const skills = normalizeStringList(body.skills, 'skills', 15, 50);
  const serviceAreas = normalizeStringList(body.serviceAreas, 'service areas', 10, 80);
  if (skills !== undefined) payload.skills = skills;
  if (serviceAreas !== undefined) payload.serviceAreas = serviceAreas;

  return payload;
}

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await WorkerProfile.findOne({ user: req.user._id }).populate('user', 'name email phone');

  if (!profile) {
    return res.status(404).json({ success: false, message: 'Create your worker profile first.' });
  }

  return res.status(200).json({ success: true, data: { profile } });
});

const saveMyProfile = asyncHandler(async (req, res) => {
  const payload = profilePayload(req.body);
  const existingProfile = await WorkerProfile.findOne({ user: req.user._id });

  if (!existingProfile && (payload.category === undefined || payload.hourlyRate === undefined)) {
    return res.status(400).json({
      success: false,
      message: 'Category and hourly rate are required when creating a worker profile.'
    });
  }

  if (existingProfile && existingProfile.isApproved && Object.keys(payload).length > 0) {
    payload.isApproved = false;
  }

  const profile = await WorkerProfile.findOneAndUpdate(
    { user: req.user._id },
    { $set: payload, $setOnInsert: { user: req.user._id } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate('user', 'name email phone');

  return res.status(existingProfile ? 200 : 201).json({
    success: true,
    message: existingProfile ? 'Worker profile updated.' : 'Worker profile created and submitted for approval.',
    data: { profile }
  });
});

const uploadMyProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Choose an image to upload.' });
  }

  const profile = await WorkerProfile.findOne({ user: req.user._id });
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Create your worker profile before uploading an image.' });
  }

  profile.imageUrl = `/uploads/profile-images/${req.file.filename}`;
  profile.isApproved = false;
  await profile.save();

  return res.status(200).json({ success: true, message: 'Profile image uploaded.', data: { profile } });
});

const getApprovedWorkerProfile = asyncHandler(async (req, res) => {
  const profile = await WorkerProfile.findOne({ user: req.params.workerId, isApproved: true })
    .populate('user', 'name');

  if (!profile) {
    return res.status(404).json({ success: false, message: 'Approved worker profile not found.' });
  }

  return res.status(200).json({ success: true, data: { profile } });
});

module.exports = { getMyProfile, saveMyProfile, uploadMyProfileImage, getApprovedWorkerProfile };
