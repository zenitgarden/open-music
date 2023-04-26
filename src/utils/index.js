/* eslint-disable camelcase */
const fs = require('fs');
const path = require('path');
const ClientError = require('../exception/ClientError');

const onPreResponseErrorHandler = (request, h) => {
  // mendapatkan konteks response dari request
  const { response } = request;
  if (response instanceof Error) {
    // penanganan client error secara internal.
    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }
    // mempertahankan penanganan client error oleh hapi secara native, seperti 404, etc.
    if (!response.isServer) {
      return h.continue;
    }
    // penanganan server error sesuai kebutuhan
    const newResponse = h.response({
      status: 'error',
      message: 'Maaf, terjadi kegagalan pada server kami',
    });
    newResponse.code(500);
    return newResponse;
  }
  // jika bukan error, lanjutkan dengan response sebelumnya (tanpa terintervensi)
  return h.continue;
};

const mapAlbumSongs = (albumSongs) => {
  const {
    album_id: id, name, year, cover: coverUrl,
  } = albumSongs[0];
  const songs = albumSongs.map((data) => ({
    id: data.id,
    title: data.title,
    performer: data.performer,
  }));

  if (songs[0].id === null) {
    return {
      id,
      name,
      year,
      coverUrl,
      songs: [],
    };
  }
  return {
    id,
    name,
    year,
    coverUrl,
    songs,
  };
};

const mapPlaylistSongs = (playlistSongs) => {
  const { playlists_id: id, name, username } = playlistSongs[0];
  const songs = playlistSongs.map((data) => ({
    id: data.id,
    title: data.title,
    performer: data.performer,
  }));

  if (songs[0].id === null) {
    return {
      id,
      name,
      username,
      songs: [],
    };
  }

  return {
    id,
    name,
    username,
    songs,
  };
};

const isFileExist = (oldCover) => {
  if (oldCover !== null && fs.existsSync(path.resolve(
    'src/api/albums/file/images/',
    oldCover.replace('http://localhost:5000/albums/images/', ''),
  ))) {
    fs.unlinkSync(path.resolve('src/api/albums/file/images/', oldCover.replace('http://localhost:5000/albums/images/', '')));
  }
};

module.exports = {
  mapAlbumSongs, onPreResponseErrorHandler, mapPlaylistSongs, isFileExist,
};
