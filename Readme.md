# KoR Server
Knights of Raxxla main API server
This git repository contains the source code of the API server as well as a Docker swarm setup in order to deploy it.

## Set up
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

## Env file (tbd)
You will need to create a file called env.json at the root of this project, containing:

```javascript
module.exports = {
    "app_url": "https://yourapp.com",
    mysql: {
        "database": "db_name",
        "host": "127.0.0.1"
    }
}
```

## Roadmap (API)

**1.0** :
- [x] Set up mysql tables and auth functionalities
- [ ] Write seed to populate db with systems
- [ ] Enable the creation of expeditions, pin systems to expeditions and download every system data
- [ ] Update expeditions status (visitables)
- [ ] Request status of all expeditions
- [ ] Request expedition feed


## API

### Sign (in)

- Authenticate on endpoint /api/v1/login (get with query string parameters 'password' and 'email'), the response will be in JSON : {token: 'your_auth_token'}
- Pass this token to any subsequent request as a cookie : `kor=your_token`
 exemple in curl :
 ```
 curl -XGET -H "Content-type: application/json" 'api.knightsofraxxla.com/api/v1/login?email=toto@yopmail.com&password=pass'
 ```


### Endpoints (tbd)



