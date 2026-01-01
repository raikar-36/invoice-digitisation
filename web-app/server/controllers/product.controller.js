const { getPostgresPool } = require('../config/database');

exports.getAllProducts = async (req, res) => {
  try {
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT p.*, 
              COUNT(DISTINCT ii.invoice_id) as times_sold,
              SUM(ii.quantity) as total_quantity,
              SUM(ii.line_total) as total_revenue
       FROM products p
       LEFT JOIN invoice_items ii ON p.id = ii.product_id
       LEFT JOIN invoices i ON ii.invoice_id = i.id AND i.status = 'APPROVED'
       GROUP BY p.id
       ORDER BY total_revenue DESC NULLS LAST`
    );

    res.json({
      success: true,
      products: result.rows
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products'
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPostgresPool();

    const productResult = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product: productResult.rows[0]
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product'
    });
  }
};
