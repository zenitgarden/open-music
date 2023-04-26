const Joi = require('joi');

const PlaylistSchemaPayload = Joi.object({
  name: Joi.string().required(),
});

const PlaylistSongSchemaPayload = Joi.object({
  songId: Joi.string().required(),
});

module.exports = { PlaylistSchemaPayload, PlaylistSongSchemaPayload };
