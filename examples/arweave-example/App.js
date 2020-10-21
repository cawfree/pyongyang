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
      /* refs */
      $generateWalletRef: () => wallets.generate(),
      $createTransactionRef: (...args) => arweave.createTransaction(...args),
      $createTaggedTransactionRef: async (data, key, tags = {}) => Object.entries(tags)
        .reduce(
          (transaction, [k, v]) => {
            transaction.addTag(k, v);
            return transaction;
          },
          await arweave.createTransaction(data, key),
        ),
      /* plain */
      getWalletBalance: address => wallets.getBalance(address),
      getWalletJwkToAddress: key => wallets.jwkToAddress(key),
      getWalletLastTransactionID: address => wallets.getLastTransactionID(address), 
      arToWinston: (...args) => arweave.ar.arToWinston(...args),
      getTransactionData: (...args) => arweave.transactions.getData(...args),
      signTransaction: (...args) => arweave.transactions.sign(...args),
      postTransaction: (...args) => arweave.transactions.post(...args),
      getTransaction: (...args) => arweave.transactions.get(...args),
      arql: (...args) => arweave.arql(...args),
    };
  `, { resources: ["https://unpkg.com/arweave/bundles/web.bundle.js"] });

  !!error && console.error(error);
 
  useEffect(() => {
    Object.keys(futures).length && (async () => {
      const {
        /* refs */
        $generateWalletRef,
        $createTransactionRef,
        $createTaggedTransactionRef,
        /* plain */
        getWalletBalance,
        getWalletJwkToAddress,
        getWalletLastTransactionID,
        arToWinston,
        getTransactionData,
        signTransaction,
        postTransaction,
        getTransaction,
        arql,
      } = futures;
      const walletRef = await $generateWalletRef();
      const address = await getWalletJwkToAddress(walletRef);
      const balance = await getWalletBalance(address);
      const lastTransactionId = await getWalletLastTransactionID(address);
      const transactionRef = await $createTransactionRef({
        data: '<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body></body></html>',
      }, walletRef);
      const taggedTransactionRef = await $createTaggedTransactionRef({
        data: '<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body></body></html>',
      }, walletRef, { "Content-Type": "text/html" });
      const valueTransactionRef = await $createTransactionRef({
        target: '1seRanklLU_1VTGkEk7P0xAwMJfA7owA1JHW5KyZKlY',
        quantity: await arToWinston('10.5'),
      }, walletRef);

      await signTransaction(taggedTransactionRef, walletRef);
      const response = await postTransaction(taggedTransactionRef);

      const [txid] = await arql({ op: "equals", expr1: "from", expr2: address });

      console.warn({ txid });

      setHtml(await getTransactionData(
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
