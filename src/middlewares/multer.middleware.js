import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/tempUploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// export const upload = multer({
//   storage: storage,
// }).fields([
//   { name: "avatar", maxCount: 1 },
//   { name: "coverImage", maxCount: 1 },
// ]);

export const upload = multer({
  storage: storage,
});
