# Curated Corpus API

??? Need a good, short description

## Application Overview

This app is a GraphQL API written in TypeScript. To serve the API, the following packages are used:
- [Express](https://expressjs.com/) and [Apollo Server](https://www.apollographql.com/docs/apollo-server/),
- [Prisma](https://www.prisma.io/) as an ORM to a MySQL relational database,
- [prisma-relay-cursor-connection](https://github.com/devoxa/prisma-relay-cursor-connection) for Relay-style pagination,
- S3 for image storage,
- [Jest](https://jestjs.io/) and [Chai](https://www.chaijs.com/) for integration and unit testing.


### GraphQL Schemas

This application has two GraphQL schemas - one public for clients (Web, Android, iOS) and one private for the [admin tools](https://github.com/Pocket/curation-admin-tools). As these schemas share data, we have created three schema files:

- `./schema-shared.graphql`
- `./schema-public.graphql`
- `./schema-admin.graphql`

`schema-shared.graphql` is stitched onto the other schemas in `src/typeDefs.ts`.

Having two schemas means we need two GraphQL endpoints, meaning two Apollo Servers. These servers are located in `src/admin/server.ts` and `src/public/server.ts`. In `src/main.ts`, we add both Apollo Servers to Express.

### Pagination

This API implements [Relay-style pagination](https://relay.dev/graphql/connections.htm) with the assistance of the [prisma-relay-cursor-connection](https://github.com/devoxa/prisma-relay-cursor-connection) package. 

It is important that the `PageInfo` type and the `PaginationInput` in the shared GraphQL schema do not deviate from implementations in our other federated APIs. In other words, please leave them exactly as they were initially implemented (this includes accompanying comments) to avoid schema composition errors.

As specified in the `prisma-relay-cursor-connection` documentation, the following combinations of `PaginationInput` variables are supported:

- `{}` All resources (no pagination variables specified in the query at all)
- `{ first: number }` The first X resources
- `{ first: number, after: string }` The first X resources after the cursor Y
- `{ last: number }` The last X resources
- `{ last: number, before: string }` The last X resources before the cursor Y

GraphQL will throw an error if an unsupported combination of variables is used in the paginated query.

## Local Development

### Initial Setup

Check out the code and install required packages:

```bash
git clone git@github.com:Pocket/curated-corpus-api.git
cd curated-corpus-api
```

Generate the Prisma types (they will live in your `node_modules` folder):

```bash
npx prisma generate
```

Start Docker:

```bash
docker compose up
```

Once all the Docker containers are up and running, you should be able to reach
- the public API at `http://localhost:4025/`
- the admin API at `http://localhost:4025/admin`

Out of the box, the local installation doesn't have any actual data for you to fetch or manipulate through the API. To seed some sample data for your local dev environment, run

```bash
docker compose exec app npx prisma migrate reset
```

Note that the above command will not be adding to any data you may have added to the database through other means - it will do a complete reset AND apply the seed script located at `src/prisma/seed.ts`.

## Testing

So far we only have integration tests in this repository, and these wipe the database on each run, which means it's ~really tricky~ impossible as yet to have them running in the background in watch mode while you code.

The command to run integration tests is

```bash
docker compose exec app npm run test-integrations
```

## Deploying to Dev

The Dev checkout is available at [https://curated-corpus-api.getpocket.dev/](https://curated-corpus-api.getpocket.dev/).

To deploy the latest changes merged to main to Dev, run the following command in your terminal:

```bash
git push -f origin main:dev
```

To push changes from a particular branch to Dev, use the name of the branch instead of main:

```bash
git push -f origin your-branch-name:dev
```
