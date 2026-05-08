"use strict";

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error(
        "Tolong sertakan file yang ingin diupload pada body request (form-data dengan key 'file').",
      );
      err.statusCode = 400;
      throw err;
    }

    res.status(200).json({
      status: "success",
      data: {
        url: req.file.path, // URL publik yang digenerate oleh Cloudinary
        format: req.file.mimetype || req.file.format,
        size: req.file.size,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadFile,
};
