---
title: "Calling APNS using HTTP2 and .NET Core"
date: "2018-07-21T22:40:32.169Z"
layout: post
draft: false
slug: "apns-dotnet-core"
path: "/posts/calling-apns-using-http2-and-dotnet/"
category: ".NET Core"
tags:
  - "eTender"
  - ".NET Core"
  - "Web Development"
description: "The eTender Messenger sends out push notifications to connected iOS devices. This blog post describes how to connect to the HTTP/2 APNS (Apple Push Notification Service) from .NET Core."
---

The eTender Messenger sends out push notifications to connected iOS devices. This blog post describes how to connect to the HTTP/2 APNS (Apple Push Notification Service) from .NET Core. In this blog post I highlight the following parts necessary to connect to APNS:

* HTTP/2
* JWT encryption
* JWT lifetime

## HTTP/2 web request

First you have to create a HTTP/2 web request. This can be done explicitly like this:

```csharp
\\ the content is the JSON payload, this is described later in this blog post
var request = new HttpRequestMessage(HttpMethod.Post, $"{this.apnsSettings.BaseUrl}{deviceToken}")
    {
        // upgrade the HTTP request to HTTP/2 (required for .NET Core on Linux)
        Version = new System.Version(2, 0),
        Content = new StringContent(content, Encoding.UTF8, "application/json")
    };
```

## JWT encryption

The JWT is created as follows. We run on windows server 2016, so we can use the Windows Cryptography Next Generation (CNG) library which is not available on OSX and Linux.

```csharp
private string CreateJwt()
{
    string provider = JsonConvert.SerializeObject(
            new { alg = "ES256", kid = this.apnsSettings.PrivateKeyId }
    );

    var claims = JsonConvert.SerializeObject(
        new { iss = this.apnsSettings.Issuer, iat = new DateTimeOffset(DateTime.UtcNow, TimeSpan.Zero).ToUnixTimeSeconds() }
    );

    CngKey key = CngKey.Import(
        FromBase64String(this.apnsSettings.PrivateKey),
        CngKeyBlobFormat.Pkcs8PrivateBlob);

    using (ECDsaCng dsa = new ECDsaCng(key))
    {
        var unsignedJwtData =
            ToBase64String(UTF8.GetBytes(provider)) + "." +
                ToBase64String(UTF8.GetBytes(claims));
        var bytes = UTF8.GetBytes(unsignedJwtData);
        var signature =
            dsa.SignData(UTF8.GetBytes(unsignedJwtData), 0,
                bytes.Length, HashAlgorithmName.SHA256);

        return unsignedJwtData + "." + ToBase64String(signature);
    }
}
```

## JWT lifetime

After testing my implementation for some time, I started getting error code 429, TooManyProviderTokenUpdates. Carefully hidden away in the documentation it is mentioned that the JWT should be reused and is valid for a maximum of 60 minutes. So I decided to cache the generated JWT and reuse it for the following connections. This fixed the 429, TooManyProviderTokenUpdates error.

```js
private string GetJwt()
{
    string jwt;

    if (!this.memoryCache.TryGetValue(cacheKey, out jwt))
    {
        jwt = CreateJwt();

        // reuse jwt for 59 minutes to prevent TooManyProviderTokenUpdates error
        memoryCache.Set(cacheKey, jwt,
        new MemoryCacheEntryOptions()
        .SetAbsoluteExpiration(TimeSpan.FromMinutes(59)));
    }

    return jwt;
}
```
