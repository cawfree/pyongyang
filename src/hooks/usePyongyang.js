import { useContext, useCallback } from "react";

import { PyongyangContext } from "../contexts";

export default function usePyongyang() {
  const { onMounted, onUnmounted } = useContext(PyongyangContext);
  const onMount = useCallback((id, src, opts, onCompleted, onError) => {
    if (typeof id !== "string" || !id.length) {
      throw new Error(`Expected non-empty string id, encountered ${id}.`);
    } else if (!src) {
      throw new Error(`Expected string src, encountered ${src}.`);
    } else if (!opts || typeof opts !== "object") {
      throw new Error(`Expected Object opts, encountered ${opts}.`);
    } else if (typeof onCompleted !== "function") {
      throw new Error(`Expected function onCompleted, encountered ${onCompleted}.`);
    } else if (typeof onError !== "function") {
      throw new Error(`Expected function onError, encountered ${onError}.`);
    }
    return onMounted(id, `${src}`, opts, onCompleted, onError);
  }, [onMounted]);
  const onUnmount = useCallback((id) => {
    if (typeof id !== "string" || !id.length) {
      throw new Error(`Expected non-empty string id, encountered ${id}.`);
    }
    return onUnmounted(id);
  }, [onUnmounted]);
  return { onMount, onUnmount };
}
