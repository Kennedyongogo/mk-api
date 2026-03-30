const { ServiceRequest, Service } = require("../models");
const { Op } = require("sequelize");

// Create service request (public)
const createServiceRequest = async (req, res) => {
  try {
    const { serviceId, fullName, email, phone, message } = req.body;

    if (!serviceId || !fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide serviceId, fullName, email, and phone",
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Only allow requests for published services
    const service = await Service.findOne({
      where: { id: serviceId, status: "published" },
      attributes: ["id", "title"],
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const serviceRequest = await ServiceRequest.create({
      serviceId,
      serviceTitle: service.title || null,
      fullName,
      email,
      phone,
      message: message || null,
      status: "new",
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent") || null,
    });

    return res.status(201).json({
      success: true,
      message: "Thank you for your request. We'll contact you soon.",
      data: { id: serviceRequest.id },
    });
  } catch (error) {
    console.error("Error creating service request:", error);
    return res.status(500).json({
      success: false,
      message: "Error submitting service request",
      error: error.message,
    });
  }
};

// Get all service requests (admin)
const getAllServiceRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { serviceTitle: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await ServiceRequest.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
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
    console.error("Error fetching service requests:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching service requests",
      error: error.message,
    });
  }
};

// Get service request by ID (admin)
const getServiceRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const serviceRequest = await ServiceRequest.findByPk(id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: serviceRequest,
    });
  } catch (error) {
    console.error("Error fetching service request:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching service request",
      error: error.message,
    });
  }
};

// Update service request (admin)
const updateServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const serviceRequest = await ServiceRequest.findByPk(id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    const oldValues = serviceRequest.toJSON();

    if (updates.status && updates.status !== serviceRequest.status) {
      updates.reviewedBy = req.user?.id || null;
      updates.reviewedAt = new Date();
    }

    await serviceRequest.update(updates);
    await serviceRequest.reload();

    return res.status(200).json({
      success: true,
      message: "Service request updated successfully",
      data: serviceRequest,
      oldValues,
    });
  } catch (error) {
    console.error("Error updating service request:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating service request",
      error: error.message,
    });
  }
};

// Update service request status (admin)
const updateServiceRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["new", "read", "replied", "archived"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid status (new, read, replied, archived)",
      });
    }

    const serviceRequest = await ServiceRequest.findByPk(id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    const oldStatus = serviceRequest.status;
    serviceRequest.status = status;
    serviceRequest.reviewedBy = req.user?.id || null;
    serviceRequest.reviewedAt = new Date();
    await serviceRequest.save();

    return res.status(200).json({
      success: true,
      message: "Service request status updated successfully",
      data: serviceRequest,
      oldStatus,
    });
  } catch (error) {
    console.error("Error updating service request status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating service request status",
      error: error.message,
    });
  }
};

// Delete service request (admin)
const deleteServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceRequest = await ServiceRequest.findByPk(id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    await serviceRequest.destroy();

    return res.status(200).json({
      success: true,
      message: "Service request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service request:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting service request",
      error: error.message,
    });
  }
};

module.exports = {
  createServiceRequest,
  getAllServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  updateServiceRequestStatus,
  deleteServiceRequest,
};

