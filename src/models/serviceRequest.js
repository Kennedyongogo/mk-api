const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ServiceRequest = sequelize.define(
    "ServiceRequest",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "services",
          key: "id",
        },
        comment: "Requested service id",
      },
      serviceTitle: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Service title snapshot at request time",
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 200],
        },
        comment: "Full name of the person requesting the service",
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
        comment: "Email address of the requester",
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Phone number of the requester",
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Optional message from the requester",
      },
      status: {
        type: DataTypes.ENUM("new", "read", "replied", "archived"),
        allowNull: false,
        defaultValue: "new",
        comment: "Status of the service request",
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "IP address of the submitter",
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "User agent of the submitter",
      },
      reviewedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "admin_users",
          key: "id",
        },
        comment: "Admin user who reviewed this request",
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "When this request was reviewed",
      },
    },
    {
      tableName: "service_requests",
      timestamps: true,
      indexes: [
        { fields: ["status"] },
        { fields: ["email"] },
        { fields: ["createdAt"] },
      ],
    }
  );

  return ServiceRequest;
};

