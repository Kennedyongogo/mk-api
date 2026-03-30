const express = require("express");
const router = express.Router();

const {
  createJobOpportunity,
  getAllJobOpportunities,
  getPublicJobOpportunities,
  getJobOpportunityById,
  updateJobOpportunity,
  deleteJobOpportunity,
} = require("../controllers/jobOpportunityController");

const { authenticateAdmin, requireAdminOrHigher } = require("../middleware/auth");
const { uploadJobOpportunityImage, handleUploadError } = require("../middleware/upload");
const { errorHandler } = require("../middleware/errorHandler");

// Public route
/**
 * @route   GET /api/job-opportunities/public
 * @desc    Get active job opportunities (public)
 * @access  Public
 */
router.get("/public", getPublicJobOpportunities);

// Admin routes
router.use(authenticateAdmin);
router.use(requireAdminOrHigher);

/**
 * @route   POST /api/job-opportunities
 * @desc    Create a new job opportunity
 * @access  Admin
 */
router.post("/", uploadJobOpportunityImage, handleUploadError, createJobOpportunity);

/**
 * @route   GET /api/job-opportunities
 * @desc    Get all job opportunities with filters (admin)
 * @access  Admin
 */
router.get("/", getAllJobOpportunities);

/**
 * @route   GET /api/job-opportunities/:id
 * @desc    Get job opportunity by ID (admin)
 * @access  Admin
 */
router.get("/:id", getJobOpportunityById);

/**
 * @route   PUT /api/job-opportunities/:id
 * @desc    Update job opportunity (admin)
 * @access  Admin
 */
router.put("/:id", uploadJobOpportunityImage, handleUploadError, updateJobOpportunity);

/**
 * @route   DELETE /api/job-opportunities/:id
 * @desc    Delete job opportunity (admin)
 * @access  Admin
 */
router.delete("/:id", deleteJobOpportunity);

router.use(errorHandler);

module.exports = router;

