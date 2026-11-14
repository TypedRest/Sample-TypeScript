import { render } from "solid-js/web";
import { AddressBookClient } from "@address-book/client";
import { App } from "./App.tsx";

// The page is served from the same origin as the API
const client = new AddressBookClient(new URL("/", location.href));

render(() => <App client={client} />, document.body);
