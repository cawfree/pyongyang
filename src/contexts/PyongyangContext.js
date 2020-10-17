import { createContext } from "react";

const createErrorThunk = () => () => {
  throw new Error(
    `It looks like you've forgotten to wrap your application in a <PyongyangProvider />.`
  );
};

export const defaultContext = Object.freeze({
  onMounted: createErrorThunk(),
  onUnmounted: createErrorThunk(),
});

const PyongyangContext = createContext(defaultContext);

export default PyongyangContext;
