const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    companyName: { type: String, required: true },
    adminUid: { type: String, required: true, index: true },
    status: { type: String, enum: ['active', 'inactive', 'deleted'], default: 'active', index: true },
    plan: { type: String, default: 'basic' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);
