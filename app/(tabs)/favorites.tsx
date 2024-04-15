import React from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { Text } from '@/components/Themed';

export default function FavoritesScreen({ favsList }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favorites</Text>
      <View style={styles.favoritesContainer}>
        <FlatList
          data={favsList}
          renderItem={({ item }) => <Text>{item}</Text>}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', // Adjusted to start from the top
    paddingTop: 30, // Added padding top for spacing
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20, // Added margin bottom for spacing
  },
  favoritesContainer: {
    flex: 1, // Fill remaining space
    width: '100%', // Take full width
    paddingHorizontal: 20, // Add horizontal padding for content spacing
    backgroundColor: '#fff', // Set background color
    borderTopLeftRadius: 20, // Add border radius for top corners
    borderTopRightRadius: 20,
    elevation: 3, // Add elevation for shadow (Android)
    shadowColor: '#000', // Add shadow color
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
