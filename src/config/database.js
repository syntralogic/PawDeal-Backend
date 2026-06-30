const mysql = require('mysql2');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Read the CA certificate
const caCert = fs.readFileSync(path.join(__dirname, '../ca.pem'), 'utf8');

// Create connection pool for Aiven MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pawdeal',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: {
        ca: caCert,
        rejectUnauthorized: true
    }
});

const promisePool = pool.promise();

const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ MySQL database connected successfully!');
        console.log(`   Database: ${process.env.DB_NAME}`);
        console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        console.log(`   SSL: Enabled (with CA certificate)`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        return false;
    }
};

const query = async (sql, params) => {
    try {
        const [results] = await promisePool.query(sql, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
};

const getOne = async (sql, params) => {
    const results = await query(sql, params);
    return results.length > 0 ? results[0] : null;
};

const insert = async (sql, params) => {
    const [result] = await promisePool.query(sql, params);
    return result;
};

const beginTransaction = async () => {
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();
    return connection;
};

const commit = async (connection) => {
    await connection.commit();
    connection.release();
};

const rollback = async (connection) => {
    await connection.rollback();
    connection.release();
};

module.exports = {
    pool: promisePool,
    query,
    getOne,
    insert,
    beginTransaction,
    commit,
    rollback,
    testConnection
};