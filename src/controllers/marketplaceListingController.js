const {
  MarketplaceListing,
  MarketplaceUser,
  MarketplaceUserProfile,
  AdminUser,
} = require("../models");

// Create listing (marketplace user, authenticated)
const createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      price,
      priceUnit,
      quantity,
      quantityUnit,
      location,
      imageUrl,
    } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const listing = await MarketplaceListing.create({
      userId: req.userId,
      title: String(title).trim().slice(0, 255),
      description:
        description != null && String(description).trim() !== ""
          ? String(description).trim()
          : null,
      category:
        category != null && String(category).trim() !== ""
          ? String(category).trim().slice(0, 128)
          : null,
      price:
        price != null && price !== "" && !isNaN(parseFloat(price))
          ? parseFloat(price)
          : null,
      priceUnit:
        priceUnit != null && String(priceUnit).trim() !== ""
          ? String(priceUnit).trim().slice(0, 32)
          : null,
      quantity:
        quantity != null && quantity !== "" && !isNaN(parseFloat(quantity))
          ? parseFloat(quantity)
          : null,
      quantityUnit:
        quantityUnit != null && String(quantityUnit).trim() !== ""
          ? String(quantityUnit).trim().slice(0, 32)
          : null,
      location:
        location != null && String(location).trim() !== ""
          ? String(location).trim().slice(0, 255)
          : null,
      imageUrl:
        imageUrl != null && String(imageUrl).trim() !== ""
          ? String(imageUrl).trim().slice(0, 512)
          : null,
      status: "pending_approval",
    });

    const withUser = await MarketplaceListing.findByPk(listing.id, {
      include: [{ model: MarketplaceUser, as: "user", attributes: ["id", "fullName", "email"] }],
    });

    res.status(201).json({
      success: true,
      message: "Listing created and pending approval",
      data: withUser.toJSON(),
    });
  } catch (error) {
    console.error("Marketplace createListing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create listing",
      error: error.message,
    });
  }
};

// Get current user's listings (marketplace user, authenticated)
const getMyListings = async (req, res) => {
  try {
    const listings = await MarketplaceListing.findAll({
      where: { userId: req.userId },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: listings.map((l) => l.toJSON()),
      total: listings.length,
    });
  } catch (error) {
    console.error("Marketplace getMyListings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your listings",
      error: error.message,
    });
  }
};

// Get public listings (only approved; no auth)
const getPublicListings = async (req, res) => {
  try {
    const listings = await MarketplaceListing.findAll({
      where: { status: "approved" },
      include: [
        {
          model: MarketplaceUser,
          as: "user",
          attributes: ["id", "fullName", "isVerified"],
          include: [
            {
              model: MarketplaceUserProfile,
              as: "profile",
              required: false,
              attributes: ["region", "district", "profilePhotoUrl"],
            },
          ],
        },
      ],
      order: [["approvedAt", "DESC"], ["createdAt", "DESC"]],
    });

    const data = listings.map((l) => {
      const json = l.toJSON();
      json.user = l.user ? { ...l.user.toJSON(), profile: l.user.profile || null } : null;
      return json;
    });

    res.status(200).json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error("Marketplace getPublicListings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch listings",
      error: error.message,
    });
  }
};

// Get single listing by id: public if approved, or owner can see own in any status
const getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await MarketplaceListing.findByPk(id, {
      include: [
        {
          model: MarketplaceUser,
          as: "user",
          attributes: ["id", "fullName", "email", "phone", "isVerified"],
          include: [
            {
              model: MarketplaceUserProfile,
              as: "profile",
              required: false,
              attributes: ["region", "district", "profilePhotoUrl", "farmOrBusinessName"],
            },
          ],
        },
      ],
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    const isOwner = req.userId && req.userId === listing.userId;
    if (listing.status !== "approved" && !isOwner) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    const data = listing.toJSON();
    data.user = listing.user ? { ...listing.user.toJSON(), profile: listing.user.profile || null } : null;

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Marketplace getListingById error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch listing",
      error: error.message,
    });
  }
};

