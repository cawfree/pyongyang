import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview-modal";

import Pyongyang, { pyongyang } from "pyongyang";

function Arweave() {
  const [html, setHtml] = useState("");
  const { error, loading, futures } = pyongyang(`
    const arweave = Arweave.init();
    const { wallets } = arweave;
    return {
      generateWallet: () => wallets.generate(),
      getWalletBalance: address => wallets.getBalance(address),
      getWalletJwkToAddress: key => wallets.jwkToAddress(key),
      getWalletLastTransactionID: address => wallets.getLastTransactionID(address),
      createTransaction: (...args) => arweave.createTransaction(...args),
      createTaggedTransaction: async (data, key, tags = {}) => Object.entries(tags)
        .reduce(
          (transaction, [k, v]) => {
            transaction.addTag(k, v);
            return transaction;
          },
          await arweave.createTransaction(data, key),
        ),
      arToWinston: (...args) => arweave.ar.arToWinston(...args),
      getData: (...args) => arweave.transactions.getData(...args),
    };
  `, { resources: ["https://unpkg.com/arweave/bundles/web.bundle.js"] });

  !!error && console.error(error);

  useEffect(() => {
    Object.keys(futures).length && (async () => {
      const {
        generateWallet,
        getWalletBalance,
        getWalletJwkToAddress,
        getWalletLastTransactionID,
        createTransaction,
        createTaggedTransaction,
        arToWinston,

        getData,
      } = futures;
      const key = await generateWallet();
      const address = await getWalletJwkToAddress(key);
      const balance = await getWalletBalance(address);
      const lastTransactionId = await getWalletLastTransactionID(address);
      const transaction = await createTransaction({
        data: '<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body></body></html>',
      }, key);
      const taggedTransaction = await createTaggedTransaction({
        data: '<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body></body></html>',
      }, key, { "Content-Type": "text/html" });
      const valueTransaction = await createTransaction({
        target: '1seRanklLU_1VTGkEk7P0xAwMJfA7owA1JHW5KyZKlY',
        quantity: await arToWinston('10.5'),
      }, key);

      console.warn({ valueTransaction });

      setHtml(await getData(
        "bNbA3TEQVL60xlgCcqdz4ZPHFZ711cZ3hmkpGttDt_U",
        { decode: true, string: true },
      ));
    })();
  }, [loading, futures]);
  return (
    <WebView
      originWhiteList={["*"]}
      source={{
        html,
      }}
    />
  );
}

export default () => (
  <Pyongyang>
    <View style={StyleSheet.absoluteFill}>
      <Arweave />
    </View>
  </Pyongyang>
);
