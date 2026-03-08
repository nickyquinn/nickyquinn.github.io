---
layout: posts.njk
title: Attaching Entra ID tokens to Axios requests in React
tags: programming,react,azure,authentication
draft: true
date: 2026-03-06
description: "How to use @azure/msal-browser and an Axios interceptor to attach Entra ID Bearer tokens to every API request."
---

# Attaching Entra ID tokens to Axios requests in React

When building a React app that authenticates via Microsoft Entra ID (formerly Azure AD) and needs to call a protected .NET API, you'll need to attach a Bearer token to every outgoing request. Rather than doing this manually in each API call, you can use an Axios interceptor to handle it in one place using `@azure/msal-browser`.

You'll need @azure/msal-browser and axios installed, and an Entra ID app 
registration with a client ID and an API scope exposed — something like 
api://<your-client-id>/access_as_user.

## Initialising MSAL

First, create and export a `PublicClientApplication` instance:

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

MSAL needs to process any redirect responses before you start making token 
requests, so call initialize() before rendering:

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

It's worth setting the active account here too, before any components 
render and potentially trigger API calls — if no active account is set, 
acquireTokenSilent will throw.

With that done, the interceptor itself is straightforward:

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

`acquireTokenSilent` returns a cached or silently refreshed token where 
possible, falling back to a popup when it can't — for example if the user 
needs to consent to a new scope, or their session has expired.

One thing that caught me out: the scope needs to be the full URI. Using 
just "access_as_user" causes MSAL to issue a Microsoft Graph token instead 
of one for your API, and the .NET API will reject it with a 401 because 
the `aud` claim won't match.
