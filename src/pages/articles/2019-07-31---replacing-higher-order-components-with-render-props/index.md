---
title: "Getting rid of HOC's"
date: "2018-07-31T13:14:00.000Z"
layout: post
draft: false
slug: "replacing-higher-order-components-with-render-props"
path: "/posts/replacing-higher-order-components-with-render-props/"
category: "React.js"
tags:
  - "eTender"
  - "React.js"
  - "Web Development"
description: "The eTender widget uses React Higher Order Components in various places to facilitate code reuse. In this blog post I describe how and why I replaced the HOC pattern with regular components with a 'render prop'."
---

The eTender widget uses React Higher Order Components in various places to facilitate code reuse. HOC's are the first pattern you find if you look for ways to reuse code in React.js. But after reading ['Use a Render Prop!', by Michael Jackson](https://cdb.reacttraining.com/use-a-render-prop-50de598f11ce), I got convinced that they are not always the best choice so I decided to change the HOC's to regular components with a 'render prop'.

In this blog post I'll outline the changes that have to be made to get rid of HOC's.

## The hoverable HOC

In the eTender widget there are multiple components (party size, time, date) that are hoverable and change their style when hovered. At first I used this simple hoverable HOC, inspired by [this github gist](https://gist.github.com/dlmanning/c400722f14177f7638de).

```js
// HOC:
import React, { PureComponent } from 'react'

function hoverable(WrappedComponent, propName = 'hover') {
  return class HoverableComponent extends PureComponent {
    state = { hovered: false }

    toggleHovered(toggle) {
      this.setState({ hovered: toggle })
    }
    render() {
      const props = { [propName]: this.state.hovered, ...this.props }
      return (
        <div
          onMouseEnter={() => this.toggleHovered(true)}
          onMouseLeave={() => this.toggleHovered(false)}
        >
          <WrappedComponent {...props} />
        </div>
      )
    }
  }
}

export default hoverable
```

This HOC was then used like this:

```js
import React from 'react'
import hoverable from '../common/hoverable'

const PartySizeCell = props => (
  <div
    className={`${props.hover ? 'etender-calendar-widget-theme' : ''}`}
    onClick={() => props.onPartySizeClick(props.index)}
  >
    {props.index}
  </div>
)

const HoverablePartySizeCell = hoverable(PartySizeCell)

export default HoverablePartySizeCell
```

## Convert to 'Render props'

It is very simple to get rid of the HOC. You just change the HOC to a regular component with a 'render prop'.

```csharp
import React from "react";
import PropTypes from "prop-types";

class HoverableComponent extends React.Component {
    static propTypes = {
        render: PropTypes.func.isRequired
    };

    state = { hovered: false };

    toggleHovered(toggle) {
        this.setState({ hovered: toggle });
    }

    render() {
        return (
            <div
                onMouseEnter={() => this.toggleHovered(true)}
                onMouseLeave={() => this.toggleHovered(false)}>
                {this.props.render(this.state)}
            </div>
        );
    }
}

export default HoverableComponent;
```

This normal component is then used like this:

```js
import React from 'react'
import HoverableComponent from '../HoverableComponent'

const PartySizeCell = props => (
  <HoverableComponent
    render={({ hovered }) => (
      <div
        className={`${hovered ? 'etender-calendar-widget-theme' : ''}`}
        onClick={() => props.onPartySizeClick(props.index)}
      >
        {props.index}
      </div>
    )}
  />
)

export default PartySizeCell
```

## Conclusion

As you can see it is very easy to transform HOC's to normal React Components. By doing this you get a lot of benefits, which are described in detail in ['Use a Render Prop!', by Michael Jackson](https://cdb.reacttraining.com/use-a-render-prop-50de598f11ce).
