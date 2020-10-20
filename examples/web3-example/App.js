import * as React from "react";
import { View, Text } from "react-native";

import Pyongyang, { pyongyang } from "pyongyang";

function Web3({ infuraApiKey }) {
  const { error, futures } = pyongyang(`
    const web3 = new Web3(new Web3.providers.HttpProvider($infuraApiUrl));
    return {
      getLatestBlock: () => web3.eth.getBlock("latest"),
    };
  `, {
    variables: {
      infuraApiUrl: `https://ropsten.infura.io/v3/${infuraApiKey}`,
    },
    resources: ["https://cdn.jsdelivr.net/gh/ethereum/web3.js@1.0.0-beta.34/dist/web3.min.js"],
  });

  !!error && console.error(error);

  React.useEffect(() => {
    !!Object.keys(futures).length && (async () => {
      try {
        const { getLatestBlock } = futures;
        console.warn(await getLatestBlock());
      } catch (e) {
        console.error(e);
      }
    })();
  }, [futures]);
  return null;
}

export default function App() {
  return (
    <Pyongyang>
      <Web3 infuraApiKey="noapikey" />
    </Pyongyang>
  );
}
