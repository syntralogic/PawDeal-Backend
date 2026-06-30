// Use this if config is at the root level (outside src)
const { pool } = require('../config/database');

class DB {
    // Execute query with parameters
    static async query(sql, params = []) {
        try {
            // Ensure params is always an array
            if (!Array.isArray(params)) {
                params = [params];
            }
            const [results] = await pool.query(sql, params);
            return results;
        } catch (error) {
            console.error('Database query error:', error.message);
            console.error('SQL:', sql);
            console.error('Params:', params);
            throw error;
        }
    }

    // Get single row
    static async getOne(sql, params = []) {
        const results = await this.query(sql, params);
        return results[0] || null;
    }

    // Insert and return insert ID
    static async insert(sql, params = []) {
        if (!Array.isArray(params)) {
            params = [params];
        }
        const [result] = await pool.query(sql, params);
        return result.insertId;
    }

    // Update and return affected rows
    static async update(sql, params = []) {
        if (!Array.isArray(params)) {
            params = [params];
        }
        const [result] = await pool.query(sql, params);
        return result.affectedRows;
    }

    // Delete and return affected rows
    static async delete(sql, params = []) {
        if (!Array.isArray(params)) {
            params = [params];
        }
        const [result] = await pool.query(sql, params);
        return result.affectedRows;
    }

    // Check if record exists
    static async exists(sql, params = []) {
        const results = await this.query(sql, params);
        return results.length > 0;
    }

    // Begin transaction
    static async beginTransaction() {
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        return connection;
    }

    // Commit transaction
    static async commit(connection) {
        await connection.commit();
        connection.release();
    }

    // Rollback transaction
    static async rollback(connection) {
        await connection.rollback();
        connection.release();
    }

    // Execute in transaction
    static async transaction(callback) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = DB;