import { useState, useCallback } from "react";
import { nanoid } from "nanoid/non-secure";
import deepmerge from "deepmerge";
import useDeepCompareEffect from "use-deep-compare-effect";

import { usePyongyang } from ".";

const defaultOptions = Object.freeze({
  variables: {},
  resources: [],
  callbacks: {},
});

const defaultState = Object.freeze({
  loading: true,
  error: null,
  futures: {},
});

export default function pyongyang(
  src = '',
  options = defaultOptions,
) {
  const [{ loading, error, futures }, setState] = useState(defaultState);
  const opts = deepmerge(defaultOptions, options);
  const [id] = useState(nanoid);
  const { onMount, onUnmount } = usePyongyang();
  const onCompleted = useCallback(({ futures }) => {
    return setState({
      ...defaultOptions,
      loading: false,
      futures,
    });
  }, [setState]);
  const onError = useCallback((e) => {
    return setState({
      ...defaultState,
      loading: false,
      error: new Error(e),
    });
  }, [setState]);
  useDeepCompareEffect(() => {
    onMount(id, src, opts, onCompleted, onError);
    return () => onUnmount(id);
  }, [
    id,
    src,
    opts,
    onMount,
    onUnmount,
    onCompleted,
    onError,
  ]);
  return { loading, error, futures };
}
