import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { Text, View } from '@/components/Themed';
import { Platform } from 'react-native';

const AccordionItem = ({ title, content }: { title: string; content: string }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View>
      <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Ionicons name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color="#276749" />
      </TouchableOpacity>
      {expanded && <Text style={styles.accordionContent}>{content}</Text>}
    </View>
  );
};

const SectionHeader = ({ title }: { title: string }) => {
  return (
    <Text style={styles.sectionHeader}>{title}</Text>
  );
};

export default function ModalScreen() {
  return (
    <ScrollView style={styles.container}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      <Text style={styles.title}>Help & Support</Text>
      
      <SectionHeader title="Feature Highlights" />
      <AccordionItem
        title="Barcode Scanning"
        content="Quickly scan product barcodes to access nutritional details and keep track of your dietary intake by saving items to your favorites."
      />
      <AccordionItem
        title="Nutritional Breakdown"
        content="Understand the significance of nutritional content, such as sodium, sugars, and fats, and how they affect the food product's healthiness."
      />
      <AccordionItem
         title="Favorites List"
        content="Create a list of your preferred items for quick access to their nutritional information."
      />

      <SectionHeader title="General Problems" />
      <AccordionItem
        title="The scanner doesn't work"
        content="Check your internet connectivity to make sure you have a reliable Wi-Fi, 3G, or 4G connection.If the issue persists, try restarting your phone, or uninstalling and reinstalling the NutriScan app."
      />
      <AccordionItem
        title="The product has no barcode"
        content="For products without a barcode, use the search feature to find the item manually."
      />
      
      <SectionHeader title="About NutriScan" />
      <AccordionItem
        title="What is NutriScan's mission?"
        content="NutriScan's mission is to make nutritional knowledge accessible and comprehensible, allowing everyone to make informed decisions about their dietary choices."
      />
      <AccordionItem
        title="How are the products rated?"
        content={`We assess food products based on multiple health and wellness criteria:

        1. Nutritional Value: Our evaluation is based on an in-depth analysis that accounts for calories, sodium, sugars, salts, fats, proteins, and fibers. We aim to highlight the strengths and potential concerns in every food item's nutritional profile.
        
        2. Additive Watch: Nutriscan reviews the additives in each food product-ranging dyes and preservatives to sweeteners—categorizing them into high and moderate risk levels.
                
        3. Allergen Check: NutriScan identifies and flags common allergens, assisting those with specific dietary restrictions to make safe choices.`}
              />      
      { 
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 20,
    textAlign: 'center',
    color: '#5bb450', // green color for the main title
  },
  sectionHeader: {
    fontWeight: 'bold',
    paddingVertical: 10,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#2e78b7', // blue for section headers
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#cccccc',
  },
  accordionTitle: {
    fontWeight: 'bold',
    color: 'skyblue', // color for the dropdown titles
  },
  accordionContent: {
    padding: 20,
    color: '#2e78b7', // same color as  header for the dropdown content
  },
});
