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

// Feature 1: Search products with fuzzy matching for auto-complete
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    const pool = getPostgresPool();

    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        products: []
      });
    }

    // Try using pg_trgm for fuzzy search, fallback to ILIKE
    const result = await pool.query(
      `SELECT p.id, p.name, p.standard_price,
              COUNT(DISTINCT ii.invoice_id) as times_sold
       FROM products p
       LEFT JOIN invoice_items ii ON p.id = ii.product_id
       LEFT JOIN invoices i ON ii.invoice_id = i.id AND i.status = 'APPROVED'
       WHERE p.name ILIKE $1
       GROUP BY p.id
       ORDER BY 
         CASE WHEN p.name ILIKE $2 THEN 0 ELSE 1 END,
         times_sold DESC,
         p.name
       LIMIT 10`,
      [`%${q}%`, `${q}%`]
    );

    res.json({
      success: true,
      products: result.rows
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products'
    });
  }
};

// Feature 1: Get price range for a product from historical data
exports.getProductPriceRange = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPostgresPool();

    const result = await pool.query(
      `SELECT 
         MIN(unit_price) as min_price,
         MAX(unit_price) as max_price,
         AVG(unit_price) as avg_price,
         COUNT(*) as data_points
       FROM invoice_items
       WHERE product_id = $1`,
      [id]
    );

    if (result.rows[0].data_points === 0) {
      return res.json({
        success: true,
        hasData: false
      });
    }

    res.json({
      success: true,
      hasData: true,
      priceRange: {
        min: parseFloat(result.rows[0].min_price),
        max: parseFloat(result.rows[0].max_price),
        avg: parseFloat(result.rows[0].avg_price),
        dataPoints: parseInt(result.rows[0].data_points)
      }
    });
  } catch (error) {
    console.error('Get price range error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get price range'
    });
  }
};

// Feature 2: Find similar products to prevent duplicates
exports.findSimilarProducts = async (req, res) => {
  try {
    const { name } = req.body;
    const pool = getPostgresPool();

    if (!name || name.trim().length === 0) {
      return res.json({
        success: true,
        similarProducts: []
      });
    }

    // Try using pg_trgm similarity, fallback to basic matching
    let result;
    try {
      // Try with similarity function
      result = await pool.query(
        `SELECT *, similarity(name, $1) as sim
         FROM products
         WHERE similarity(name, $1) > 0.3
         ORDER BY sim DESC
         LIMIT 5`,
        [name]
      );
    } catch (err) {
      // Fallback to ILIKE if pg_trgm not available
      result = await pool.query(
        `SELECT *,
          CASE 
            WHEN LOWER(name) = LOWER($1) THEN 1.0
            WHEN LOWER(name) LIKE LOWER($1 || '%') THEN 0.8
            WHEN LOWER(name) LIKE LOWER('%' || $1 || '%') THEN 0.5
            ELSE 0.3
          END as sim
         FROM products
         WHERE LOWER(name) LIKE LOWER('%' || $1 || '%')
         ORDER BY sim DESC
         LIMIT 5`,
        [name]
      );
    }

    res.json({
      success: true,
      similarProducts: result.rows
    });
  } catch (error) {
    console.error('Find similar products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find similar products'
    });
  }
};

// Feature 2: Create new product
exports.createProduct = async (req, res) => {
  try {
    const { name, standard_price } = req.body;
    const pool = getPostgresPool();

    // Product name validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Product name must be at least 2 characters'
      });
    }

    if (name.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Product name must be less than 200 characters'
      });
    }

    // Standard price validation
    if (standard_price !== undefined && standard_price !== null) {
      const price = parseFloat(standard_price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Standard price must be a positive number'
        });
      }
      if (price > 10000000) {
        return res.status(400).json({
          success: false,
          message: 'Standard price cannot exceed ₹1,00,00,000'
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO products (name, standard_price)
       VALUES ($1, $2)
       RETURNING *`,
      [name.trim(), standard_price || 0]
    );

    res.status(201).json({
      success: true,
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
};
