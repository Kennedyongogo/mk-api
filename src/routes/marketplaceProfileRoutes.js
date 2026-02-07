const express = require("express");
const router = express.Router();
const { getMe, completeProfile, uploadProfilePhoto, getAllMarketplaceUsers, deleteMarketplaceUser } = require("../controllers/marketplaceProfileController");
const { authenticateMarketplace, authenticateAdmin } = require("../middleware/auth");
const { uploadMarketplaceProfilePhoto, handleUploadError } = require("../middleware/upload");

router.get("/me", authenticateMarketplace, getMe);
router.put("/complete", authenticateMarketplace, completeProfile);
router.post("/upload-photo", authenticateMarketplace, uploadMarketplaceProfilePhoto, handleUploadError, uploadProfilePhoto);

// Admin only: list all marketplace users, delete user
router.get("/users", authenticateAdmin, getAllMarketplaceUsers);
router.delete("/users/:id", authenticateAdmin, deleteMarketplaceUser);

module.exports = router;
