---
layout: posts.njk
title: Attaching Entra ID tokens to Axios requests in React
tags: programming,react,azure,authentication
draft: false
date: 2026-03-06
description: "How to use @azure/msal-browser and an Axios interceptor to attach Entra ID Bearer tokens to every API request."
---

# Attaching Entra ID tokens to Axios requests in React

When building a React app that authenticates via Microsoft Entra ID (formerly Azure AD) and needs to call a protected .NET API, you'll need to attach a Bearer token to every outgoing request. Rather than doing this manually in each API call, you can use an Axios interceptor to handle it in one place using `@azure/msal-browser`.

You'll need `@azure/msal-browser` and `axios` installed, and an Entra ID app registration with a client ID and an API scope exposed (e.g. `api://<your-client-id>/access_as_user`).

## Initialising MSAL

First, create a file to configure and export a `PublicClientApplication` instance:

```js
// src/msalInstance.js
import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: "<your-client-id>",
    authority: "https://login.microsoftonline.com/<your-tenant-id>",
    redirectUri: window.location.origin,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
```

Then call `initialize()` in your app entry point before rendering — MSAL needs to process any redirect responses before you start making token requests, so it's worth wrapping your render in an async init function:

```js
// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { msalInstance } from "./msalInstance";

async function init() {
  await msalInstance.initialize();

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

init();
```

## The Axios interceptor

With MSAL set up, you can add a request interceptor that silently acquires a token and attaches it as a `Bearer` header before every request:

```js
// src/apiClient.js
import axios from "axios";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { msalInstance } from "./msalInstance";

const apiClient = axios.create({
  baseURL: "https://your-api.example.com",
});

const apiScopes = ["api://<your-client-id>/access_as_user"];

apiClient.interceptors.request.use(async (config) => {
  const account = msalInstance.getActiveAccount();

  // getActiveAccount() returns null if no account is set. Passing null to
  // acquireTokenSilent throws a generic error, not InteractionRequiredAuthError,
  // so we catch it here and go straight to the popup flow instead.
  if (!account) {
    const tokenResponse = await msalInstance.acquireTokenPopup({
      scopes: apiScopes,
    });
    config.headers.Authorization = `Bearer ${tokenResponse.accessToken}`;
    return config;
  }

  try {
    const tokenResponse = await msalInstance.acquireTokenSilent({
      scopes: apiScopes,
      account,
    });

    config.headers.Authorization = `Bearer ${tokenResponse.accessToken}`;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Silent acquisition failed (e.g. consent needed, session expired)
      const tokenResponse = await msalInstance.acquireTokenPopup({
        scopes: apiScopes,
      });

      config.headers.Authorization = `Bearer ${tokenResponse.accessToken}`;
    } else {
      throw error;
    }
  }

  return config;
});

export default apiClient;
```

`acquireTokenSilent` returns a cached or silently refreshed token without any user interaction, only making a network call when necessary. When it isn't possible — for example when the user needs to consent to a new scope or their session has expired — it throws `InteractionRequiredAuthError`, at which point you fall back to `acquireTokenPopup`.

## Things to watch out for

**Set the active account before calling `acquireTokenSilent`**

If no active account is set, `acquireTokenSilent` will throw. After your app loads, set the active account from the list of cached accounts:

```js
await msalInstance.initialize();
await msalInstance.handleRedirectPromise();

const accounts = msalInstance.getAllAccounts();
if (accounts.length > 0) {
  msalInstance.setActiveAccount(accounts[0]);
}
```

It's worth doing this before rendering any components that might trigger API calls.

**Use the full scope URI**

The scope passed to `acquireTokenSilent` must be the full URI, which is easy to get wrong:

```js
// Wrong — gets a Microsoft Graph token, not your API token
const scopes = ["access_as_user"];

// Correct
const scopes = ["api://<your-client-id>/access_as_user"];
```

Using the short form, MSAL doesn't recognise it as a custom API scope and issues a token for Microsoft Graph instead. Your .NET API will reject it with a 401 because the audience (`aud` claim) in the token won't match, which can be a frustrating one to debug.
