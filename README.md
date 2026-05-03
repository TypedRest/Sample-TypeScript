# TypedRest Address Book Sample

This is a sample project for using [TypedRest for TypeScript](https://github.com/TypedRest/TypedRest-TypeScript). It provides a simple REST API for storing contacts in an address book and uses SQLite for persistence.

The code is split across npm workspaces:

- [server/](server/): a [Fastify](https://fastify.dev/) service backed by [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [client/](client/): a TypedRest client library
- [dto/](dto/): DTOs shared by the client and the server
- [tests/](tests/): tests that ensure the client and server work together

## Usage

```bash
npm install
npm run build
npm run test
npm run start    # starts the service on http://localhost:5000
```
