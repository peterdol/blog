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

An Essay on Typography by Eric Gill takes the reader back to the year 1930. The year when a conflict between two worlds came to its term. The machines of the industrial world finally took over the handicrafts.

The typography of this industrial age was no longer handcrafted. Mass production and profit became more important. Quantity mattered more than the quality. The books and printed works in general lost a part of its humanity. The typefaces were not produced by craftsmen anymore. It was the machines printing and tying the books together now. The craftsmen had to let go of their craft and became a cog in the process. An extension of the industrial machine.

But the victory of the industrialism didn’t mean that the craftsmen were completely extinct. The two worlds continued to coexist independently. Each recognising the good in the other — the power of industrialism and the humanity of craftsmanship. This was the second transition that would strip typography of a part of its humanity. We have to go 500 years back in time to meet the first one.

## The code

```cs
    public class ApplePushNotificationsConnector : IConnector
    {
        private readonly ILogger<ApplePushNotificationsConnector> logger;
        private readonly HttpClient httpClient;
        private readonly IMemoryCache memoryCache;
        private readonly ApplePushNotificationSettings apnsSettings;
        private const string cacheKey = "APNS.Token";

        public ApplePushNotificationsConnector()
        {
        }
        public ApplePushNotificationsConnector(ILogger<ApplePushNotificationsConnector> logger, HttpClient httpClient, AppSettings appSettings, IMemoryCache memoryCache)
        {
            this.logger = logger;
            this.httpClient = httpClient;
            this.memoryCache = memoryCache;
            this.apnsSettings = appSettings.ApplePushNotificationSettings;
        }

        public virtual async Task<PublishResult> Send(EventLog evt, MessageTemplate template)
        {
            this.logger.LogInformation($"Apns settings base url: {this.apnsSettings.BaseUrl}.");

            PublishResult result = null;

            foreach (var deviceToken in evt.Account.ApplePushNotificationTokens)
            {
                try
                {
                    var request = CreateRequest(deviceToken, template);
                    var rawRequestContent = await request.Content.ReadAsStringAsync().ConfigureAwait(false);

                    this.logger.LogInformation($"Raw HTTP request:{rawRequestContent}.");

                    var response = await httpClient.SendAsync(request);
                    var responseString = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                    this.logger.LogInformation($"Response from APNS: StatusCode = {response.StatusCode}, Content = {responseString}");

                    if (response.StatusCode == HttpStatusCode.OK)
                    {
                        result = PublishResult.CreateOKResult(deviceToken);
                    }
                    else
                    {
                        result = PublishResult.CreateFailureResult(deviceToken, null, (int)response.StatusCode, responseString);
                    }
                }
                catch (Exception e)
                {
                    this.logger.LogError(new EventId(9001), e, e.Message);

                    result = PublishResult.CreateFailureResult(deviceToken, null, 9001, e.Message);
                }
            }

            return result;
        }

        #region Helper methods

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
                    ToBase64String(UTF8.GetBytes(provider)) + "." + ToBase64String(UTF8.GetBytes(claims));
                var bytes = UTF8.GetBytes(unsignedJwtData);
                var signature =
                    dsa.SignData(UTF8.GetBytes(unsignedJwtData), 0, bytes.Length, HashAlgorithmName.SHA256);

                return unsignedJwtData + "." + ToBase64String(signature);
            }
        }

        private HttpRequestMessage CreateRequest(string deviceToken, MessageTemplate template)
        {
            var content = WebUtility.HtmlDecode(template.BodyCompiled(template.Data));
            this.logger.LogInformation($"Sending push message to APNS. Device token: {deviceToken}, content: {content}.");

            var request = new System.Net.Http.HttpRequestMessage(System.Net.Http.HttpMethod.Post, $"{this.apnsSettings.BaseUrl}{deviceToken}")
            {
                // upgrade the HTTP request to HTTP/2 (required for .NET Core on Linux)
                Version = new System.Version(2, 0),
                Content = new StringContent(content, Encoding.UTF8, "application/json")
            };

            var jwt = GetJwt();
            request.Headers.Add("authorization", $"Bearer {jwt}");
            request.Headers.Add("apns-topic", "nl.etender.eTender");

            return request;
        }

        #endregion
    }
```