// Update listing (marketplace user, owner only; only when pending_approval or rejected)
const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await MarketplaceListing.findByPk(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    if (listing.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own listings",
      });
    }

    if (listing.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Approved listings cannot be edited; contact support if needed",
      });
    }

    const {
      title,
      description,
      category,
      price,
      priceUnit,
      quantity,
      quantityUnit,
      location,
      imageUrl,
    } = req.body;

    const updates = {};
    if (title !== undefined && typeof title === "string" && title.trim())
      updates.title = title.trim().slice(0, 255);
    if (description !== undefined)
      updates.description =
        description != null && String(description).trim() !== "" ? String(description).trim() : null;
    if (category !== undefined)
      updates.category =
        category != null && String(category).trim() !== ""
          ? String(category).trim().slice(0, 128)
          : null;
    if (price !== undefined)
      updates.price =
        price != null && price !== "" && !isNaN(parseFloat(price)) ? parseFloat(price) : null;
    if (priceUnit !== undefined)
      updates.priceUnit =
        priceUnit != null && String(priceUnit).trim() !== ""
          ? String(priceUnit).trim().slice(0, 32)
          : null;
    if (quantity !== undefined)
      updates.quantity =
        quantity != null && quantity !== "" && !isNaN(parseFloat(quantity))
          ? parseFloat(quantity)
          : null;
    if (quantityUnit !== undefined)
      updates.quantityUnit =
        quantityUnit != null && String(quantityUnit).trim() !== ""
          ? String(quantityUnit).trim().slice(0, 32)
          : null;
    if (location !== undefined)
      updates.location =
        location != null && String(location).trim() !== ""
          ? String(location).trim().slice(0, 255)
          : null;
    if (imageUrl !== undefined)
      updates.imageUrl =
        imageUrl != null && String(imageUrl).trim() !== ""
          ? String(imageUrl).trim().slice(0, 512)
          : null;

    if (listing.status === "rejected") {
      updates.status = "pending_approval";
      updates.rejectedReason = null;
    }

    if (Object.keys(updates).length > 0) await listing.update(updates);

    const updated = await MarketplaceListing.findByPk(id, {
      include: [{ model: MarketplaceUser, as: "user", attributes: ["id", "fullName", "email"] }],
    });

    res.status(200).json({
      success: true,
      message: "Listing updated",
      data: updated.toJSON(),
    });
  } catch (error) {
    console.error("Marketplace updateListing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update listing",
      error: error.message,
    });
  }
};

// Delete listing (marketplace user, owner only)
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await MarketplaceListing.findByPk(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    if (listing.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own listings",
      });
    }

    await listing.destroy();
    res.status(200).json({
      success: true,
      message: "Listing deleted",
    });
  } catch (error) {
    console.error("Marketplace deleteListing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete listing",
      error: error.message,
    });
  }
};

// Admin: get all listings (any status)
const getListingsForAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && ["pending_approval", "approved", "rejected"].includes(String(status))) {
      where.status = status;
    }

    const listings = await MarketplaceListing.findAll({
      where,
      include: [
        { model: MarketplaceUser, as: "user", attributes: ["id", "fullName", "email"] },
        { model: AdminUser, as: "approver", required: false, attributes: ["id", "full_name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const data = listings.map((l) => {
      const json = l.toJSON();
      json.user = l.user || null;
      json.approver = l.approver || null;
      return json;
    });

    res.status(200).json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error("Marketplace getListingsForAdmin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch listings",
      error: error.message,
    });
  }
};

// Admin: approve listing
const approveListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await MarketplaceListing.findByPk(id, {
      include: [{ model: MarketplaceUser, as: "user", attributes: ["id", "fullName", "email"] }],
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    if (listing.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Listing is already approved",
      });
    }

    await listing.update({
      status: "approved",
      approvedAt: new Date(),
      approvedBy: req.userId,
      rejectedReason: null,
    });

    const updated = await MarketplaceListing.findByPk(id, {
      include: [
        { model: MarketplaceUser, as: "user", attributes: ["id", "fullName", "email"] },
        { model: AdminUser, as: "approver", attributes: ["id", "full_name", "email"] },
      ],
    });

    const data = updated.toJSON();
    data.user = updated.user || null;
    data.approver = updated.approver || null;

    res.status(200).json({
      success: true,
      message: "Listing approved",
      data,
    });
  } catch (error) {
    console.error("Marketplace approveListing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve listing",
      error: error.message,
    });
  }
};

// Admin: reject listing
const rejectListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedReason } = req.body;
    const listing = await MarketplaceListing.findByPk(id, {
      include: [{ model: MarketplaceUser, as: "user", attributes: ["id", "fullName", "email"] }],
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    if (listing.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Listing is already rejected",
      });
    }

    await listing.update({
      status: "rejected",
      rejectedReason:
        rejectedReason != null && String(rejectedReason).trim() !== ""
          ? String(rejectedReason).trim()
          : null,
      approvedAt: null,
      approvedBy: null,
    });

    const updated = await MarketplaceListing.findByPk(id, {
      include: [{ model: MarketplaceUser, as: "user", attributes: ["id", "fullName", "email"] }],
    });

    const data = updated.toJSON();
    data.user = updated.user || null;

    res.status(200).json({
      success: true,
      message: "Listing rejected",
      data,
    });
  } catch (error) {
    console.error("Marketplace rejectListing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject listing",
      error: error.message,
    });
  }
};

module.exports = {
  createListing,
  getMyListings,
  getPublicListings,
  getListingById,
  updateListing,
  deleteListing,
  getListingsForAdmin,
  approveListing,
  rejectListing,
};
