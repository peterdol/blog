---
title: "The beauty of the spread syntax in ES6"
date: "2018-08-01T13:14:00.000Z"
layout: post
draft: false
slug: "beauty-of-ES6-spread-syntax"
path: "/posts/beauty-of-ES6-spread-syntax/"
category: "React.js"
tags:
  - "ES6"
  - "eTender"
  - "React.js"
  - "Web Development"
description: "One of the many improvements in ES6 is the spread syntax. It allows an iterable to expand in places where 0+ arguments are expected and can also be used to merge objects in a very elegant way."
---

The eTender widget has a feature where restaurants can overrule and add their own widget texts. For this I had to merge two arrays with key value pairs, which before ES6 was not difficult, just a little bit clunky.

With ES6 comes the spread syntax, which allows an iterable to expand in places where 0+ arguments are expected and which can also be used to merge objects in a very elegant way.

```js
const defaultTexts = { title: 'Date', button: 'Continue' }
const overruledTexts = { button: 'Next', note: 'Click next' }
const combinedText = {
  ...defaultTexts,
  ...overruledTexts,
}
// now combinedText equals { title: "Date", button: "Next", note: "Click next" }
```

I find the above syntax visually very pleasing. In my imagination the dots represent the unpacking of 2 stacks of boxes, after which they get combined and packed up again in a new, bigger stack by the surrounding brackets.

Smart features like this just put a smile on my face and make ES6 really a joy to use.

The order of the combined objects matters by the way, if the merged objects share some properties, the properties of the last object will overrule the properties of previous objects.
