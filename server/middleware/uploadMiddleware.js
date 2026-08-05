const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, '..', 'uploads', 'profile-images');
fs.mkdirSync(uploadDirectory, { recursive: true });

const extensionByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadDirectory),
  filename: (req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    callback(null, `profile-${req.user._id}-${uniqueSuffix}${extensionByMimeType[file.mimetype]}`);
  }
});

function fileFilter(req, file, callback) {
  if (!extensionByMimeType[file.mimetype]) {
    const error = new Error('Only JPG, PNG, and WEBP profile images are allowed.');
    error.statusCode = 400;
    return callback(error);
  }

  callback(null, true);
}

const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
}).single('image');

module.exports = uploadProfileImage;
