const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exception/InvariantError');
const NotFoundError = require('../../exception/NotFoundError');
const AuthorizationError = require('../../exception/AuthorizationError');
const { mapPlaylistSongs } = require('../../utils');

class PlaylistsService {
  constructor(songsService, collaborationService) {
    this._pool = new Pool();
    this._songsService = songsService;
    this._collaborationService = collaborationService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const { rows, rowCount } = await this._pool.query(query);
    if (!rowCount) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }
    return rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username 
      FROM playlists LEFT JOIN users ON playlists.owner = users.id 
      LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
      WHERE playlists.owner = $1 OR collaborations.user_id = $1`,
      values: [owner],
    };
    const { rows } = await this._pool.query(query);
    return rows;
  }

  async deletePlaylist(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const { rowCount } = await this._pool.query(query);
    if (!rowCount) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async addSongToPlaylist({ playlistId, songId }) {
    await this._songsService.verifyValidSong(songId);
    const id = `p-s-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const { rows } = await this._pool.query(query);
    if (!rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan ke dalam playlist.');
    }
  }

  async getSongsOnPlaylist(playlistId) {
    const query = {
      text: `SELECT playlists.id as playlists_id, playlists.name, 
      users.username, songs.id, songs.title, songs.performer 
      FROM playlist_songs 
      RIGHT JOIN songs ON playlist_songs.song_id = songs.id
      RIGHT JOIN playlists ON playlists.id = playlist_songs.playlist_id
      RIGHT JOIN users ON users.id = playlists.owner
      WHERE playlist_songs.playlist_id = $1`,
      values: [playlistId],
    };
    const { rows } = await this._pool.query(query);
    return mapPlaylistSongs(rows);
  }

  async deleteSongOnPlaylist({ playlistId, songId }) {
    await this._songsService.verifyValidSong(songId);
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      values: [playlistId, songId],
    };

    const { rowCount } = await this._pool.query(query);
    if (!rowCount) {
      throw new InvariantError('Lagu gagal dihapus dari playlist');
    }
  }

  async addActivity({
    playlistId, songId, userId, action,
  }) {
    const id = `p-s-activities-${nanoid(16)}`;
    const time = new Date().toISOString();
    const query = {
      text: 'INSERT INTO playlists_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, userId, action, time],
    };
    const { rows } = await this._pool.query(query);
    if (!rows[0].id) {
      throw new InvariantError('Activities gagal ditambahkan.');
    }
  }

  async getPlaylistActivities(playlistId) {
    const query = {
      text: `SELECT users.username, songs.title, playlists_song_activities.action,
      playlists_song_activities.time
      FROM playlists_song_activities
      LEFT JOIN users ON users.id = playlists_song_activities.user_id
      LEFT JOIN songs ON songs.id = playlists_song_activities.song_id
      WHERE playlists_song_activities.playlist_id = $1`,
      values: [playlistId],
    };

    const { rows, rowCount } = await this._pool.query(query);
    if (!rowCount) {
      throw new NotFoundError('Aktivitas tidak ditemukan');
    }
    return rows;
  }

  async verifyPlaylistOwner(playlistId, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistId],
    };
    const { rows, rowCount } = await this._pool.query(query);
    if (!rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    const playlist = rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
