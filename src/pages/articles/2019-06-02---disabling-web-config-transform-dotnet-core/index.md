---
title: "How to disable web.config transforms with .net core"
date: "2018-06-02T17:40:32.169Z"
layout: post
draft: false
slug: "disable-web-config-transform-dotnet-core"
path: "/posts/disable-web-config-transform-dotnet-core"
category: ".NET Core"
tags:
  - "eTender"
  - ".NET Core"
  - "Web Development"
description: "A short blog post about how to disable web.config transforms in .net core so a dotnet publish command will not replace your web.config in the published output."
---

I had a small problem that the web.config of the eTender Messenger was overwritten with every new dotnet publish command. Because of this, we had to take care to exclude the published config with every deployment to production. The solution was very simple, but took some researching on the internet. You can add the following MS Build property to your csproj to prevent overwriting your web.config:

```xml
<IsTransformWebConfigDisabled>true</IsTransformWebConfigDisabled>
```

In [this aspnet github issue](https://github.com/aspnet/websdk/issues/115) the setting is confusingly called IsWebConfigTransformEnabled, but in my setup (Visual Studio Code on OSX, .net core 2.0) adding this property does not work and I had to use IsTransformWebConfigDisabled ;-).