exports.up = (pgm) => {
  pgm.createTable('playlists_song_activities', {
    id: {
      type: 'varchar(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'varchar(50)',
      notNull: true,
      references: 'playlists',
      onDelete: 'cascade',
    },
    song_id: {
      type: 'varchar(50)',
      notNull: true,
    },
    user_id: {
      type: 'varchar(50)',
      notNull: true,
    },
    action: {
      type: 'varchar(50)',
      notNull: true,
    },
    time: {
      type: 'text',
      notNull: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('playlists_song_activities');
};
