# KoR Server
Knights of Raxxla main API server
This git repository contains the source code of the API server as well as a Docker swarm setup in order to deploy it.

## Set up

You'll need :
- nodejs v9 at least
- a mysql database

Create a file called "env.js" at the root of this folder such as :

```
module.exports = {
    app_url: 'api.raxxlaresearchprogram.com',
    salt: "some salt",
    mysql: {
        host: 'localhost',
        database: 'kor_server',
        user: 'root',
        password: '42'
    },
    smtp: {
        host: "smtp.gmail.com",
        port: 465,
        login: "blabla@gmail.com",
        password: 'blabla',
        auth: ['TLS/SSL']
    }
}
```

Then you need to download nightly dumps from edsm  and put them in ./storage/

```
mkdir storage && cd storage
wget https://www.edsm.net/dump/systemsWithCoordinates.json
wget https://www.edsm.net/dump/systemsPopulated.json
wget https://www.edsm.net/dump/bodies.json
```

Then populate the database

```
knex migrate:latest
knex seed:run
```


 - Create a file env.js (instructions tbd);
 - Change env.salt into something really hard to guess.
 - Download https://eddb.io/archive/v5/systems.csv and put it in ./storage/
 - Run inside main docker container :
 ```bash
 docker ps
 # get container id
 docker exec -it ${container_id} bash
 # now inside main container
 knex migrate:latest
 knex seed:run
 ```

## Queries
Queries are located in app/Queries

Run as such :
```
node app/Queries/DarkWheel/q1.js
```
a csv should have been created at the root of this folder.


