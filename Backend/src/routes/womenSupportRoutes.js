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

    // Calculate counts dynamically for each post
    const postsWithCounts = await Promise.all(posts.map(async (post) => {
      let likes_count = 0, comments_count = 0, saves_count = 0, shares_count = 0;

      try {
        const [likes] = await pool.query(
          "SELECT COUNT(*) as count FROM women_post_likes WHERE post_id = ?",
          [post.id]
        );
        likes_count = likes[0]?.count || 0;
      } catch (e) {
        console.error("Error fetching likes count:", e);
      }

      try {
        const [comments] = await pool.query(
          "SELECT COUNT(*) as count FROM women_post_comments WHERE post_id = ?",
          [post.id]
        );
        comments_count = comments[0]?.count || 0;
      } catch (e) {
        console.error("Error fetching comments count:", e);
      }

      try {
        const [saves] = await pool.query(
          "SELECT COUNT(*) as count FROM women_post_saves WHERE post_id = ?",
          [post.id]
        );
        saves_count = saves[0]?.count || 0;
      } catch (e) {
        console.error("Error fetching saves count:", e);
      }

      try {
        const [shares] = await pool.query(
          "SELECT COUNT(*) as count FROM women_post_shares WHERE post_id = ?",
          [post.id]
        );
        shares_count = shares[0]?.count || 0;
      } catch (e) {
        console.error("Error fetching shares count:", e);
      }

      return {
        ...post,
        likes_count,
        comments_count,
        saves_count,
        shares_count
      };
    }));

    res.json({ posts: postsWithCounts });
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

// Delete community post (vendor - only own posts)
router.delete("/community/posts/:id", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if post belongs to user
    const [post] = await pool.query(
      "SELECT author_id FROM women_community_posts WHERE id = ?",
      [id]
    );

    if (post.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post[0].author_id !== userId) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    await pool.query(
      "DELETE FROM women_community_posts WHERE id = ?",
      [id]
    );

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Error deleting post" });
  }
});

// Like community post (one like per person)
router.post("/community/posts/:id/like", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user already liked this post
    const [existingLike] = await pool.query(
      "SELECT * FROM women_post_likes WHERE post_id = ? AND user_id = ?",
      [id, userId]
    );

    if (existingLike.length > 0) {
      // Unlike the post
      await pool.query(
        "DELETE FROM women_post_likes WHERE post_id = ? AND user_id = ?",
        [id, userId]
      );
      await pool.query(
        "UPDATE women_community_posts SET likes_count = likes_count - 1 WHERE id = ?",
        [id]
      );
      return res.json({ message: "Post unliked successfully", liked: false });
    }

    // Like the post
    await pool.query(
      "INSERT INTO women_post_likes (post_id, user_id) VALUES (?, ?)",
      [id, userId]
    );
    await pool.query(
      "UPDATE women_community_posts SET likes_count = likes_count + 1 WHERE id = ?",
      [id]
    );

    res.json({ message: "Post liked successfully", liked: true });
  } catch (err) {
    console.error("Error liking post:", err);
    res.status(500).json({ message: "Error liking post" });
  }
});

// Check if user liked a post
router.get("/community/posts/:id/liked", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [like] = await pool.query(
      "SELECT * FROM women_post_likes WHERE post_id = ? AND user_id = ?",
      [id, userId]
    );

    res.json({ liked: like.length > 0 });
  } catch (err) {
    console.error("Error checking like status:", err);
    // Return false if table doesn't exist
    res.json({ liked: false });
  }
});

// Get comments for a post
router.get("/community/posts/:id/comments", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const { id } = req.params;

    const [comments] = await pool.query(
      "SELECT * FROM women_post_comments WHERE post_id = ? ORDER BY created_at DESC",
      [id]
    );

    res.json({ comments: comments || [] });
  } catch (err) {
    console.error("Error fetching comments:", err);
    // Return empty array if table doesn't exist
    res.json({ comments: [] });
  }
});

// Add comment to a post
router.post("/community/posts/:id/comments", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    // Get vendor profile info
    const [vendor] = await pool.query(
      "SELECT first_name, last_name FROM vendor_profiles WHERE user_id = ?",
      [userId]
    );

    const author_name = vendor.length > 0 
      ? `${vendor[0].first_name} ${vendor[0].last_name}`
      : "Anonymous";

    const [result] = await pool.query(
      "INSERT INTO women_post_comments (post_id, user_id, author_name, content) VALUES (?, ?, ?, ?)",
      [id, userId, author_name, content.trim()]
    );

    // Update comment count
    await pool.query(
      "UPDATE women_community_posts SET comments_count = comments_count + 1 WHERE id = ?",
      [id]
    );

    res.status(201).json({ message: "Comment added successfully", id: result.insertId });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Error adding comment" });
  }
});

// Delete comment
router.delete("/community/comments/:id", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comment belongs to user
    const [comment] = await pool.query(
      "SELECT post_id FROM women_post_comments WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (comment.length === 0) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }

    const postId = comment[0].post_id;

    await pool.query(
      "DELETE FROM women_post_comments WHERE id = ?",
      [id]
    );

    // Update comment count
    try {
      await pool.query(
        "UPDATE women_community_posts SET comments_count = comments_count - 1 WHERE id = ?",
        [postId]
      );
    } catch (e) {
      console.error("Error updating comment count:", e);
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Error deleting comment" });
  }
});

