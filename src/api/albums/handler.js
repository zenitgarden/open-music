const { isFileExist } = require('../../utils');

class AlbumsHandler {
  constructor(service, storageService, validator) {
    this._service = service;
    this._storageService = storageService;
    this._validator = validator;
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);

    const { name, year } = request.payload;

    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumSongsByIdHandler(request) {
    const { id } = request.params;

    const album = await this._service.getAlbumSongsByAlbumId(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);

    const { id } = request.params;
    const { name, year } = request.payload;

    await this._service.editAlbumById(id, { name, year });

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;

    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postAlbumCoverHandler(request, h) {
    const { id } = request.params;
    const { cover } = request.payload;
    this._validator.validateAlbumCoverPayload(cover.hapi.headers);

    const oldCover = await this._service.verifyAlbumCover(id);
    const filename = await this._storageService.writeFile(cover, cover.hapi);
    const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/albums/images/${filename}`;
    await this._service.addAlbumCover(id, coverUrl);
    isFileExist(oldCover);

    return h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    }).code(201);
  }

  async postAlbumLikeHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    const like = await this._service.verifyLike(credentialId, albumId);
    if (!like) {
      await this._service.likeAlbum(credentialId, albumId);
      return h.response({
        status: 'success',
        message: 'Like album berhasil',
      }).code(201);
    }
    await this._service.unlikeAlbum(credentialId, albumId);
    return h.response({
      status: 'success',
      message: 'Unlike album berhasil',
    }).code(201);
  }

  async getAlbumLikesHandler(request, h) {
    const { id } = request.params;
    const { likes, isCache } = await this._service.getAlbumLikes(id);

    return h.response({
      status: 'success',
      data: {
        likes,
      },
    }).header('X-Data-Source', isCache ? 'cache' : 'no-cache');
  }
}

module.exports = AlbumsHandler;
