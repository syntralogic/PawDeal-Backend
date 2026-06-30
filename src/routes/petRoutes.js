const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/', petController.getPets);
router.get('/:id', petController.getPetById);
router.get('/seller/:sellerId', petController.getPetsBySeller);

// Protected routes (require authentication)
router.post('/', authenticate, petController.createPet);
router.put('/:id', authenticate, petController.updatePet);
router.delete('/:id', authenticate, petController.deletePet);
router.put('/:id/status', authenticate, petController.updatePetStatus);

module.exports = router;