const { JobOpportunity, sequelize } = require("../models");
const { Op } = require("sequelize");
const path = require("path");
const { convertToRelativePath } = require("../utils/filePath");
const { deleteFile } = require("../middleware/upload");
const {
  logCreate,
  logUpdate,
  logDelete,
  logStatusChange,
} = require("../utils/auditLogger");

function normalizeEmailLike(value) {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (raw.toLowerCase().startsWith("mailto:")) {
    const stripped = raw.slice("mailto:".length).trim();
    return stripped || null;
  }
  return raw;
}

// Create job opportunity (admin)
const createJobOpportunity = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      location,
      latitude,
      longitude,
      image,
      imageAltText,
      applyUrl,
      attachmentUrl,
      contactEmail,
      contactPhone,
      tags,
      featured,
    } = req.body;

    if (!type || !title) {
      return res.status(400).json({
        success: false,
        message: "Please provide type and title",
      });
    }

    // Basic location validation: you can allow null but this keeps UI consistent.
    // (Admin can still omit it; later you can add stricter rules.)
    const hasLocation = location && String(location).trim().length > 0;

    let parsedLatitude = null;
    let parsedLongitude = null;
    if (latitude !== undefined && latitude !== null && latitude !== "") {
      parsedLatitude = parseFloat(latitude);
      if (isNaN(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) {
        return res.status(400).json({ success: false, message: "Latitude must be between -90 and 90" });
      }
    }
    if (longitude !== undefined && longitude !== null && longitude !== "") {
      parsedLongitude = parseFloat(longitude);
      if (isNaN(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
        return res.status(400).json({ success: false, message: "Longitude must be between -180 and 180" });
      }
    }

    let imagePath = null;
    if (req.file && req.file.path) {
      imagePath = convertToRelativePath(req.file.path);
    } else if (image) {
      imagePath = image;
    }

    const tagsArray = (() => {
      if (!tags) return [];
      if (Array.isArray(tags)) return tags;
      if (typeof tags === "string") {
        try {
          return JSON.parse(tags);
        } catch (e) {
          return tags.split(",").map((t) => t.trim()).filter(Boolean);
        }
      }
      return [];
    })();

    const opportunity = await JobOpportunity.create({
      type,
      title: String(title).trim(),
      description: description != null ? String(description) : null,
      location: hasLocation ? String(location).trim() : null,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      image: imagePath,
      imageAltText,
      applyUrl: applyUrl || null,
      attachmentUrl: attachmentUrl || null,
      contactEmail: normalizeEmailLike(contactEmail),
      contactPhone: contactPhone || null,
      tags: tagsArray,
      featured: featured !== undefined ? (featured === true || featured === "true") : false,
      isActive:
        req.body.isActive !== undefined
          ? req.body.isActive === true || req.body.isActive === "true"
          : true,
      created_by: req.user?.id || null,
      updated_by: req.user?.id || null,
    });

    if (req.user) {
      await logCreate(req.user.id, "job_opportunity", opportunity.id, { type, title: opportunity.title }, req);
    }

    return res.status(201).json({
      success: true,
      message: "Job opportunity created successfully",
      data: opportunity,
    });
  } catch (error) {
    console.error("Error creating job opportunity:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating job opportunity",
      error: error.message,
    });
  }
};

// Get all job opportunities (admin)
const getAllJobOpportunities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      featured,
      isActive,
      location,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    if (type) where.type = type;
    if (featured !== undefined) where.featured = featured === "true";
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (location) where.location = { [Op.like]: `%${location}%` };

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await JobOpportunity.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder], ["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching job opportunities:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching job opportunities",
      error: error.message,
    });
  }
};

