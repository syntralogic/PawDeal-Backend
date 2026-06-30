const DB = require('./db');

class PetModel {
    // Get all pets with filters and pagination
    static async findAll(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        let sql = `
            SELECT p.*, u.first_name as seller_name, b.name as breed_name,
                   (SELECT image_url FROM pet_images WHERE pet_id = p.id AND is_primary = 1 LIMIT 1) as primary_image      
            FROM pets p
            LEFT JOIN users u ON p.seller_id = u.id
            LEFT JOIN breeds b ON p.breed_id = b.id
            WHERE 1=1
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
            sql += ` AND p.status = 'available'`;
        }
        if (filters.breed_id) {
            sql += ` AND p.breed_id = ?`;
            params.push(parseInt(filters.breed_id));
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
        
        // Add sorting and pagination - convert to integers
        sql += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));
        
        return await DB.query(sql, params);
    }

    // Count total pets with filters
    static async count(filters = {}) {
        let sql = `SELECT COUNT(*) as total FROM pets p WHERE 1=1`;
        const params = [];
        
        if (filters.category) {
            sql += ` AND p.category = ?`;
            params.push(filters.category);
        }
        if (filters.status) {
            sql += ` AND p.status = ?`;
            params.push(filters.status);
        } else {
            sql += ` AND p.status = 'available'`;
        }
        if (filters.breed_id) {
            sql += ` AND p.breed_id = ?`;
            params.push(parseInt(filters.breed_id));
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
        
        const result = await DB.query(sql, params);
        return result[0].total;
    }

    // Get single pet by ID
    static async findById(id) {
        const sql = `
            SELECT p.*, u.first_name as seller_name, u.email as seller_email,
                   b.name as breed_name,
                   (SELECT image_url FROM pet_images WHERE pet_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
            FROM pets p
            LEFT JOIN users u ON p.seller_id = u.id
            LEFT JOIN breeds b ON p.breed_id = b.id
            WHERE p.id = ?
        `;
        return await DB.getOne(sql, [id]);
    }

    // Get all images for a pet
    static async getImages(petId) {
        const sql = `SELECT * FROM pet_images WHERE pet_id = ? ORDER BY sort_order ASC`;
        return await DB.query(sql, [petId]);
    }

    // Create new pet
    static async create(petData) {
        const sql = `
            INSERT INTO pets (
                id, seller_id, name, breed_id, category, age_years, age_months,
                gender, price, currency, description, health_status,
                vaccinated, dewormed, neutered, microchipped, registration_papers,
                color, weight_kg, city, state, country, status, featured
            ) VALUES (
                UUID(), ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?
            )
        `;
        const params = [
            petData.seller_id, petData.name, petData.breed_id || null, petData.category,
            petData.age_years || 0, petData.age_months || 0, petData.gender,
            petData.price, petData.currency || 'USD', petData.description || null,
            petData.health_status || null, petData.vaccinated || 0, petData.dewormed || 0,
            petData.neutered || 0, petData.microchipped || 0, petData.registration_papers || 0,
            petData.color || null, petData.weight_kg || null, petData.city || null,
            petData.state || null, petData.country || null, petData.status || 'available',
            petData.featured || 0
        ];
        return await DB.insert(sql, params);
    }

    // Update pet
    static async update(id, petData) {
        const fields = [];
        const params = [];
        
        const allowedFields = [
            'name', 'breed_id', 'category', 'age_years', 'age_months', 'gender',
            'price', 'currency', 'description', 'health_status', 'vaccinated',
            'dewormed', 'neutered', 'microchipped', 'registration_papers',
            'color', 'weight_kg', 'city', 'state', 'country', 'status', 'featured'
        ];
        
        for (const field of allowedFields) {
            if (petData[field] !== undefined) {
                fields.push(`${field} = ?`);
                params.push(petData[field]);
            }
        }
        
        if (fields.length === 0) return 0;
        
        params.push(id);
        const sql = `UPDATE pets SET ${fields.join(', ')} WHERE id = ?`;
        return await DB.update(sql, params);
    }

    // Delete pet (soft delete)
    static async delete(id) {
        const sql = `UPDATE pets SET deleted_at = NOW() WHERE id = ?`;
        return await DB.update(sql, [id]);
    }

    // Restore pet
    static async restore(id) {
        const sql = `UPDATE pets SET deleted_at = NULL WHERE id = ?`;
        return await DB.update(sql, [id]);
    }

    // Get pets by seller
    static async findBySeller(sellerId, status = null) {
        let sql = `SELECT * FROM pets WHERE seller_id = ?`;
        const params = [sellerId];
        
        if (status) {
            sql += ` AND status = ?`;
            params.push(status);
        }
        
        sql += ` ORDER BY created_at DESC`;
        return await DB.query(sql, params);
    }

    // Update pet status
    static async updateStatus(id, status) {
        const sql = `UPDATE pets SET status = ? WHERE id = ?`;
        return await DB.update(sql, [status, id]);
    }

    // Increment view count
    static async incrementViews(id) {
        const sql = `UPDATE pets SET view_count = view_count + 1 WHERE id = ?`;
        return await DB.update(sql, [id]);
    }

    // Increment favorite count
    static async incrementFavorites(id) {
        const sql = `UPDATE pets SET favorite_count = favorite_count + 1 WHERE id = ?`;
        return await DB.update(sql, [id]);
    }

    // Decrement favorite count
    static async decrementFavorites(id) {
        const sql = `UPDATE pets SET favorite_count = favorite_count - 1 WHERE id = ?`;
        return await DB.update(sql, [id]);
    }
}

module.exports = PetModel;