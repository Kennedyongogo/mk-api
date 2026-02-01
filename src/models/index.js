const { sequelize } = require("../config/database");

// Import all models
const AdminUser = require("./adminUser")(sequelize);
const Document = require("./document")(sequelize);
const AuditTrail = require("./auditTrail")(sequelize);
const Review = require("./review")(sequelize);
const Blog = require("./blog")(sequelize);
const Member = require("./member")(sequelize);
const Service = require("./service")(sequelize);
const Project = require("./project")(sequelize);
const FAQ = require("./faq")(sequelize);
const Contact = require("./contact")(sequelize);
const QuoteRequest = require("./quoteRequest")(sequelize);
const Consultation = require("./consultation")(sequelize);
const InterestGallery = require("./interestGallery")(sequelize);

// Dynamic Form Models
const Form = require("./form")(sequelize);
const FormField = require("./formField")(sequelize);
const FieldOption = require("./fieldOption")(sequelize);
const FormSubmission = require("./formSubmission")(sequelize);

const models = {
  AdminUser,
  Document,
  AuditTrail,
  Review,
  Blog,
  Member,
  Service,
  Project,
  FAQ,
  Contact,
  QuoteRequest,
  Consultation,
  InterestGallery,
  // Dynamic Form Models
  Form,
  FormField,
  FieldOption,
  FormSubmission,
};

// Initialize models in correct order (parent tables first)
const initializeModels = async () => {
  try {
    console.log("🔄 Creating/updating tables...");

    // Use alter: false to prevent schema conflicts in production
    console.log("📋 Syncing tables...");
    await AdminUser.sync({ force: false, alter: false });
    await Document.sync({ force: false, alter: false });
    await AuditTrail.sync({ force: false, alter: false }); // Allow schema changes for enum updates
    await Review.sync({ force: false, alter: false });
    await Blog.sync({ force: false, alter: false });
    await Member.sync({ force: false, alter: false });
    await Service.sync({ force: false, alter: false });
    await Project.sync({ force: false, alter: false });
    await FAQ.sync({ force: false, alter: false });
    await Contact.sync({ force: false, alter: false });
    await QuoteRequest.sync({ force: false, alter: false });
    await Consultation.sync({ force: false, alter: false });
    await InterestGallery.sync({ force: false, alter: false });

    // Dynamic Form Models
    await Form.sync({ force: false, alter: false });
    await FormField.sync({ force: false, alter: false }); // Allow schema changes for conditional logic
    await FieldOption.sync({ force: false, alter: false });
    await FormSubmission.sync({ force: false, alter: false });

    console.log("✅ All models synced successfully");
  } catch (error) {
    console.error("❌ Error syncing models:", error);
    console.error("❌ Error details:", {
      name: error.name,
      message: error.message,
      parent: error.parent?.message,
      original: error.original?.message,
      sql: error.sql,
    });
    throw error;
  }
};

