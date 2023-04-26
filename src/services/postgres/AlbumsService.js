const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exception/InvariantError');
const NotFoundError = require('../../exception/NotFoundError');
const { mapAlbumSongs } = require('../../utils');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const { rows } = await this._pool.query(query);
    if (!rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return rows[0].id;
  }

  async getAlbumSongsByAlbumId(id) {
    const query = {
      text: `SELECT albums.id as album_id, albums.name, albums.year, albums.cover, songs.id, songs.title, songs.performer 
      FROM albums LEFT JOIN songs ON albums.id = songs."albumId"
      WHERE albums.id = $1`,
      values: [id],
    };
    const { rows, rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }
    return mapAlbumSongs(rows);
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const { rowCount } = await this._pool.query(query);
    if (!rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const { rowCount } = await this._pool.query(query);
    if (!rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async addAlbumCover(id, coverUrl) {
    const query = {
      text: 'UPDATE albums SET cover = $2 WHERE id = $1 RETURNING cover',
      values: [id, coverUrl],
    };
    const { rows } = await this._pool.query(query);
    if (!rows[0].cover) {
      throw new InvariantError('Cover pada album gagal ditambahkan');
    }
  }

  async verifyAlbumCover(id) {
    const query = {
      text: 'SELECT cover FROM albums WHERE id = $1',
      values: [id],
    };
    const { rows } = await this._pool.query(query);

    return rows[0].cover;
  }

  async likeAlbum(userId, albumId) {
    const id = `like-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };
    const { rows } = await this._pool.query(query);
    await this._cacheService.delete(`likes:${albumId}`);

    if (!rows[0].id) {
      throw new InvariantError('Like album gagal');
    }
  }

  async unlikeAlbum(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, albumId],
    };
    const { rows } = await this._pool.query(query);
    await this._cacheService.delete(`likes:${albumId}`);

    if (!rows[0].id) {
      throw new InvariantError('Unlike album gagal');
    }
  }

  async verifyLike(userId, albumId) {
    await this.verifyAlbum(albumId);
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };
    const { rowCount } = await this._pool.query(query);

    return rowCount;
  }

  async getAlbumLikes(id) {
    await this.verifyAlbum(id);
    try {
      const result = await this._cacheService.get(`likes:${id}`);
      return {
        likes: JSON.parse(result),
        isCache: true,
      };
    } catch {
      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [id],
      };
      const { rowCount } = await this._pool.query(query);
      await this._cacheService.set(`likes:${id}`, JSON.stringify(rowCount));

      return {
        likes: rowCount,
        isCache: false,
      };
    }
  }

  async verifyAlbum(id) {
    const query = {
      text: 'SELECT id FROM albums WHERE id = $1',
      values: [id],
    };
    const { rowCount } = await this._pool.query(query);
    if (!rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }
  }
}

module.exports = AlbumsService;
