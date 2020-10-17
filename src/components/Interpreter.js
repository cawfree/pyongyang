import React, { useRef, useCallback, useState } from "react";
import PropTypes from "prop-types";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview-modal";
import { nanoid } from "nanoid/non-secure";
import xss from "xss";

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
}) {
  const [tasks, setTasks] = useState({});
  const ref = useRef();
  const encodeSrc = useCallback((src, variables, callbacks) => {
    const srcWithVariables = Object.entries(variables)
      .reduce(
        (nextSrc, [k, v]) => nextSrc.split(`$${k}`).join(xss(JSON.stringify(v))),
        src,
      );
    return Object.keys(callbacks)
      .reduce(
        (nextSrc, k) => nextSrc.split(`$${k}`).join(`shouldPostMessage("${k}")`),
        srcWithVariables,
      );
  }, []);
  const onMessage = useCallback(({ nativeEvent: { data }}) => {
    try { 
      const { method, params } = JSON.parse(data);
      if (method === "$onError") {
        return onError(...params);
      } else if (method === "$onCompleted") {
        const [...keys] = params;
        const futures = keys.reduce(
          (obj, k) => ({
            ...obj,
            [k]: (...args) => new Promise(
              (resolve, reject) => {
                const taskId = nanoid();
                setTasks(e => ({ ...e, [taskId]: { resolve, reject } }));
                ref.current.injectJavaScript(`window.$Pyongyang["${k}"](${[taskId, ...args].map(e => xss(JSON.stringify(e))).join(",")}); true;`);
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
      return onError(e);
    }
  }, [callbacks, onError, onCompleted, ref, setTasks]);
  // TODO: throw on key overlap
  // TODO: Prevent call signature being used within scope
  return (
    <View style={styles.container} pointerEvents="none">
      <WebView
        ref={ref}
        originWhitelist={["*"]}
        onMessage={onMessage}
        source={{
          baseUrl: '',
          html: `
           <!DOCTYPE html>
           <html lang="en">
           <head><meta charset="utf-8"/></head>
           <body>
             <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
             ${resources.map(e => `<script src="${xss(e)}"></script>`).join("\n")}
             <script type="text/babel">
               const shouldPostMessage = (method) => (...params) => {
                 if (window.ReactNativeWebView) {
                   return window.ReactNativeWebView.postMessage(JSON.stringify({
                     method,
                     params,
                   }));
                 }
               };
               (async () => {
                try {
                  const result = await (async () => {
                   ${encodeSrc(src, variables, callbacks)}
                  })();
                  if (result === undefined || result === null) {
                    return shouldPostMessage("$onCompleted")([]);
                  } else if (typeof result === "object") {
                    window.$Pyongyang = Object.freeze(Object.fromEntries(
                      Object.entries(result)
                        .filter(([k, v]) => typeof v === "function")
                        .map(([k, v]) => [k, async (taskId, ...args) => {
                          try {
                            shouldPostMessage("$onTaskCompleted")([taskId, await v(...args)]);
                          } catch (e) {
                            shouldPostMessage("$onTaskError")([taskId, e]);
                          }
                        }]),
                    ));
                    return shouldPostMessage("$onCompleted")(Object.keys(window.$Pyongyang));
                  }
                  throw \`Encountered invalid futures, "\${typeof result}". Expected one of null, undefined, object.\`;
                } catch (e) { shouldPostMessage("$onError")(e) }
               })();
             </script>
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
};

Interpreter.defaultProps = {
  src: "",
  variables: {},
  resources: [],
  callbacks: {},
};

export default Interpreter;
