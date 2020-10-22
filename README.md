# pyongyang
The simplest way to integrate with JS dependencies designed for the Web within [**React Native**](https://reactnative.dev).

> ⚠️ **Warning:** Pyongyang is super experimental. Don't do anything sensitive or important with it, just have fun. 🙏

### 🔥 Features
  - Execute **any** standard web dependency within React Native!
    - [`Web3`](https://github.com/ethereum/web3.js/), [`Arweave`](https://www.arweave.org/), [`IPFS`](https://ipfs.io/) etc.
  - Back-and forth encryption.
    - Data is passed back and forth using an encrypted dynamic secret persisted in obfuscated source.
    - Every time your hook is amounted, the secret is recycled.
  - XSS Resistant
    - All input variables are passed through stringification first, turning executable code into safe strings.
  - Supports ES6.
  - Supports Android, iOS and the Web!

## 🚀 Getting Started

Using [**Yarn**]():

```bash
yarn add react-native-webview pyongyang
```

## 📚 Guide

### 1. Hello, world!

In the following example, we show how simple it is to invoke a JavaScript runtime running in a hidden managed [`WebView`](). First, we declare a [`Pyongyang`](./) [**Provider**](https://reactjs.org/docs/context.html) at the root of the application; this component manages the instantiation of `WebView`s to execute your scripts.

Inside the `Hello` component, we make a call to the `pyongyang` [**hook**](https://reactjs.org/docs/hooks-intro.html):

```javascript
import * as React from "react";
import Pyongyang, { pyongyang } from "pyongyang";

function Hello() {
  pyongyang`alert('hello, world')`;
  return null;
}

export default function () {
  return <Pyongyang><Hello /></Pyongyang>;
}
```

Upon load, the defined script is executed by an anonymous WebView, which cannot be seen or interacted with. This is because `pyongyang` is designed for pure computation.

### 2. Variables

Let's make things a little more complicated. This time, using the `variables` parameter, we can pass data from the React Native runtime into the target JavaScript engine. These variables can be referenced in supplied code by prefixing the variable name with a `$`.

In this instance, the variable `name` is referenced using `$name`.

```javascript
import * as React from "react";
import Pyongyang, { pyongyang } from "pyongyang";

function Variables() {
  pyongyang(`await alert('hello, $name')`, { variables: { name: "world" } });
  return null;
}

export default function () {
  return <Pyongyang><Variables /></Pyongyang>;
}
```

> **Note:** Notice that your code is executed within an `async` block.

### 3. Callbacks

It's also simple to accept callbacks from [`pyongyang`](./). Here, the `onMessage` callback is referenced via `$onMessage`.

```javascript
import * as React from "react";
import { Alert } from "react-native";
import Pyongyang, { pyongyang } from "pyongyang";

function Callbacks() {
  const onMessage = React.useCallback(message => console.log(message), []);
  pyongyang(`$onMessage('hello, world!')`, { callbacks: { onMessage } });
  return null;
}

export default function () {
  return <Pyongyang><Callbacks /></Pyongyang>;
}
```

### 4. Dependencies

Here's where things get interesting. It's possible to pass [**CDN**](https://www.jsdelivr.com/) script references into `pyongyang`, which become available in the window object. These external JavaScript resources can be specified using the `resources` prop.

In the example below, it's trivial to utilize the [**Interplanetary File System (IPFS)**](https://ipfs.io/) directly inline, without making any native changes.

```javascript
import * as React from "react";

import Pyongyang, { pyongyang } from "pyongyang";

function Ipfs() {
  const {} = pyongyang(`
  const node = await Ipfs.create();
  $onNodeCreated(await node.id());
`, {
      resources: ["https://unpkg.com/ipfs/dist/index.min.js"],
      callbacks: { onNodeCreated: console.warn },
    },
  );
  return null;
}

export default function () {
  return <Pyongyang><Ipfs /></Pyongyang>;
};
```

### 5. Futures

It's also possible to execute in `pyongyang` after the initial script has been executed. Your script is allowed to return an object of functions which you'd like to expose back to the native runtime. These can be executed asynchronously, and retain the scope of the original function call.

```javascript
import * as React from "react";

import Pyongyang, { pyongyang } from "pyongyang";

function Futures() {
  const { loading, error, futures: { myFunction } } = pyongyang`
  const myFunction = i => i + 1;
  return { myFunction };
`;
  React.useEffect(() => {
    !!myFunction && (async () => {
      const result = await myFunction(4);
      console.warn(result === 5); // true
    })();
  }, [loading, myFunction]);
  return null;
}

export default function () {
  return <Pyongyang><Futures /></Pyongyang>;
}
```

### 6. Refs

Since the JavaScript code you execute happens inside of a `WebView`, rich objects cannot be passed back into React Native; they can only be transported in a way that can be represented using JSON. Therefore, if you wish to hold onto the runtime representation of an object for use later, you need to use a **ref**, which is basically a reference to an object which can be retained and used later.

To highlight a method as a ref, prefix the method name using a `$`.

```javascript
import * as React from "react";

import Pyongyang, { pyongyang } from "pyongyang";

function Refs() {
  const { loading, error, futures } = pyongyang`
  return {
    $get: msg => {
      someValue: 5,
      doSomething: () => alert(msg),
    },
    doSomethingWith: e => e.doSomething(),
  };
`;
  React.useEffect(() => {
    !!Object.keys(futures.length) && (async () => {
      const { doSomethingWith, $get } = futures;
      const x = await $get("Hello!");
      console.log(x); // e.g. "2Zr_daUmdBwjxfMQIT0er"
      await doSomethingWith(x); // alert('Hello!')
    })();
  }, [futures]);
  return null;
}

export default function () {
  return <Pyongyang><Refs /></Pyongyang>;
}
```

## ✌️ License
[**MIT**](./LICENSE)
