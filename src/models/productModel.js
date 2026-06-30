const DB = require('./db');

class ProductModel {
    // Get all products with filters and pagination
    static async findAll(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        let sql = `
            SELECT p.*,
                   (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
            FROM products p
            WHERE p.deleted_at IS NULL
        `;
        
        const params = [];
        
        // Add filters
        if (filters.category) {
            sql += ` AND p.category = ?`;
            params.push(filters.category);
        }
        if (filters.status) {
            sql += ` AND p.status = ?`;
            params.push(filters.status);
        } else {
            sql += ` AND p.status = 'active'`;
        }
        if (filters.minPrice) {
            sql += ` AND p.price >= ?`;
            params.push(parseFloat(filters.minPrice));
        }
        if (filters.maxPrice) {
            sql += ` AND p.price <= ?`;
            params.push(parseFloat(filters.maxPrice));
        }
        if (filters.search) {
            sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        if (filters.brand) {
            sql += ` AND p.brand = ?`;
            params.push(filters.brand);
        }
        
        // Add sorting and pagination - convert to integers
        sql += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));
        
        return await DB.query(sql, params);
    }

    // Count total products with filters
    static async count(filters = {}) {
        let sql = `SELECT COUNT(*) as total FROM products p WHERE p.deleted_at IS NULL`;
        const params = [];
        
        if (filters.category) {
            sql += ` AND p.category = ?`;
            params.push(filters.category);
        }
        if (filters.status) {
            sql += ` AND p.status = ?`;
            params.push(filters.status);
        } else {
            sql += ` AND p.status = 'active'`;
        }
        if (filters.minPrice) {
            sql += ` AND p.price >= ?`;
            params.push(parseFloat(filters.minPrice));
        }
        if (filters.maxPrice) {
            sql += ` AND p.price <= ?`;
            params.push(parseFloat(filters.maxPrice));
        }
        if (filters.search) {
            sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        if (filters.brand) {
            sql += ` AND p.brand = ?`;
            params.push(filters.brand);
        }
        
        const result = await DB.query(sql, params);
        return result[0].total;
    }

    // Get single product by ID
    static async findById(id) {
        const sql = `
            SELECT p.*, u.first_name as seller_name, u.email as seller_email,
                   (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
            FROM products p
            LEFT JOIN users u ON p.seller_id = u.id
            WHERE p.id = ? AND p.deleted_at IS NULL
        `;
        return await DB.getOne(sql, [id]);
    }

    // Get all images for a product
    static async getImages(productId) {
        const sql = `SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC`;
        return await DB.query(sql, [productId]);
    }

    // Create new product
    static async create(productData) {
        const sql = `
            INSERT INTO products (
                id, seller_id, name, category, subcategory, pet_type,
                description, price, sale_price, currency, stock_quantity,
                sku, brand, weight_kg, dimensions, materials,
                care_instructions, status, featured
            ) VALUES (
                UUID(), ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?
            )
        `;
        const params = [
            productData.seller_id, productData.name, productData.category,
            productData.subcategory || null, productData.pet_type || '[]',
            productData.description || null, productData.price,
            productData.sale_price || null, productData.currency || 'USD',
            productData.stock_quantity || 0, productData.sku,
            productData.brand || null, productData.weight_kg || null,
            productData.dimensions || null, productData.materials || null,
            productData.care_instructions || null, productData.status || 'active',
            productData.featured || 0
        ];
        return await DB.insert(sql, params);
    }

    // Update product
    static async update(id, productData) {
        const fields = [];
        const params = [];
        
        const allowedFields = [
            'name', 'category', 'subcategory', 'pet_type', 'description',
            'price', 'sale_price', 'currency', 'stock_quantity', 'sku',
            'brand', 'weight_kg', 'dimensions', 'materials', 'care_instructions',
            'status', 'featured'
        ];
        
        for (const field of allowedFields) {
            if (productData[field] !== undefined) {
                fields.push(`${field} = ?`);
                params.push(productData[field]);
            }
        }
        
        if (fields.length === 0) return 0;
        
        params.push(id);
        const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
        return await DB.update(sql, params);
    }

    // Delete product (soft delete)
    static async delete(id) {
        const sql = `UPDATE products SET deleted_at = NOW() WHERE id = ?`;
        return await DB.update(sql, [id]);
    }

    // Restore product
    static async restore(id) {
        const sql = `UPDATE products SET deleted_at = NULL WHERE id = ?`;
        return await DB.update(sql, [id]);
    }

    // Get products by seller
    static async findBySeller(sellerId, status = null) {
        let sql = `SELECT * FROM products WHERE seller_id = ? AND deleted_at IS NULL`;
        const params = [sellerId];
        
        if (status) {
            sql += ` AND status = ?`;
            params.push(status);
        }
        
        sql += ` ORDER BY created_at DESC`;
        return await DB.query(sql, params);
    }

    // Update stock quantity
    static async updateStock(id, quantity) {
        const sql = `UPDATE products SET stock_quantity = ? WHERE id = ?`;
        return await DB.update(sql, [quantity, id]);
    }

    // Decrease stock quantity (for purchases)
    static async decreaseStock(id, quantity = 1) {
        const sql = `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?`;
        return await DB.update(sql, [quantity, id, quantity]);
    }

    // Increment view count
    static async incrementViews(id) {
        const sql = `UPDATE products SET view_count = view_count + 1 WHERE id = ?`;
        return await DB.update(sql, [id]);
    }

    // Get featured products
    static async getFeatured(limit = 10) {
        const sql = `
            SELECT p.*,
                   (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
            FROM products p
            WHERE p.deleted_at IS NULL AND p.status = 'active' AND p.featured = 1
            ORDER BY p.created_at DESC
            LIMIT ?
        `;
        return await DB.query(sql, [limit]);
    }

    // Get products by category
    static async findByCategory(category, limit = 20) {
        const sql = `
            SELECT p.*,
                   (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
            FROM products p
            WHERE p.deleted_at IS NULL AND p.status = 'active' AND p.category = ?
            ORDER BY p.created_at DESC
            LIMIT ?
        `;
        return await DB.query(sql, [category, limit]);
    }
}

module.exports = ProductModel;