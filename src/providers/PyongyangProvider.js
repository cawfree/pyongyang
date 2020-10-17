import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";

import { PyongyangContext, defaultContext } from "../contexts";
import { Interpreter } from "../components";

function PyongyangProvider({ children }) {
  const [interpreters, setInterpreters] = useState({});
  const onMounted = useCallback(
    (id, src, { variables, resources, callbacks }, onCompleted, onError) => {
      setInterpreters(e => ({
        ...e,
        [id]: {
          src,
          variables,
          resources,
          callbacks,
          onCompleted,
          onError,
        },
      }));
    },
    [setInterpreters]
  );
  const onUnmounted = useCallback((id) => {
    setInterpreters(e => Object.fromEntries(
      Object.entries(e).filter(([k]) => k !== id)
    ));
  }, [setInterpreters]);
  return (
    <PyongyangContext.Provider
      value={{
        ...defaultContext,
        onMounted,
        onUnmounted,
      }}
    >
      {Object.entries(interpreters).map(([k, {
        src,
        variables,
        resources,
        callbacks,
        onCompleted,
        onError,
      }]) => (
        <Interpreter
          key={k}
          src={src}
          variables={variables}
          resources={resources}
          callbacks={callbacks}
          onCompleted={onCompleted}
          onError={onError}
        />
      ))}
      {children}
    </PyongyangContext.Provider>
  );
}

PyongyangProvider.propTypes = {};
PyongyangProvider.defaultProps = {};

export default PyongyangProvider;
