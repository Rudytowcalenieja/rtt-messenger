# rtt-messenger

## Run with Docker

Requirements: Docker Desktop with Docker Compose.

From the repository root, start the Angular frontend, API, and PostgreSQL:

```sh
docker compose up --build
```

Open the app at <http://localhost:4200>. The frontend proxies API and icon
requests to the API container; the API and database are not exposed directly
to the host.

The first database startup creates the `users` table from `api/init.sql`.
PostgreSQL data and uploaded profile icons are kept in named Docker volumes
when containers are stopped or rebuilt.

To stop the services, press Ctrl+C and run:

```sh
docker compose down
```

To remove the database and uploaded icons as well, run
`docker compose down --volumes`. This permanently deletes that stored data.

The default database password in Compose is for local development only. Set
`POSTGRES_PASSWORD` in a root `.env` file before using this setup in a shared
or deployed environment. The initialization SQL runs only when PostgreSQL
creates a new, empty data volume.

If port 4200 is already in use, copy `.env.example` to `.env`, set
`WEB_PORT` to an available port, and set `CORS_ORIGIN` to the matching origin
(for example, `WEB_PORT=4201` and `CORS_ORIGIN=http://localhost:4201`).

For local development without Docker, run the API on port 3000 and start the
Angular dev server with `npm start`; its proxy forwards `/api` and `/icons`
requests to the local API.