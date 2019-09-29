var express = require('express')
var router = express.Router()
const { tripController } = require('../controllers')

router.get('/trips', tripController.getTrips)
router.get('/trips/:id', tripController.getTripDetail)
router.get('/pictures', tripController.getPictures)
router.get('/pictures/:id', tripController.getPictures)
router.get('/reviews', tripController.getReviews)
router.get('/reviews/:id', tripController.getReviews)
module.exports = router