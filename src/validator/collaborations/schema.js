const Joi = require('joi');

const CollaborationsSchemaPayload = Joi.object({
  playlistId: Joi.string().required(),
  userId: Joi.string().required(),
});

module.exports = CollaborationsSchemaPayload;
