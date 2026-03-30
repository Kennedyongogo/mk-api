const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const JobOpportunity = sequelize.define(
    "JobOpportunity",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      type: {
        type: DataTypes.ENUM("Job", "Internship", "Attachment"),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 255],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Keep location consistent with existing event/project patterns.
      // Later you can replace this with structured county/subcounty/ward fields.
      location: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Human-readable location text (e.g., Kiambu County)",
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: "Main image path (relative path from uploads directory)",
      },
      imageAltText: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: "image_alt_text",
      },
      // Optional external application URL (for Job/Internship)
      applyUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: "apply_url",
      },
      // Optional attachment URL (for Attachment type)
      attachmentUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: "attachment_url",
      },
      contactEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
        field: "contact_email",
      },
      contactPhone: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "contact_phone",
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      featured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_deleted",
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "admin_users",
          key: "id",
        },
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "admin_users",
          key: "id",
        },
      },
    },
    {
      tableName: "job_opportunities",
      timestamps: true,
      indexes: [
        { fields: ["type"] },
        { fields: ["location"] },
        { fields: ["featured"] },
        { fields: ["is_active"] },
        { fields: ["is_deleted"] },
        { fields: ["latitude", "longitude"] },
      ],
    }
  );

  return JobOpportunity;
};

