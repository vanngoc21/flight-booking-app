const express = require('express');
const { getPublicPromotions } = require('../controllers/promotionController');

const router = express.Router();

router.get('/', getPublicPromotions);

module.exports = router;
