exports.up = (pgm) => {
  pgm.createTable('playlists', {
    id: {
      type: 'varchar(50)',
      primaryKey: true,
    },
    name: {
      type: 'text',
      notNull: true,
    },
    owner: {
      type: 'varchar(50)',
      notNull: true,
    },
  });
  pgm.addConstraint('playlists', 'fk_playlists.owner_users.id', 'FOREIGN KEY(owner) REFERENCES users ON DELETE CASCADE');
};

exports.down = (pgm) => {
  pgm.dropTable('playlists');
};
