import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface BigButtonProps {
  title: string;
  onPress: () => void;
  color?: 'primary' | 'danger' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}

export const BigButton: React.FC<BigButtonProps> = ({ 
  title, 
  onPress, 
  color = 'primary', 
  disabled = false,
  loading = false
}) => {
  let bgColorClass = 'bg-blue-600';
  if (color === 'danger') bgColorClass = 'bg-red-600';
  if (color === 'secondary') bgColorClass = 'bg-neutral-700';
  
  if (disabled) bgColorClass = 'bg-neutral-800 opacity-50';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${bgColorClass} h-16 rounded-xl justify-center items-center px-4 my-2 flex-row`}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <Text className="text-white font-bold text-xl uppercase tracking-wider">{title}</Text>
      )}
    </TouchableOpacity>
  );
};
