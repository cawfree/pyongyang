import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview-modal";

import Pyongyang, { pyongyang } from "pyongyang";

function Arweave() {
  const [html, setHtml] = useState("");
  const { loading, error, futures: { getData } } = pyongyang(`
    const { transactions } = Arweave.init();
    return transactions;
  `, { resources: ["https://unpkg.com/arweave/bundles/web.bundle.js"] });
  useEffect(() => {
    !!getData && (async () => {
      setHtml(await getData(
        "bNbA3TEQVL60xlgCcqdz4ZPHFZ711cZ3hmkpGttDt_U",
        { decode: true, string: true },
      ));
    })();
  }, [getData, setHtml]);
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
