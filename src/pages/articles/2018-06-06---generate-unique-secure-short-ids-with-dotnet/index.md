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

The [eTender REST API](http://thereservationbook.com/docs/developers/) generates unique reservation codes after a client creates a reservation. This reservation code alone is enough to cancel or update a reservation, so it should be unique and impossible to guess or tamper with using a brute force attack. In this blog post I describe how we generate these id's.

## A flawed version: Based on a guid

In my first (flawed) implementation, the reservation codes were based on [GUID's](https://en.wikipedia.org/wiki/Universally_unique_identifier), with a twist to make them shorter and more internet friendly.

My technique was a variation on [this blogpost](https://madskristensen.net/blog/A-shorter-and-URL-friendly-GUID) by Mads Kristensen. In his blogpost he describes how he Base64 encodes a guid and replaces the characters that are not supported in an url.

```js
  string enc = Convert.ToBase64String(guid.ToByteArray());
  enc = enc.Replace("/", "_");
  enc = enc.Replace("+", "-");
  return enc.Substring(0, 22);
```

## Base58 instead of Base64

Instead of Base64 encoding and replacing some characters after the encoding, we can also Base58 encode the Guid, and skip the characters we don't want right away in the encoding phase. That's what I did in the following algorithm, based on the Base58 encoding that's used in [this github gist](https://gist.github.com/CodesInChaos/3175971) to encode bitcoin addresses.

[This wiki page](https://en.bitcoin.it/wiki/Base58Check_encoding) lists the following advantages of Base58 encoding over Base64 encoding:

* No 0OIl characters that look the same in some fonts and could be used to create visually identical looking account numbers.
* A string with non-alphanumeric characters is not as easily accepted as an account number.
* E-mail usually won't line-break if there's no punctuation to break at.
* Doubleclicking selects the whole number as one word if it's all alphanumeric.

## The code that was flawed

The first flawed implementation .NET code that generates our reservation codes is as follows:

```js
public string GenerateReservationCode()
{
    const string digits = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    var data = Guid.NewGuid().ToByteArray();

    // Decode byte[] to BigInteger
    BigInteger intData = 0;
    for (int i = 0; i < data.Length; i++)
    {
        intData = intData * 256 + data[i];
    }

    // Encode BigInteger to Base58 string
    string result = "";
    while (intData > 0)
    {
        int remainder = (int)(intData % 58);
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
```

The code above generates reservation codes that look like SDX1oWoL5bTffRQkb6cwSC, 9G8UA5To42hzA7VWopEVUJ, etc., which are guaranteed to be unique and which are more or less human readable.

## Unique, but not guaranteed to be random

The problem with the code untill now is that the generated codes are guaranteed to be unique, but are not guaranteed to be random. So there is still a risk, that someone can guess reservation codes with a brute force attack.

I found the solution in a comment of [this question on stackoverflow](https://stackoverflow.com/questions/2621563/how-random-is-system-guid-newguid-take-two). Here the RNGCryptoServiceProvider class is used to generate the bytes for a GUID, hereby making sure that the GUID is guaranteed random and secure.

Combining both solutions lead to the below code, which gives us completely secure and random keys that can easily be used on the internet.

```js
public string GenerateReservationCode()
{
    const string digits = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    var rng = new System.Security.Cryptography.RNGCryptoServiceProvider();
    var data = new byte[16];
    rng.GetBytes(data);

    // Decode byte[] to BigInteger
    BigInteger intData = 0;
    for (int i = 0; i < data.Length; i++)
    {
        intData = intData * 256 + data[i];
    }

    // Encode BigInteger to Base58 string
    string result = "";
    while (intData > 0)
    {
        int remainder = (int)(intData % 58);
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
```

If you want shorter codes that can more easily be read, you could settle for a byte array with a length of 8 instead of 16, which generates shorter codes like GmTvbTmsmGi, bQ1EaiwTd1d, etc.
