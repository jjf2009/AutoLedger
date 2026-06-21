import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { BillItem } from '../types';

interface ItemRowProps {
  item: BillItem;
  onChangeName: (id: string, name: string) => void;
  onChangePrice: (id: string, price: string) => void;
  onRemove: (id: string) => void;
}

export const ItemRow: React.FC<ItemRowProps> = ({ item, onChangeName, onChangePrice, onRemove }) => {
  return (
    <View className="flex-row items-center my-2 h-16 bg-neutral-800 rounded-xl px-2">
      <TextInput
        className="flex-1 h-full text-white text-lg px-2"
        placeholder="Part/Labor Name"
        placeholderTextColor="#666"
        value={item.name}
        onChangeText={(text) => onChangeName(item.id, text)}
      />
      <View className="w-1 h-8 bg-neutral-700 mx-2" />
      <TextInput
        className="w-24 h-full text-white text-lg px-2 text-right"
        placeholder="0.00"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={item.price}
        onChangeText={(text) => onChangePrice(item.id, text)}
      />
      <TouchableOpacity 
        className="h-12 w-12 bg-red-600/20 rounded-lg justify-center items-center ml-2"
        onPress={() => onRemove(item.id)}
      >
        <Text className="text-red-500 font-bold text-xl">X</Text>
      </TouchableOpacity>
    </View>
  );
};
