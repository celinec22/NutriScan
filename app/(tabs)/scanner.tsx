import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, Button } from "react-native";
import { CameraView, Camera } from "expo-camera/next";

export default function App() {
  // State variables to manage camera permission and scanned status
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState<boolean>(false);

  // UseEffect hook to request camera permissions when component mounts
  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  // Function to handle barcode scanning
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    alert(`Bar code with type ${type} and data ${data} has been scanned!`);
  };

  // If camera permission is still being requested, display a message
  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  // If camera permission is denied, display a message
  if (!hasPermission) {
    return <Text>No access to camera</Text>;
  }

  // Render camera view and a button to trigger barcode scanning again
  return (
    <View style={styles.container}>
      {/* CameraView component to display camera feed and handle barcode scanning */}
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["upc_a"], // Specify only "upc_a" barcode type
        }}
        style={StyleSheet.absoluteFillObject} // Take up full screen
      />
      {/* Button to allow user to trigger barcode scanning again */}
      {scanned && (
        <Button title={"Tap to Scan Again"} onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

// Stylesheet for the component
const styles = StyleSheet.create({
  container: {
    flex: 1, // Take up entire screen
    flexDirection: "column", // Arrange children vertically
    justifyContent: "center", // Center children vertically
  },
});
