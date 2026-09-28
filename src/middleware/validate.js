const Joi = require('joi');


const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
  }
  req[source] = value;
  next();
};

const STATUSES = ['pending', 'in_progress', 'done'];

const schemas = {
  id: Joi.object({ id: Joi.number().integer().positive().required() }),

  create: Joi.object({
    title: Joi.string().trim().min(1).max(120).required(),
    description: Joi.string().allow('').max(2000).default(''),
    status: Joi.string().valid(...STATUSES).default('pending'),
    priority: Joi.number().integer().min(1).max(3).default(2),
    due_date: Joi.date().iso().allow(null),
  }),

  update: Joi.object({
    title: Joi.string().trim().min(1).max(120),
    description: Joi.string().allow('').max(2000),
    status: Joi.string().valid(...STATUSES),
    priority: Joi.number().integer().min(1).max(3),
    due_date: Joi.date().iso().allow(null),
  }).min(1),

  list: Joi.object({
    status: Joi.string().valid(...STATUSES),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};

module.exports = { validate, schemas };
