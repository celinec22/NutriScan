import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';


export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  // updates the state
  const handleSearch = (text: string): void => {
    setSearchQuery(text);
    // placeholder for showing results container
    setShowResults(text.length > 0);
  };

  return (
    <View style={styles.container}>
     <Text style={styles.header}>Search</Text>
      <View style={styles.searchBox}>
      <Ionicons name="search" size={20} color="grey" />
        <TextInput
          style={styles.input}
          onChangeText={handleSearch}
          value={searchQuery}
          placeholder="Search for any product"
        />
      </View>
      {/* where  search results will be displayed */}
      {showResults && (
        <View style={styles.resultsContainer}>
          {/* render  search results here */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 30, 
  },

  header: { 
    fontSize: 26,
    fontWeight: 'bold',
    color: '#5bb450',
    padding: 10,
    paddingLeft: 20,
  },

  searchBox: {
    flexDirection: 'row',
    margin: 15,
    padding: 10,
    borderRadius: 25, 
    backgroundColor: 'white',
    alignItems: 'center',

  },
  input: {
    flex: 1, // takes up remaining space in the search box
    paddingHorizontal: 10,
    fontSize: 18,
  },
  resultsContainer: {
    marginTop: 20,
    // styles for  results container
  },
});



