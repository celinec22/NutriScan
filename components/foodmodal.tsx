import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, Modal, Image } from "react-native";

interface Props {
  visible: boolean;
  scannedData: { type: string; data: string } | null;
  onClose: () => void;
}

const BarcodeModal: React.FC<Props> = ({ visible, scannedData, onClose }) => {
  const [productData, setProductData] = useState<{ title: string; image: string } | null>(
    null
  );

  useEffect(() => {
    if (scannedData) {
      fetchProductData(scannedData.data);
    }
  }, [scannedData]);

  const fetchProductData = async (barcode: string) => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();
      if (data.product) {
        const title = data.product.product_name || "Product Name Not Available";
        const image = data.product.image_url || "";
        setProductData({ title, image });
      } else {
        setProductData(null);
      }
    } catch (error) {
      console.error("Error fetching product data:", error);
      setProductData(null);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {productData ? (
            <>
              <Text style={styles.productTitle}>{productData.title}</Text>
              {productData.image ? (
                <Image source={{ uri: productData.image }} style={styles.productImage} />
              ) : (
                <Text>No Image Available</Text>
              )}
            </>
          ) : (
            <Text>Loading...</Text>
          )}
          <Button title="Close Modal" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: "center",
    minHeight: 700, // Set a minimum height for the modal content
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  productImage: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
});

export default BarcodeModal;
