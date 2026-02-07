const { MarketplaceUser, MarketplaceUserProfile } = require("../models");
const { convertToRelativePath } = require("../utils/filePath");
const bcrypt = require("bcryptjs");

// Get current user + profile (protected)
const getMe = async (req, res) => {
  try {
    const user = await MarketplaceUser.findByPk(req.userId, {
      attributes: { exclude: ["password"] },
      include: [{ model: MarketplaceUserProfile, as: "profile", required: false }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const data = user.toJSON();
    data.profile = user.profile || null;

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Marketplace getMe error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

// Complete profile (role + common + role-specific)
const completeProfile = async (req, res) => {
  try {
    const {
      role,
      fullName,
      email,
      phone,
      currentPassword,
      newPassword,
      country,
      region,
      district,
      preferredLanguage,
      profilePhotoUrl,
      primaryActivity,
      produces,
      scaleOfOperation,
      farmOrBusinessName,
      bio,
      roleSpecificData,
    } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    const validRoles = ["farmer", "buyer", "input_supplier", "veterinarian", "consultant"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    if (!profilePhotoUrl || typeof profilePhotoUrl !== "string" || !profilePhotoUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: "Profile picture is required for identity verification",
      });
    }

    const user = await MarketplaceUser.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to set a new password",
        });
      }
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters",
        });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    if (email !== undefined && email !== null && String(email).trim() !== "") {
      const newEmail = String(email).trim().toLowerCase();
      if (newEmail !== user.email) {
        const existing = await MarketplaceUser.findOne({ where: { email: newEmail } });
        if (existing && existing.id !== user.id) {
          return res.status(400).json({
            success: false,
            message: "An account with this email already exists",
          });
        }
        user.email = newEmail;
      }
    }

    if (fullName !== undefined && fullName !== null && String(fullName).trim() !== "") {
      user.fullName = String(fullName).trim();
    }

    const now = new Date();

    const [profile] = await MarketplaceUserProfile.findOrCreate({
      where: { userId: user.id },
      defaults: { userId: user.id },
    });

    await profile.update({
      country: country?.trim() || null,
      region: region?.trim() || null,
      district: district?.trim() || null,
      preferredLanguage: preferredLanguage?.trim() || null,
      profilePhotoUrl: profilePhotoUrl?.trim() || null,
      primaryActivity: primaryActivity || null,
      produces: produces && Array.isArray(produces) ? produces : null,
      scaleOfOperation: scaleOfOperation || null,
      farmOrBusinessName: farmOrBusinessName?.trim() || null,
      bio: bio?.trim() || null,
      roleSpecificData: roleSpecificData && typeof roleSpecificData === "object" ? roleSpecificData : null,
    });

    const userUpdate = {
      role,
      profileCompleted: true,
      profileCompletedAt: now,
      status: "active",
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(fullName !== undefined && fullName !== null && String(fullName).trim() !== "" && { fullName: String(fullName).trim() }),
      ...(email !== undefined && email !== null && String(email).trim() !== "" && { email: String(email).trim().toLowerCase() }),
    };
    if (newPassword) userUpdate.password = user.password;
    await user.update(userUpdate);

    const updatedUser = await MarketplaceUser.findByPk(user.id, {
      attributes: { exclude: ["password"] },
      include: [{ model: MarketplaceUserProfile, as: "profile", required: false }],
    });

    res.status(200).json({
      success: true,
      message: "Profile completed successfully",
      data: updatedUser.toJSON(),
    });
  } catch (error) {
    console.error("Marketplace completeProfile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete profile",
      error: error.message,
    });
  }
};

// Upload profile photo (returns URL path for use in completeProfile)
const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({
        success: false,
        message: "No profile photo file uploaded",
      });
    }
    const relativePath = convertToRelativePath(req.file.path);
    const profilePhotoUrl = relativePath ? `/${relativePath}` : null;
    res.status(200).json({
      success: true,
      message: "Profile photo uploaded",
      profilePhotoUrl,
    });
  } catch (error) {
    console.error("Marketplace uploadProfilePhoto error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload profile photo",
      error: error.message,
    });
  }
};

// Get all marketplace users (admin only)
const getAllMarketplaceUsers = async (req, res) => {
  try {
    const users = await MarketplaceUser.findAll({
      attributes: { exclude: ["password"] },
      include: [{ model: MarketplaceUserProfile, as: "profile", required: false }],
      order: [["createdAt", "DESC"]],
    });

    const data = users.map((u) => {
      const json = u.toJSON();
      json.profile = u.profile || null;
      return json;
    });

    res.status(200).json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error("Marketplace getAllMarketplaceUsers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch marketplace users",
      error: error.message,
    });
  }
};

// Delete marketplace user (admin only). Profile is deleted via CASCADE.
const deleteMarketplaceUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await MarketplaceUser.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Marketplace user not found",
      });
    }
    await user.destroy();
    res.status(200).json({
      success: true,
      message: "Marketplace user deleted",
    });
  } catch (error) {
    console.error("Marketplace deleteMarketplaceUser error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete marketplace user",
      error: error.message,
    });
  }
};

module.exports = { getMe, completeProfile, uploadProfilePhoto, getAllMarketplaceUsers, deleteMarketplaceUser };
