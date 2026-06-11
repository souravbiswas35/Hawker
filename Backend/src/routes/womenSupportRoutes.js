const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const pool = require("../config/db");

const router = express.Router();

// Women Support Data Route (for vendor dashboard)
router.get("/vendor/women-support/data", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    // Get schemes
    const [schemes] = await pool.query(
      "SELECT * FROM women_schemes_subsidies WHERE status = 'active' ORDER BY created_at DESC"
    );

    // Get mentors
    const [mentors] = await pool.query(
      "SELECT * FROM women_mentors WHERE available = 1 ORDER BY created_at DESC"
    );

    // Get success stories (featured only)
    const [successStories] = await pool.query(
      "SELECT * FROM women_success_stories WHERE featured = 1 ORDER BY created_at DESC LIMIT 10"
    );

    // Get emergency contacts
    const [emergencyContacts] = await pool.query(
      "SELECT * FROM women_emergency_contacts ORDER BY contact_name"
    );

    // Get safety guides
    const [safetyGuides] = await pool.query(
      "SELECT * FROM women_safety_guides ORDER BY title"
    );

    // Get community count
    const [communityCount] = await pool.query(
      "SELECT COUNT(*) as count FROM vendor_profiles WHERE gender = 'female'"
    );

    res.json({
      schemes,
      mentors,
      successStories,
      emergencyContacts,
      safetyGuides,
      communityCount: communityCount[0]?.count || 0
    });
  } catch (err) {
    console.error("Error fetching women support data:", err);
    res.status(500).json({ message: "Error fetching women support data" });
  }
});

// Women Support Access Check
router.get("/vendor/women-support/access", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if vendor is female
    const [vendor] = await pool.query(
      "SELECT gender FROM vendor_profiles WHERE user_id = ?",
      [userId]
    );

    if (vendor.length === 0) {
      return res.json({ canAccess: false, message: "Vendor profile not found" });
    }

    const isFemale = vendor[0].gender === 'female';

    if (isFemale) {
      res.json({ canAccess: true, message: "Welcome to Women Vendor Support" });
    } else {
      res.json({ canAccess: false, message: "This feature is only available for women vendors" });
    }
  } catch (err) {
    console.error("Error checking women support access:", err);
    res.status(500).json({ message: "Error checking access" });
  }
});

// Success Stories Routes

// Get all success stories (for vendors - only approved)
router.get("/success-stories", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const [stories] = await pool.query(
      "SELECT * FROM women_success_stories WHERE is_approved = 1 ORDER BY created_at DESC"
    );
    res.json({ stories });
  } catch (err) {
    console.error("Error fetching success stories:", err);
    res.status(500).json({ message: "Error fetching success stories" });
  }
});

// Get all success stories (for admin - including unapproved)
router.get("/admin/success-stories", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const [stories] = await pool.query(
      "SELECT * FROM women_success_stories ORDER BY created_at DESC"
    );
    res.json({ stories });
  } catch (err) {
    console.error("Error fetching success stories:", err);
    res.status(500).json({ message: "Error fetching success stories" });
  }
});

// Create success story (admin only)
router.post("/admin/success-stories", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { vendor_name, business_category, earnings_monthly, story_title, full_story, business_journey } = req.body;
    
    if (!vendor_name || !business_category || !earnings_monthly || !story_title || !full_story || !business_journey) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [result] = await pool.query(
      `INSERT INTO women_success_stories (vendor_name, business_category, earnings_monthly, story_title, full_story, business_journey, is_approved, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [vendor_name, business_category, earnings_monthly, story_title, full_story, business_journey, req.user.id]
    );

    res.status(201).json({ message: "Success story created successfully", id: result.insertId });
  } catch (err) {
    console.error("Error creating success story:", err);
    res.status(500).json({ message: "Error creating success story" });
  }
});

// Update success story (admin only)
router.put("/admin/success-stories/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { vendor_name, business_category, earnings_monthly, story_title, full_story, business_journey, is_approved } = req.body;
    const { id } = req.params;

    console.log("Updating success story:", { id, vendor_name, business_category, is_approved });

    const [result] = await pool.query(
      `UPDATE women_success_stories 
       SET vendor_name = ?, business_category = ?, earnings_monthly = ?, story_title = ?, full_story = ?, business_journey = ?, is_approved = ?
       WHERE id = ?`,
      [vendor_name, business_category, earnings_monthly, story_title, full_story, business_journey, is_approved, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Success story not found" });
    }

    res.json({ message: "Success story updated successfully" });
  } catch (err) {
    console.error("Error updating success story:", err);
    res.status(500).json({ message: "Error updating success story", error: err.message });
  }
});

// Delete success story (admin only)
router.delete("/admin/success-stories/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM women_success_stories WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Success story not found" });
    }

    res.json({ message: "Success story deleted successfully" });
  } catch (err) {
    console.error("Error deleting success story:", err);
    res.status(500).json({ message: "Error deleting success story" });
  }
});

// Community Posts Routes

// Get all community posts (for vendors - only approved)
router.get("/community/posts", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const { category } = req.query;
    let query = "SELECT * FROM women_community_posts WHERE is_approved = 1";
    const params = [];

    if (category && category !== "all") {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY created_at DESC";

    const [posts] = await pool.query(query, params);
    res.json({ posts });
  } catch (err) {
    console.error("Error fetching community posts:", err);
    res.status(500).json({ message: "Error fetching community posts" });
  }
});

// Get all community posts (for admin - including unapproved)
router.get("/admin/community/posts", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const [posts] = await pool.query(
      "SELECT * FROM women_community_posts ORDER BY created_at DESC"
    );
    res.json({ posts });
  } catch (err) {
    console.error("Error fetching community posts:", err);
    res.status(500).json({ message: "Error fetching community posts" });
  }
});

// Create community post (vendor)
router.post("/community/posts", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const { content, category } = req.body;
    const userId = req.user.id;

    if (!content || !category) {
      return res.status(400).json({ message: "Content and category are required" });
    }

    // Get vendor profile info
    const [vendor] = await pool.query(
      "SELECT first_name, last_name, business_type FROM vendor_profiles WHERE user_id = ?",
      [userId]
    );

    const author_name = vendor.length > 0 
      ? `${vendor[0].first_name} ${vendor[0].last_name}`
      : "Anonymous";
    const business_category = vendor.length > 0 
      ? vendor[0].business_type 
      : "Women Vendor";

    const [result] = await pool.query(
      `INSERT INTO women_community_posts (author_id, author_name, business_category, content, category, is_approved)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [userId, author_name, business_category, content, category]
    );

    res.status(201).json({ message: "Post created successfully", id: result.insertId });
  } catch (err) {
    console.error("Error creating community post:", err);
    res.status(500).json({ message: "Error creating community post" });
  }
});

// Like community post
router.post("/community/posts/:id/like", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "UPDATE women_community_posts SET likes_count = likes_count + 1 WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "Post liked successfully" });
  } catch (err) {
    console.error("Error liking post:", err);
    res.status(500).json({ message: "Error liking post" });
  }
});

// Update community post (admin only)
router.put("/admin/community/posts/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { content, category, is_approved } = req.body;
    const { id } = req.params;

    const [result] = await pool.query(
      `UPDATE women_community_posts 
       SET content = ?, category = ?, is_approved = ?
       WHERE id = ?`,
      [content, category, is_approved, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "Post updated successfully" });
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ message: "Error updating post" });
  }
});

// Delete community post (admin only)
router.delete("/admin/community/posts/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM women_community_posts WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Error deleting post" });
  }
});

module.exports = router;
