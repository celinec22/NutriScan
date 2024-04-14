import { Alert, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import scanner from '@/app/(tabs)'


const FoodScanningApp = () => {
  const [favorites, setFavorites] = useState([]);
  const [scannedFood, setScannedFood] = useState('');

  // Load favorites from AsyncStorage on component mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem('userFavorites');
        if (storedFavorites !== null) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };

    loadFavorites();
  }, []);

  // Save favorites to AsyncStorage
  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem('userFavorites', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const handleAddFavorite = async () => {
    if (!scannedFood) {
      Alert.alert('Error', 'Please scan a food item first.');
      return;
    }

    // Check if the scanned food item is already a favorite
    if (favorites.includes(scannedData)) {
      Alert.alert('Info', 'This food item is already in favorites.');
      return;
    }

    const newFavorites = [...favorites, scannedFood];
    await saveFavorites(newFavorites);
    setScannedFood(''); // Clear scanned food after saving to favorites
  };

};


  export default function FavoritesScreen() {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Favorites</Text>
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
        <EditScreenInfo path="app/(tabs)/favorites.tsx" />
      </View>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
