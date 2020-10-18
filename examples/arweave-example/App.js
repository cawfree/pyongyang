import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview-modal";
import Pyongyang, { pyongyang } from "pyongyang";

function Arweave() {
  const [html, setHtml] = useState("");
  const { loading, error, futures } = pyongyang(`
    const arweave = Arweave.init();
    const data = await arweave.transactions.getData($transactionId, {decode: true, string: true});
    $setHtml(data);
    return {};
  `, {
    variables: {
      transactionId: "bNbA3TEQVL60xlgCcqdz4ZPHFZ711cZ3hmkpGttDt_U",
    },
    callbacks: { setHtml },
    resources: ["https://unpkg.com/arweave/bundles/web.bundle.js"],
  });
  return (
    <WebView
      originWhiteList={["*"]}
      source={{
        html,
      }}
    />
  );
  return null;
}

export default () => (
  <Pyongyang>
    <View style={StyleSheet.absoluteFill}>
      <Arweave />
    </View>
  </Pyongyang>
);