const setupAssociations = () => {
  try {
    // AdminUser → Document (1:Many for uploaded_by)
    models.AdminUser.hasMany(models.Document, {
      foreignKey: "uploaded_by",
      as: "uploadedDocuments",
    });
    models.Document.belongsTo(models.AdminUser, {
      foreignKey: "uploaded_by",
      as: "uploader",
    });

    // AdminUser → AuditTrail (1:Many)
    models.AdminUser.hasMany(models.AuditTrail, {
      foreignKey: "user_id",
      as: "auditLogs",
    });
    models.AuditTrail.belongsTo(models.AdminUser, {
      foreignKey: "user_id",
      as: "user",
    });

    // AdminUser → Blog (1:Many)
    models.AdminUser.hasMany(models.Blog, {
      foreignKey: "created_by",
      as: "createdBlogs",
    });
    models.Blog.belongsTo(models.AdminUser, {
      foreignKey: "created_by",
      as: "creator",
    });

    // AdminUser → Service (1:Many)
    models.AdminUser.hasMany(models.Service, {
      foreignKey: "created_by",
      as: "createdServices",
    });
    models.Service.belongsTo(models.AdminUser, {
      foreignKey: "created_by",
      as: "creator",
    });

    models.AdminUser.hasMany(models.Service, {
      foreignKey: "updated_by",
      as: "updatedServices",
    });
    models.Service.belongsTo(models.AdminUser, {
      foreignKey: "updated_by",
      as: "updater",
    });

    // AdminUser → Project (1:Many)
    models.AdminUser.hasMany(models.Project, {
      foreignKey: "created_by",
      as: "createdProjects",
    });
    models.Project.belongsTo(models.AdminUser, {
      foreignKey: "created_by",
      as: "creator",
    });

    models.AdminUser.hasMany(models.Project, {
      foreignKey: "updated_by",
      as: "updatedProjects",
    });
    models.Project.belongsTo(models.AdminUser, {
      foreignKey: "updated_by",
      as: "updater",
    });

    // AdminUser → FAQ (1:Many)
    models.AdminUser.hasMany(models.FAQ, {
      foreignKey: "created_by",
      as: "createdFAQs",
    });
    models.FAQ.belongsTo(models.AdminUser, {
      foreignKey: "created_by",
      as: "creator",
    });

    models.AdminUser.hasMany(models.FAQ, {
      foreignKey: "updated_by",
      as: "updatedFAQs",
    });
    models.FAQ.belongsTo(models.AdminUser, {
      foreignKey: "updated_by",
      as: "updater",
    });

    // AdminUser → Contact (1:Many)
    models.AdminUser.hasMany(models.Contact, {
      foreignKey: "reviewedBy",
      as: "reviewedContacts",
    });
    models.Contact.belongsTo(models.AdminUser, {
      foreignKey: "reviewedBy",
      as: "reviewer",
    });

    // AdminUser → QuoteRequest (1:Many)
    models.AdminUser.hasMany(models.QuoteRequest, {
      foreignKey: "reviewedBy",
      as: "reviewedQuoteRequests",
    });
    models.QuoteRequest.belongsTo(models.AdminUser, {
      foreignKey: "reviewedBy",
      as: "reviewer",
    });

    // AdminUser → Consultation (1:Many)
    models.AdminUser.hasMany(models.Consultation, {
      foreignKey: "reviewedBy",
      as: "reviewedConsultations",
    });
    models.Consultation.belongsTo(models.AdminUser, {
      foreignKey: "reviewedBy",
      as: "reviewer",
    });

    // InterestGallery Associations
    models.AdminUser.hasMany(models.InterestGallery, {
      foreignKey: "created_by",
      as: "createdInterestGalleryItems",
    });
    models.InterestGallery.belongsTo(models.AdminUser, {
      foreignKey: "created_by",
      as: "creator",
    });

    models.AdminUser.hasMany(models.InterestGallery, {
      foreignKey: "updated_by",
      as: "updatedInterestGalleryItems",
    });
    models.InterestGallery.belongsTo(models.AdminUser, {
      foreignKey: "updated_by",
      as: "updater",
    });

    // Dynamic Form Associations
    // Form → FormField (1:Many)
    models.Form.hasMany(models.FormField, {
      foreignKey: "form_id",
      as: "fields",
      onDelete: "CASCADE",
    });
    models.FormField.belongsTo(models.Form, {
      foreignKey: "form_id",
      as: "form",
    });

    // FormField → FieldOption (1:Many)
    models.FormField.hasMany(models.FieldOption, {
      foreignKey: "form_field_id",
      as: "options",
      onDelete: "CASCADE",
    });
    models.FieldOption.belongsTo(models.FormField, {
      foreignKey: "form_field_id",
      as: "field",
    });

    // Form → FormSubmission (1:Many)
    models.Form.hasMany(models.FormSubmission, {
      foreignKey: "form_id",
      as: "submissions",
      onDelete: "CASCADE",
    });
    models.FormSubmission.belongsTo(models.Form, {
      foreignKey: "form_id",
      as: "form",
    });

    // AdminUser → Form (created_by/updated_by)
    models.AdminUser.hasMany(models.Form, {
      foreignKey: "created_by",
      as: "createdForms",
    });
    models.Form.belongsTo(models.AdminUser, {
      foreignKey: "created_by",
      as: "creator",
    });

    models.AdminUser.hasMany(models.Form, {
      foreignKey: "updated_by",
      as: "updatedForms",
    });
    models.Form.belongsTo(models.AdminUser, {
      foreignKey: "updated_by",
      as: "updater",
    });

    // AdminUser → FormSubmission (reviewed_by)
    models.AdminUser.hasMany(models.FormSubmission, {
      foreignKey: "reviewed_by",
      as: "reviewedSubmissions",
    });
    models.FormSubmission.belongsTo(models.AdminUser, {
      foreignKey: "reviewed_by",
      as: "reviewer",
    });

    console.log("✅ All associations set up successfully");
  } catch (error) {
    console.error("❌ Error during setupAssociations:", error);
  }
};

module.exports = { ...models, initializeModels, setupAssociations, sequelize };
