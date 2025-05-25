import multer from "multer";
import fs from "fs";
import path from "path";

// Function to create a multer instance with a dynamic destination
const createUploader = (destinationPath) => {
  // Ensure the destination directory exists
  const absoluteDestinationPath = path.resolve(destinationPath);
  if (!fs.existsSync(absoluteDestinationPath)) {
    fs.mkdirSync(absoluteDestinationPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, absoluteDestinationPath);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

  // File filter
  const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .jpg and .png formats are allowed'), false);
    }
  };

  return multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
  });
};

// Default uploader for existing profile image uploads (maintains current behavior)
const defaultUpload = createUploader('backend/uploads/');

// Specific uploader for food images
const uploadFoodImage = createUploader('backend/temp_food_uploads/');

export { uploadFoodImage }; // Export the new uploader for food images
export default defaultUpload; // Export the default uploader
