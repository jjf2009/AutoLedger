import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BillItem } from '../types';
import { BigButton } from '../components/BigButton';
import { ItemRow } from '../components/ItemRow';
import { printReceipt } from '../services/printer';
import { saveToSheet } from '../services/sheets';

export default function AutoLedgerScreen() {
  const [bikeNumber, setBikeNumber] = useState('');
  const [items, setItems] = useState<BillItem[]>([
    { id: Date.now().toString(), name: '', price: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      return sum + price;
    }, 0);
  }, [items]);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', price: '' }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return; // Keep at least one row
    setItems(items.filter(item => item.id !== id));
  };

  const handleChangeName = (id: string, name: string) => {
    setItems(items.map(item => item.id === id ? { ...item, name } : item));
  };

  const handleChangePrice = (id: string, price: string) => {
    setItems(items.map(item => item.id === id ? { ...item, price } : item));
  };

  const handlePrintAndSave = async () => {
    if (!bikeNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter a Bike Number');
      return;
    }

    const validItems = items.filter(i => i.name.trim() !== '' || i.price.trim() !== '');
    if (validItems.length === 0) {
      Alert.alert('Validation Error', 'Please enter at least one item');
      return;
    }

    setIsSubmitting(true);
    try {
      // Print first as it's the core utility
      await printReceipt(bikeNumber, validItems, total);
      
      // Attempt to save to sheets
      if (process.env.EXPO_PUBLIC_SHEET_URL) {
        await saveToSheet(bikeNumber, validItems, total);
      } else {
        console.warn("Skipping sheet save: EXPO_PUBLIC_SHEET_URL not set");
      }
      
      // Reset form
      setBikeNumber('');
      setItems([{ id: Date.now().toString(), name: '', price: '' }]);
      
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-900" edges={['bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1 px-4 py-2" keyboardShouldPersistTaps="handled">
          
          <View className="mb-6">
            <Text className="text-neutral-400 font-bold mb-2 uppercase tracking-widest">Bike Number</Text>
            <TextInput
              className="bg-neutral-800 text-white text-2xl font-bold h-16 rounded-xl px-4"
              placeholder="e.g. MH12 AB 1234"
              placeholderTextColor="#666"
              value={bikeNumber}
              onChangeText={setBikeNumber}
              autoCapitalize="characters"
            />
          </View>

          <View className="mb-2 flex-row justify-between items-end">
            <Text className="text-neutral-400 font-bold uppercase tracking-widest">Parts & Labor</Text>
          </View>

          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onChangeName={handleChangeName}
              onChangePrice={handleChangePrice}
              onRemove={handleRemoveItem}
            />
          ))}

          <BigButton 
            title="+ Add Item" 
            onPress={handleAddItem} 
            color="secondary" 
          />
          
          <View className="h-32" /> 
        </ScrollView>

        <View className="p-4 bg-neutral-900 border-t border-neutral-800 pb-8">
          <View className="flex-row justify-between items-center mb-4 px-2">
            <Text className="text-neutral-400 text-xl font-bold uppercase">Total</Text>
            <Text className="text-green-500 text-4xl font-bold">${total.toFixed(2)}</Text>
          </View>
          
          <BigButton 
            title="Print & Save" 
            onPress={handlePrintAndSave} 
            loading={isSubmitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
