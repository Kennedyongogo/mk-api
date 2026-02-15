const express = require("express");
const router = express.Router();
const {
  createListing,
  getMyListings,
  getPublicListings,
  getListingById,
  updateListing,
  deleteListing,
  getListingsForAdmin,
  approveListing,
  rejectListing,
} = require("../controllers/marketplaceListingController");
const { authenticateMarketplace, authenticateAdmin, optionalAuthenticateMarketplace } = require("../middleware/auth");

// User (marketplace authenticated)
router.post("/listings", authenticateMarketplace, createListing);
router.get("/listings/my", authenticateMarketplace, getMyListings);
router.get("/listings/public", getPublicListings);
router.get("/listings/:id", optionalAuthenticateMarketplace, getListingById);
router.patch("/listings/:id", authenticateMarketplace, updateListing);
router.delete("/listings/:id", authenticateMarketplace, deleteListing);

// Admin
router.get("/admin/listings", authenticateAdmin, getListingsForAdmin);
router.patch("/admin/listings/:id/approve", authenticateAdmin, approveListing);
router.patch("/admin/listings/:id/reject", authenticateAdmin, rejectListing);

module.exports = router;
