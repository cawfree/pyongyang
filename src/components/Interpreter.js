import React, { useRef, useCallback, useState } from "react";
import PropTypes from "prop-types";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview-modal";
import { nanoid } from "nanoid/non-secure";
import SimpleCrypto from "simple-crypto-js";
import useDeepCompareEffect from "use-deep-compare-effect";
import { mangle } from "gnirts";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: 0,
    height: 0,
    opacity: 0,
  },
});

function Interpreter({
  src,
  variables,
  resources,
  callbacks,
  onCompleted,
  onError,
  originWhitelist,
}) {
  const [tasks, setTasks] = useState({});
  const ref = useRef();
  const [secretKey] = useState(() => `${nanoid()}${nanoid()}${nanoid()}`);
  const [simpleCrypto] = useState(() => new SimpleCrypto(secretKey));
  const [js, setJs] = useState("/**/");
  const encodeSrc = useCallback((src, variables, callbacks) => {
    const srcWithVariables = Object.entries(variables)
      .reduce(
        (nextSrc, [k, v]) => nextSrc.split(`$${k}`).join(JSON.stringify(v)),
        src,
      );
    return Object.keys(callbacks)
      .reduce(
        (nextSrc, k) => nextSrc.split(`$${k}`).join(`shouldPostMessage("${k}")`),
        srcWithVariables,
      );
  }, []);
  useDeepCompareEffect(() => {
    setJs(`
// https://flaviocopes.com/how-to-list-object-methods-javascript/
const getMethods = (obj) => {
  let properties = new Set()
  let currentObj = obj
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
  } while ((currentObj = Object.getPrototypeOf(currentObj)))
  return [...properties.keys()].filter(item => typeof obj[item] === 'function')
};

const simpleCrypto = new SimpleCrypto(${mangle(`/* @mangle */"${secretKey}"/* @/mangle */`)});

const shouldPostMessage = (method) => (...params) => {
  const dataToSend = simpleCrypto.encrypt(JSON.stringify({ method, params }));
  /* react-native */
  if (window.ReactNativeWebView) {
    return window.ReactNativeWebView.postMessage(dataToSend);
  }
  /* browser */
  return top.postMessage(dataToSend, (window.location != window.parent.location)
    ? document.referrer
    : document.location,
  );
};

// https://github.com/ai/nanoid/issues/127
const nanoid = () => {
  const chars =
    '1234567890' +
    'abcdefghijklmnopqrstuvwxyz' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const charsLen = chars.length;
  const length = 21;
  const id = [];
  for (let i = 0; i < length; i++) {
    id.push(chars[(Math.round(Math.random() * 100)) % charsLen]);
  }
  return id.join('');
};

(async () => {
  try {
    /* init */
    window.$PyongyangRefs = {};

    const $ref = async (value) => {
      const result = await value;
      const id = nanoid();
      /* encapsulate id within speech marks for simplified lookup */
      Object.assign(window.$PyongyangRefs, { [id]: result });
      /* return the id and the result */
      return [id, result];
    };

    const result = await (async () => { ${encodeSrc(src, variables, callbacks)} })();
    if (result === undefined || result === null) {
      return shouldPostMessage("$onCompleted")([]);
    } else if (typeof result === "object") {
      const futures = Object.freeze(
        getMethods(result).reduce((obj, k) => ({
          ...obj,
          [k]: async (taskId, ...args) => {
            try {
              const solution = await result[k](...args);
              const isRef = k.charAt(0) === "$";
              if (isRef) {
                const [ref] = await $ref(solution);
                shouldPostMessage("$onTaskCompleted")([taskId, ref]);
              } else {
                shouldPostMessage("$onTaskCompleted")([taskId, solution]);
              }
            } catch (e) {
              shouldPostMessage("$onTaskError")([taskId, e.message ? e.message : e]);
            }
          },
        }), {}),
      );
      window.$Pyongyang = (e) => {
        const [func, k, ...args] = simpleCrypto.decrypt(e);
        const resolvedArgs = args.map(
          (e) => {
            /* replace refs */
            if (typeof e === "string" && window.$PyongyangRefs.hasOwnProperty(e)) {
              return window.$PyongyangRefs[e];
            }
            return e;
          },
        );
        return futures[func](k, ...resolvedArgs);
      };
      return shouldPostMessage("$onCompleted")(Object.keys(futures));
    }
    throw new Error(\`Encountered invalid futures, "\${typeof result}". Expected one of null, undefined, object.\`);
  } catch (e) { shouldPostMessage("$onError")(e.message ? e.message : e) }
})();
    `);
  }, [setJs, secretKey, encodeSrc, variables, callbacks]);
  const onMessage = useCallback(({ nativeEvent: { data }}) => {
    try { 
      const { method, params } = simpleCrypto.decrypt(data);
      if (method === "$onError") {
        return onError(...params);
      } else if (method === "$onCompleted") {
        const [[...keys]] = params;
        const futures = keys.reduce(
          (obj, k) => ({
            ...obj,
            [k]: (...args) => new Promise(
              (resolve, reject) => {
                const taskId = nanoid();
                setTasks(e => ({ ...e, [taskId]: { resolve, reject } }));
                ref.current.injectJavaScript(`window.$Pyongyang("${
                  simpleCrypto.encrypt(JSON.stringify([k, taskId, ...args]))
                }"); true;`);
              },
            ),
          }),
          {},
        );
        return onCompleted({ futures });
      } else if (method === "$onTaskCompleted") {
        const [[taskId, result]] = params;
        return setTasks(e => Object.fromEntries(
          Object.entries(e)
            .filter(([k, { resolve }]) => {
              (k === taskId) && resolve(result);
              return k !== taskId;
            }),
        ));
      } else if (method === "$onTaskError") {
        const [[taskId, error]] = params;
        return setTasks(e => Object.fromEntries(
          Object.entries(e)
            .filter(([k, { reject }]) => {
              (k === taskId) && reject(error);
              return k !== taskId;
            }),
        ));
      }
      const maybeCallback = callbacks[method];
      if (typeof maybeCallback === "function") {
        return maybeCallback(...params);
      }
    } catch (e) {
      console.error(e);
      return onError(e);
    }
  }, [callbacks, onError, onCompleted, ref, setTasks, simpleCrypto]);
  return (
    <View style={styles.container} pointerEvents="none">
      <WebView
        ref={ref}
        originWhitelist={originWhitelist}
        onMessage={onMessage}
        source={{
          baseUrl: '',
          html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/></head>
<body>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/simple-crypto-js@2.5.0/dist/SimpleCrypto.min.js"></script>
  ${resources.map(e => `<script src="${e}"></script>`).join("\n")}
  <script type="text/babel">${js}</script>
</body>
</html>
          `
        }}
      />
    </View>
  );
}

Interpreter.propTypes = {
  src: PropTypes.string.isRequired,
  variables: PropTypes.shape({}).isRequired,
  resources: PropTypes.arrayOf(PropTypes.string).isRequired,
  callbacks: PropTypes.shape({}).isRequired,
  onCompleted: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  originWhitelist: PropTypes.arrayOf(PropTypes.string),
};

Interpreter.defaultProps = {
  src: "",
  variables: {},
  resources: [],
  callbacks: {},
  originWhitelist: ["*"],
};

export default React.memo(Interpreter);
