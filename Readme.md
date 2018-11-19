# KoR Server
Knights of Raxxla main API server
This git repository contains the source code of the API server as well as a Docker swarm setup in order to deploy it.

## Env file
You will need to create a file called env.json at the root of this project, containing:

```json
{
    "app_url": "https://yourapp.com",
    mysql: {
        "database": "db_name",
        "host": "127.0.0.1"
    }
}
```


