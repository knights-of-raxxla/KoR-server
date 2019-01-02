
exports.seed = function(_knex, Promise) {
    return Promise.all([]);
    knex = _knex;
  // Deletes ALL existing entries
  return knex('bodies').del()
    .then(function () {
        console.log('==== Seed des bodies de EDSM ====');
        return reader.readFileLinesByChunk(bodie_json_edsm
            , 5000, insertSystemsChunk);
    });
};
