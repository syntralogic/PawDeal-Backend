const PetModel = require('../models/petModel');

// Get all pets with pagination and filters
const getPets = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            category, 
            breed_id, 
            status,
            minPrice, 
            maxPrice, 
            search 
        } = req.query;
        
        const filters = { 
            category, 
            breed_id, 
            status,
            minPrice, 
            maxPrice, 
            search 
        };
        
        // Remove undefined filters
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined || filters[key] === '') {
                delete filters[key];
            }
        });
        
        const pets = await PetModel.findAll(filters, parseInt(page), parseInt(limit));
        const total = await PetModel.count(filters);
        
        res.json({
            success: true,
            data: pets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get pets error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get single pet by ID
const getPetById = async (req, res) => {
    try {
        const { id } = req.params;
        const pet = await PetModel.findById(id);
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Pet not found'
            });
        }
        
        // Increment view count
        await PetModel.incrementViews(id);
        
        // Get pet images
        const images = await PetModel.getImages(id);
        pet.images = images;
        
        res.json({
            success: true,
            data: pet
        });
    } catch (error) {
        console.error('Get pet by ID error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Create a new pet
const createPet = async (req, res) => {
    try {
        const petData = req.body;
        petData.seller_id = req.user.id; // Assuming you have authentication middleware
        
        const petId = await PetModel.create(petData);
        const pet = await PetModel.findById(petId);
        
        res.status(201).json({
            success: true,
            data: pet
        });
    } catch (error) {
        console.error('Create pet error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update a pet
const updatePet = async (req, res) => {
    try {
        const { id } = req.params;
        const petData = req.body;
        
        const pet = await PetModel.findById(id);
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Pet not found'
            });
        }
        
        // Check if user owns this pet (optional)
        if (pet.seller_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'You are not authorized to update this pet'
            });
        }
        
        await PetModel.update(id, petData);
        const updatedPet = await PetModel.findById(id);
        
        res.json({
            success: true,
            data: updatedPet
        });
    } catch (error) {
        console.error('Update pet error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete a pet (soft delete)
const deletePet = async (req, res) => {
    try {
        const { id } = req.params;
        
        const pet = await PetModel.findById(id);
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Pet not found'
            });
        }
        
        // Check if user owns this pet (optional)
        if (pet.seller_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'You are not authorized to delete this pet'
            });
        }
        
        await PetModel.delete(id);
        
        res.json({
            success: true,
            message: 'Pet deleted successfully'
        });
    } catch (error) {
        console.error('Delete pet error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get pets by seller
const getPetsBySeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { status } = req.query;
        
        const pets = await PetModel.findBySeller(sellerId, status);
        
        res.json({
            success: true,
            data: pets
        });
    } catch (error) {
        console.error('Get pets by seller error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update pet status
const updatePetStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const pet = await PetModel.findById(id);
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Pet not found'
            });
        }
        
        await PetModel.updateStatus(id, status);
        const updatedPet = await PetModel.findById(id);
        
        res.json({
            success: true,
            data: updatedPet
        });
    } catch (error) {
        console.error('Update pet status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getPets,
    getPetById,
    createPet,
    updatePet,
    deletePet,
    getPetsBySeller,
    updatePetStatus
};