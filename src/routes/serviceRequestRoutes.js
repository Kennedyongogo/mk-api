const express = require("express");
const router = express.Router();

const {
  createServiceRequest,
  getAllServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  updateServiceRequestStatus,
  deleteServiceRequest,
} = require("../controllers/serviceRequestController");

const {
  authenticateAdmin,
  requireAdminOrHigher,
} = require("../middleware/auth");

const { errorHandler } = require("../middleware/errorHandler");

// Public route
/**
 * @route   POST /api/service-request
 * @desc    Create a new service request (public)
 * @access  Public
 */
router.post("/", createServiceRequest);

// Admin routes
router.use(authenticateAdmin);
router.use(requireAdminOrHigher);

/**
 * @route   GET /api/service-request
 * @desc    Get all service requests with filters (admin)
 * @access  Admin
 */
router.get("/", getAllServiceRequests);

/**
 * @route   GET /api/service-request/:id
 * @desc    Get service request by ID (admin)
 * @access  Admin
 */
router.get("/:id", getServiceRequestById);

/**
 * @route   PUT /api/service-request/:id
 * @desc    Update service request (admin)
 * @access  Admin
 */
router.put("/:id", updateServiceRequest);

/**
 * @route   PUT /api/service-request/:id/status
 * @desc    Update service request status (admin)
 * @access  Admin
 */
router.put("/:id/status", updateServiceRequestStatus);

/**
 * @route   DELETE /api/service-request/:id
 * @desc    Delete service request (admin)
 * @access  Admin
 */
router.delete("/:id", deleteServiceRequest);

router.use(errorHandler);

module.exports = router;

