---
title: "How to generate unique short id's that are still secure"
date: "2018-06-06T17:40:32.169Z"
layout: post
draft: false
slug: "generate-unique-secure-short-ids-with-dotnet"
path: "/posts/generate-unique-secure-short-ids-with-dotnet"
category: "Security"
tags:
  - "eTender"
  - ".NET Core"
  - "Web Development"
  - "Security"
description: "The eTender REST API generates unique reservation codes after a client creates a reservation. This reservation code alone is enough to cancel or update a reservation, so it should be unique and impossible to guess or tamper with using a brute force attack. In this blog post I describe how we generate these id’s."
---

The [eTender REST API](http://thereservationbook.com/docs/developers/) generates unique reservation codes like GmTvbTmsmGi, bQ1EaiwTd1d, etc after a client creates a reservation. These reservation code alone are enough to cancel or update a reservation, so it should be unique and impossible to guess or tamper with using a brute force attack. In this blog post I describe how we generate these id's.

My technique is an improvement on [this blogpost](https://madskristensen.net/blog/A-shorter-and-URL-friendly-GUID) by Mads Kristensen. In his blogpost he describes how he Base64 encodes a guid and replaces the characters that are not supported in an url.

## Base58 instead of Base64

Instead of Base64 encoding and replacing some characters after the encoding, it's better to Base58 encode the Guid, and skip the characters we don't want right away in the encoding phase. My Base58 encoding algorithm is based on the one used in [this github gist](https://gist.github.com/CodesInChaos/3175971) to encode bitcoin addresses.

[This wiki page](https://en.bitcoin.it/wiki/Base58Check_encoding) lists the following advantages of Base58 encoding over Base64 encoding:

* No 0OIl characters that look the same in some fonts and could be used to create visually identical looking account numbers.
* A string with non-alphanumeric characters is not as easily accepted as an account number.
* E-mail usually won't line-break if there's no punctuation to break at.
* Doubleclicking selects the whole number as one word if it's all alphanumeric.

## RNG instead of GUIDs

The problem with using a GUID, is that GUID's are guaranteed to be unique, but are not guaranteed to be random. So there is still a risk, that someone can guess reservation codes with a brute force attack.

I found the solution in a comment of [this question on stackoverflow](https://stackoverflow.com/questions/2621563/how-random-is-system-guid-newguid-take-two). Here the RNGCryptoServiceProvider class is used to generate the bytes for a GUID, hereby making sure that the GUID is guaranteed random and secure.

Combining both solutions lead to the below code, which gives us completely secure and random keys that can easily be used on the internet.

```js
    public class SecretCodeGeneratorService : ISecretCodeGeneratorService
    {
        private const string digits = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

        // static to guarantee crypthographic randomness of the generated bytes
        private static readonly RNGCryptoServiceProvider rng = new System.Security.Cryptography.RNGCryptoServiceProvider();

        public string Generate(int length)
        {
            var data = new byte[length];
            rng.GetBytes(data);

            // Decode byte[] to BigInteger
            BigInteger intData = 0;
            for (int i = 0; i < data.Length; i++)
            {
                intData = intData * 256 + data[i];
            }

            // Encode BigInteger to Base58 string
            var result = string.Empty;
            while (intData > 0)
            {
                var remainder = (int)(intData % 58);
                intData /= 58;
                result = digits[remainder] + result;
            }

            // Append `1` for each leading 0 byte
            for (int i = 0; i < data.Length && data[i] == 0; i++)
            {
                result = '1' + result;
            }

            return result;
        }
    }
```

Because I wanted shorter codes that can more easily be shared and read, I settled for a byte array with a length of 8 instead of 16. This generates short codes like GmTvbTmsmGi, bQ1EaiwTd1d, etc. These shorter codes are ofcourse less secure then the longer ones, but more then secure enought for reservation codes which are valid only for a short period of time and are not used for extremely sensitive data.