// Edit comment
router.put("/community/comments/:id", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    // Check if comment belongs to user
    const [comment] = await pool.query(
      "SELECT * FROM women_post_comments WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (comment.length === 0) {
      return res.status(403).json({ message: "You can only edit your own comments" });
    }

    await pool.query(
      "UPDATE women_post_comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [content.trim(), id]
    );

    res.json({ message: "Comment updated successfully" });
  } catch (err) {
    console.error("Error editing comment:", err);
    res.status(500).json({ message: "Error editing comment" });
  }
});

// Save/bookmark a post
router.post("/community/posts/:id/save", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user already saved this post
    let existingSave = [];
    try {
      [existingSave] = await pool.query(
        "SELECT * FROM women_post_saves WHERE post_id = ? AND user_id = ?",
        [id, userId]
      );
    } catch (e) {
      console.error("Error checking existing save:", e);
    }

    if (existingSave.length > 0) {
      // Unsave the post
      try {
        await pool.query(
          "DELETE FROM women_post_saves WHERE post_id = ? AND user_id = ?",
          [id, userId]
        );
      } catch (e) {
        console.error("Error deleting save record:", e);
      }
      return res.json({ message: "Post unsaved successfully", saved: false });
    }

    // Save the post
    try {
      await pool.query(
        "INSERT INTO women_post_saves (post_id, user_id) VALUES (?, ?)",
        [id, userId]
      );
    } catch (e) {
      console.error("Error inserting save record:", e);
    }

    res.json({ message: "Post saved successfully", saved: true });
  } catch (err) {
    console.error("Error saving post:", err);
    // Return success even if table doesn't exist
    res.json({ message: "Post saved successfully", saved: true });
  }
});

// Check if user saved a post
router.get("/community/posts/:id/saved", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [save] = await pool.query(
      "SELECT * FROM women_post_saves WHERE post_id = ? AND user_id = ?",
      [id, userId]
    );

    res.json({ saved: save.length > 0 });
  } catch (err) {
    console.error("Error checking save status:", err);
    // Return false if table doesn't exist
    res.json({ saved: false });
  }
});

// Get saved posts for a user
router.get("/community/saved-posts", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const userId = req.user.id;

    const [savedPosts] = await pool.query(
      `SELECT p.*, s.created_at as saved_at 
       FROM women_post_saves s 
       JOIN women_community_posts p ON s.post_id = p.id 
       WHERE s.user_id = ? 
       ORDER BY s.created_at DESC`,
      [userId]
    );

    res.json({ posts: savedPosts });
  } catch (err) {
    console.error("Error fetching saved posts:", err);
    res.status(500).json({ message: "Error fetching saved posts" });
  }
});

// Share a post
router.post("/community/posts/:id/share", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;
    const userId = req.user.id;

    // Record the share
    try {
      await pool.query(
        "INSERT INTO women_post_shares (post_id, user_id, share_platform) VALUES (?, ?, ?)",
        [id, userId, platform || 'other']
      );
    } catch (e) {
      console.error("Error inserting share record:", e);
    }

    // Update share count
    try {
      await pool.query(
        "UPDATE women_community_posts SET shares_count = shares_count + 1 WHERE id = ?",
        [id]
      );
    } catch (e) {
      console.error("Error updating share count:", e);
    }

    res.json({ message: "Post share recorded successfully" });
  } catch (err) {
    console.error("Error recording share:", err);
    // Return success even if table doesn't exist
    res.json({ message: "Post share recorded successfully" });
  }
});

// Get community statistics
router.get("/community/stats", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    let activeMembers = 0, totalPosts = 0, helpfulResponses = 0, savedResources = 0;

    // Get active members (female vendors)
    try {
      const [result] = await pool.query(
        "SELECT COUNT(*) as count FROM vendor_profiles WHERE gender = 'female'"
      );
      activeMembers = result[0]?.count || 0;
    } catch (e) {
      console.error("Error fetching active members:", e);
    }

    // Get total posts
    try {
      const [result] = await pool.query(
        "SELECT COUNT(*) as count FROM women_community_posts WHERE is_approved = 1"
      );
      totalPosts = result[0]?.count || 0;
    } catch (e) {
      console.error("Error fetching total posts:", e);
    }

    // Get helpful responses (comments count)
    try {
      const [result] = await pool.query(
        "SELECT COUNT(*) as count FROM women_post_comments"
      );
      helpfulResponses = result[0]?.count || 0;
    } catch (e) {
      console.error("Error fetching helpful responses:", e);
    }

    // Get saved resources (total saves)
    try {
      const [result] = await pool.query(
        "SELECT COUNT(*) as count FROM women_post_saves"
      );
      savedResources = result[0]?.count || 0;
    } catch (e) {
      console.error("Error fetching saved resources:", e);
    }

    res.json({
      activeMembers,
      totalPosts,
      helpfulResponses,
      savedResources
    });
  } catch (err) {
    console.error("Error fetching community stats:", err);
    res.status(500).json({ message: "Error fetching community stats" });
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
