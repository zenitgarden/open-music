const Joi = require('joi');
const currentYear = new Date().getFullYear();

const AlbumPayloadScheme = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(currentYear),
});

const AlbumCoverPayloadSchema = Joi.object({
  'content-type': Joi.string().valid('image/apng', 'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp').required(),
}).unknown();

module.exports = { AlbumPayloadScheme, AlbumCoverPayloadSchema };
