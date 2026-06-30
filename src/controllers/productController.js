const ProductModel = require('../models/productModel');

// Get all products with pagination and filters
const getProducts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            category, 
            status,
            minPrice, 
            maxPrice, 
            search,
            brand
        } = req.query;
        
        const filters = { 
            category, 
            status,
            minPrice, 
            maxPrice, 
            search,
            brand
        };
        
        // Remove undefined filters
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined || filters[key] === '') {
                delete filters[key];
            }
        });
        
        const products = await ProductModel.findAll(filters, parseInt(page), parseInt(limit));
        const total = await ProductModel.count(filters);
        
        res.json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get single product by ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        // Increment view count
        await ProductModel.incrementViews(id);
        
        // Get product images
        const images = await ProductModel.getImages(id);
        product.images = images;
        
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Get product by ID error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Create a new product
const createProduct = async (req, res) => {
    try {
        const productData = req.body;
        productData.seller_id = req.user.id; // Assuming you have authentication middleware
        
        const productId = await ProductModel.create(productData);
        const product = await ProductModel.findById(productId);
        
        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update a product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productData = req.body;
        
        const product = await ProductModel.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        // Check if user owns this product (optional)
        if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'You are not authorized to update this product'
            });
        }
        
        await ProductModel.update(id, productData);
        const updatedProduct = await ProductModel.findById(id);
        
        res.json({
            success: true,
            data: updatedProduct
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete a product (soft delete)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await ProductModel.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        // Check if user owns this product (optional)
        if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'You are not authorized to delete this product'
            });
        }
        
        await ProductModel.delete(id);
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get products by seller
const getProductsBySeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { status } = req.query;
        
        const products = await ProductModel.findBySeller(sellerId, status);
        
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get products by seller error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update product stock
const updateProductStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        
        const product = await ProductModel.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        await ProductModel.updateStock(id, quantity);
        const updatedProduct = await ProductModel.findById(id);
        
        res.json({
            success: true,
            data: updatedProduct
        });
    } catch (error) {
        console.error('Update product stock error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get featured products
const getFeaturedProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const products = await ProductModel.getFeatured(parseInt(limit));
        
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 20 } = req.query;
        
        const products = await ProductModel.findByCategory(category, parseInt(limit));
        
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get products by category error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsBySeller,
    updateProductStock,
    getFeaturedProducts,
    getProductsByCategory
};