const auditService = require('../services/audit.service');

exports.getInvoiceAudit = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await auditService.getInvoiceAudit(id);
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Get invoice audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit logs'
    });
  }
};

exports.getAllAudit = async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId,
      action: req.query.action,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const logs = await auditService.getAllAudit(filters);
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Get all audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit logs'
    });
  }
};
