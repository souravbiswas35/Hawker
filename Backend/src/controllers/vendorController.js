const pool = require("../config/db");
const ApiError = require("../utils/apiError");

async function upsertProfile(req, res, next) {
  try {
    const {
      first_name,
      last_name,
      phone,
      national_id,
      date_of_birth,
      address,
      business_name,
      business_type,
      vending_zone,
    } = req.body;

    const userId = req.user.id;

    console.log("Received profile data:", req.body);
    console.log("User ID:", userId);

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    // First, check if profile exists
    const [[existingProfile]] = await pool.query(
      "SELECT id FROM vendor_profiles WHERE user_id = ?",
      [userId]
    );

    console.log("Existing profile:", existingProfile);

    let result;
    if (existingProfile) {
      // Update existing profile
      console.log("Updating existing profile");
      result = await pool.query(
        `UPDATE vendor_profiles SET 
          first_name = ?,
          last_name = ?,
          phone = ?,
          national_id = ?,
          date_of_birth = ?,
          address = ?,
          business_name = ?,
          business_type = ?,
          vending_zone = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [
          first_name || null,
          last_name || null,
          phone || null,
          national_id || null,
          date_of_birth || null,
          address || null,
          business_name || null,
          business_type || null,
          vending_zone || null,
          userId,
        ]
      );
    } else {
      // Insert new profile
      console.log("Inserting new profile");
      result = await pool.query(
        `INSERT INTO vendor_profiles (
          user_id, first_name, last_name, phone, national_id, date_of_birth,
          address, business_name, business_type, vending_zone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          first_name || null,
          last_name || null,
          phone || null,
          national_id || null,
          date_of_birth || null,
          address || null,
          business_name || null,
          business_type || null,
          vending_zone || null,
        ]
      );
    }

    console.log("Query result:", result);

    res.json({ message: "Vendor profile updated successfully" });
  } catch (err) {
    console.error("Error in upsertProfile:", err);
    next(err);
  }
}

async function uploadDocuments(req, res, next) {
  try {
    const userId = req.user.id;
    const files = req.files || [];

    if (files.length === 0) {
      throw new ApiError(400, "Please upload at least one document");
    }

    const values = files.map((file) => [
      userId,
      file.fieldname,
      file.originalname,
      file.filename,
      file.mimetype,
      file.size,
    ]);

    await pool.query(
      `INSERT INTO vendor_documents
      (user_id, document_type, original_name, stored_name, mime_type, file_size)
      VALUES ?`,
      [values],
    );

    res.status(201).json({
      message: "Documents uploaded successfully",
      files: files.map((f) => ({
        type: f.fieldname,
        name: f.originalname,
      })),
    });
  } catch (err) {
    next(err);
  }
}

async function uploadProfilePicture(req, res, next) {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      throw new ApiError(400, "Please upload a profile picture");
    }

    // Save the file path to database
    const profilePictureUrl = `/uploads/profile-pictures/${file.filename}`;
    
    await pool.query(
      `UPDATE vendor_profiles 
       SET profile_picture_url = ?, profile_picture_uploaded_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [profilePictureUrl, userId],
    );

    res.json({
      message: "Profile picture uploaded successfully",
      profile_picture_url: profilePictureUrl,
    });
  } catch (err) {
    next(err);
  }
}

async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;

    const [[profile]] = await pool.query(
      `SELECT first_name, last_name, phone, national_id, date_of_birth, address, business_name, business_type, vending_zone
       FROM vendor_profiles WHERE user_id = ?`,
      [userId],
    );

    const [docs] = await pool.query(
      `SELECT id, document_type, original_name, uploaded_at
       FROM vendor_documents WHERE user_id = ? ORDER BY uploaded_at DESC`,
      [userId],
    );

    const [applications] = await pool.query(
      `SELECT id, application_ref, desired_zone, stall_type, status, submitted_at, reviewed_at
       FROM license_applications
       WHERE user_id = ?
       ORDER BY submitted_at DESC`,
      [userId],
    );

    res.json({
      profile: profile || null,
      documents: docs,
      applications,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  upsertProfile,
  uploadDocuments,
  uploadProfilePicture,
  getDashboard,
};
