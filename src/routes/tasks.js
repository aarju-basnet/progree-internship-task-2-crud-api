const router = require('express').Router();
const c = require('../controllers/tasks');
const { validate, schemas } = require('../middleware/validate');
const { requireApiKey } = require('../middleware/auth');

// Public reads
router.get('/', validate(schemas.list, 'query'), c.list);
router.get('/:id', validate(schemas.id, 'params'), c.getOne);

// Protected mutations: API key first, then validation, then controller
router.post('/', requireApiKey, validate(schemas.create), c.create);
router.put('/:id', requireApiKey, validate(schemas.id, 'params'), validate(schemas.update), c.update);
router.patch('/:id', requireApiKey, validate(schemas.id, 'params'), validate(schemas.update), c.update);
router.delete('/:id', requireApiKey, validate(schemas.id, 'params'), c.remove);

module.exports = router;
