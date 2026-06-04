const router = require('express').Router();
const ctrl   = require('../controllers/master.controller');
const { authenticate } = require('../middleware/auth');

// PIC Categories
router.get('/pic-categories',      authenticate, ctrl.listPicCategories);
router.post('/pic-categories',     authenticate, ctrl.createPicCategory);
router.put('/pic-categories/:id',  authenticate, ctrl.updatePicCategory);
router.delete('/pic-categories/:id', authenticate, ctrl.deletePicCategory);

// Item Types
router.get('/item-types',      authenticate, ctrl.listItemTypes);
router.post('/item-types',     authenticate, ctrl.createItemType);
router.put('/item-types/:id',  authenticate, ctrl.updateItemType);
router.delete('/item-types/:id', authenticate, ctrl.deleteItemType);

// Ports
router.get('/ports',      authenticate, ctrl.listPorts);
router.post('/ports',     authenticate, ctrl.createPort);
router.put('/ports/:id',  authenticate, ctrl.updatePort);
router.delete('/ports/:id', authenticate, ctrl.deletePort);

// UOMs
router.get('/uoms',      authenticate, ctrl.listUoms);
router.post('/uoms',     authenticate, ctrl.createUom);
router.put('/uoms/:id',  authenticate, ctrl.updateUom);
router.delete('/uoms/:id', authenticate, ctrl.deleteUom);

// Brands
router.get('/brands',      authenticate, ctrl.listBrands);
router.post('/brands',     authenticate, ctrl.createBrand);
router.put('/brands/:id',  authenticate, ctrl.updateBrand);
router.delete('/brands/:id', authenticate, ctrl.deleteBrand);

// PICs
router.get('/pics',      authenticate, ctrl.listPics);
router.post('/pics',     authenticate, ctrl.createPic);
router.put('/pics/:id',  authenticate, ctrl.updatePic);
router.delete('/pics/:id', authenticate, ctrl.deletePic);

module.exports = router;
