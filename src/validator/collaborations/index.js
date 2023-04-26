const InvariantError = require('../../exception/InvariantError');
const CollaborationsSchemaPayload = require('./schema');

const CollaborationsValidator = {
  validateCollaborationsSchema: (payload) => {
    const validationResult = CollaborationsSchemaPayload.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = CollaborationsValidator;
