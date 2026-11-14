# TypedRest Address Book Sample

This is a sample project for using [TypedRest for TypeScript](https://github.com/TypedRest/TypedRest-TypeScript). It provides a simple REST API for storing contacts in an address book and uses SQLite for persistence.

The code is split across npm workspaces:

- [service/](service/): an [Express](https://expressjs.com/) service
- [client/](client/): a TypedRest client library
- [dto/](dto/): DTOs shared by the client and the service
- [web/](web/): a web page that uses the client in the browser, built with [Vite](https://vite.dev/)

## Building

Requires Node.js 26 or later. Install the dependencies, type-check everything and build the web page with:

```sh
npm install
npm run build
```

Run the tests, which check the requests the client sends against a mocked `fetch()` and ensure the client and the service work together:

```sh
npm test
```

Run the service:

```sh
npm start
```

The web page is then available at <http://localhost:3000/>. Set the `PORT` environment variable to use a different port and `DATABASE` to change the path of the SQLite file (default: `AddressBook.db`).

To work on the web page with hot reloading, keep the service running and start the Vite dev server in a second terminal. It forwards API requests to the service:

```sh
npm run dev -w web
```

## OpenAPI

The [API Spec](service/openapi.yaml) is hand-written and served at `/openapi.yaml`.

## No build step for the service

Node.js runs the service's TypeScript files directly by [stripping the types](https://nodejs.org/api/typescript.html).
