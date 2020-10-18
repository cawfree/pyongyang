import React, { useEffect, useState } from "react";
import Pyongyang, { pyongyang } from "pyongyang";
import { WebView } from "react-native-webview";

function Arweave() {
  const [html, setHtml] = useState("");
  const { loading, futures } = pyongyang(`
    const arweave = Arweave.init();
    const data = await arweave.transactions.getData($transactionId, {decode: true, string: true});
    $setHtml(data);
  `, {
    variables: {
      transactionId: "bNbA3TEQVL60xlgCcqdz4ZPHFZ711cZ3hmkpGttDt_U",
    },
    callbacks: {
      setHtml,
    },
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

export default () => <Pyongyang><Arweave /></Pyongyang>;
