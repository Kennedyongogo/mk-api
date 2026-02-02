const express = require("express");
const router = express.Router();
const { getMe, completeProfile, uploadProfilePhoto } = require("../controllers/marketplaceProfileController");
const { authenticateMarketplace } = require("../middleware/auth");
const { uploadMarketplaceProfilePhoto, handleUploadError } = require("../middleware/upload");

router.get("/me", authenticateMarketplace, getMe);
router.put("/complete", authenticateMarketplace, completeProfile);
router.post("/upload-photo", authenticateMarketplace, uploadMarketplaceProfilePhoto, handleUploadError, uploadProfilePhoto);

module.exports = router;
