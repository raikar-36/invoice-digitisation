const bcrypt = require('bcryptjs');
const { getPostgresPool } = require('../config/database');
const auditService = require('../services/audit.service');

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (!['STAFF', 'ACCOUNTANT'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be STAFF or ACCOUNTANT'
      });
    }

    const pool = getPostgresPool();

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, status, created_at`,
      [name, email, passwordHash, role, 'ACTIVE']
    );

    const newUser = result.rows[0];

    // Log audit
    await auditService.log({
      userId: req.user.userId,
      action: 'USER_CREATED',
      details: {
        created_user_id: newUser.id,
        email: newUser.email,
        role: newUser.role
      }
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT id, name, email, role, status, created_at, last_login
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;

    if (parseInt(id) === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate yourself'
      });
    }

    const pool = getPostgresPool();

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update status
    await pool.query(
      'UPDATE users SET status = $1 WHERE id = $2',
      ['INACTIVE', id]
    );

    // Log audit
    await auditService.log({
      userId: currentUserId,
      action: 'USER_DEACTIVATED',
      details: {
        deactivated_user_id: parseInt(id),
        email: userCheck.rows[0].email
      }
    });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user'
    });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const currentUserId = req.user.userId;

    if (parseInt(id) === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    if (!['STAFF', 'ACCOUNTANT'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be STAFF or ACCOUNTANT'
      });
    }

    const pool = getPostgresPool();

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id, email, role as old_role FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update role
    await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      [role, id]
    );

    // Log audit
    await auditService.log({
      userId: currentUserId,
      action: 'USER_ROLE_CHANGED',
      details: {
        user_id: parseInt(id),
        email: userCheck.rows[0].email,
        old_role: userCheck.rows[0].old_role,
        new_role: role
      }
    });

    res.json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change user role'
    });
  }
};

exports.reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;

    const pool = getPostgresPool();

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id, email, role, status FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userCheck.rows[0].status === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'User is already active'
      });
    }

    // Update status
    await pool.query(
      'UPDATE users SET status = $1 WHERE id = $2',
      ['ACTIVE', id]
    );

    // Log audit
    await auditService.log({
      userId: currentUserId,
      action: 'USER_REACTIVATED',
      details: {
        reactivated_user_id: parseInt(id),
        email: userCheck.rows[0].email
      }
    });

    res.json({
      success: true,
      message: 'User reactivated successfully'
    });
  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate user'
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;

    if (parseInt(id) === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete yourself'
      });
    }

    const pool = getPostgresPool();

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has created invoices
    const invoiceCheck = await pool.query(
      'SELECT COUNT(*) as count FROM invoices WHERE created_by = $1',
      [id]
    );

    if (parseInt(invoiceCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with associated invoices. Please deactivate instead.'
      });
    }

    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    // Log audit
    await auditService.log({
      userId: currentUserId,
      action: 'USER_DELETED',
      details: {
        deleted_user_id: parseInt(id),
        email: userCheck.rows[0].email,
        role: userCheck.rows[0].role
      }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};
