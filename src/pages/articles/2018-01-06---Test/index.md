---
title: Calling APNS using HTTP/2 and .NET Core
date: "2018-06-01T22:40:32.169Z"
layout: post
draft: false
slug: "apns-dotnet-core"
path: "/posts/calling-apns-using-http2-and-dotnet-core/"
category: ".NET Core"
tags:
  - "eTender"
  - ".NET Core"
  - "Web Development"
description: "This blog post describes how to call the new APNS HTTP/2 API from .NET Core."
---

The eTender Messenger sends out push notifications to connected iOS devices. This blog post describes how to connect to the HTTP/2 APNS (Apple Push Notification Service) from .NET Core.

First you have to create a HTTP/2 web request. In .NET this can be done like this:

```js
\\ the content is the JSON payload, this is described later in this blog post
var request = new HttpRequestMessage(HttpMethod.Post, $"{this.apnsSettings.BaseUrl}{deviceToken}")
    {
        // upgrade the HTTP request to HTTP/2 (required for .NET Core on Linux)
        Version = new System.Version(2, 0),
        Content = new StringContent(content, Encoding.UTF8, "application/json")
    };
    var jwt = CreateJwt();
    request.Headers.Add("authorization", $"Bearer {jwt}");
```

The JWT is created like this. We run on windows server 2016, so we can use the Windows Cryptography Next Generation (CNG) library which is not available on OSX and Linux.

```js
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