// Get public job opportunities (published/active only)
const getPublicJobOpportunities = async (req, res) => {
  try {
    const { type, featured, location, limit } = req.query;

    const where = { isActive: true, isDeleted: false };

    if (type) where.type = type;
    if (featured !== undefined) where.featured = featured === "true";
    if (location) where.location = { [Op.like]: `%${location}%` };

    const opportunities = await JobOpportunity.findAll({
      where,
      limit: limit ? parseInt(limit) : undefined,
      order: [
        ["featured", "DESC"],
        ["createdAt", "DESC"],
      ],
      attributes: {
        exclude: [],
      },
    });

    return res.status(200).json({
      success: true,
      count: opportunities.length,
      data: opportunities,
    });
  } catch (error) {
    console.error("Error fetching public job opportunities:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching job opportunities",
      error: error.message,
    });
  }
};

// Get by ID (admin)
const getJobOpportunityById = async (req, res) => {
  try {
    const { id } = req.params;
    const opportunity = await JobOpportunity.findByPk(id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: "Job opportunity not found" });
    }
    return res.status(200).json({ success: true, data: opportunity });
  } catch (error) {
    console.error("Error fetching job opportunity:", error);
    return res.status(500).json({ success: false, message: "Error fetching job opportunity", error: error.message });
  }
};

// Update (admin)
const updateJobOpportunity = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const opportunity = await JobOpportunity.findByPk(id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: "Job opportunity not found" });
    }

    const oldValues = opportunity.toJSON();
    const oldImage = opportunity.image;

    // Handle image upload
    if (req.file && req.file.path) {
      updates.image = convertToRelativePath(req.file.path);
      if (oldImage) {
        const oldImagePath = path.join(__dirname, "..", "..", oldImage);
        await deleteFile(oldImagePath);
      }
    } else if (updates.delete_image === "true" || updates.delete_image === true) {
      if (oldImage) {
        const oldImagePath = path.join(__dirname, "..", "..", oldImage);
        await deleteFile(oldImagePath);
        updates.image = null;
      }
    }

    // Convert booleans stored as strings
    if (updates.featured !== undefined) {
      updates.featured = updates.featured === true || updates.featured === "true";
    }
    if (updates.isActive !== undefined) {
      updates.isActive = updates.isActive === true || updates.isActive === "true";
    }

    if (Object.prototype.hasOwnProperty.call(updates, "contactEmail")) {
      updates.contactEmail = normalizeEmailLike(updates.contactEmail);
    }

    await opportunity.update(updates);
    await opportunity.reload();

    if (req.user) {
      await logUpdate(req.user.id, "job_opportunity", opportunity.id, oldValues, updates, req);
    }

    // Optional: if status changes, log it (using isActive as a "status" proxy)
    if (req.user && updates.isActive !== undefined && updates.isActive !== oldValues.isActive) {
      await logStatusChange(
        req.user.id,
        "job_opportunity",
        opportunity.id,
        oldValues.isActive,
        updates.isActive,
        req
      );
    }

    return res.status(200).json({
      success: true,
      message: "Job opportunity updated successfully",
      data: opportunity,
    });
  } catch (error) {
    console.error("Error updating job opportunity:", error);
    return res.status(500).json({ success: false, message: "Error updating job opportunity", error: error.message });
  }
};

// Delete (admin)
const deleteJobOpportunity = async (req, res) => {
  try {
    const { id } = req.params;
    const opportunity = await JobOpportunity.findByPk(id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: "Job opportunity not found" });
    }

    const oldValues = opportunity.toJSON();
    const oldImage = opportunity.image;

    await opportunity.destroy();

    if (oldImage) {
      const oldImagePath = path.join(__dirname, "..", "..", oldImage);
      await deleteFile(oldImagePath);
    }

    if (req.user) {
      await logDelete(req.user.id, "job_opportunity", opportunity.id, oldValues, req);
    }

    return res.status(200).json({ success: true, message: "Job opportunity deleted successfully" });
  } catch (error) {
    console.error("Error deleting job opportunity:", error);
    return res.status(500).json({ success: false, message: "Error deleting job opportunity", error: error.message });
  }
};

module.exports = {
  createJobOpportunity,
  getAllJobOpportunities,
  getPublicJobOpportunities,
  getJobOpportunityById,
  updateJobOpportunity,
  deleteJobOpportunity,
};

