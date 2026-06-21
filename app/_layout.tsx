import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#121212',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#121212',
          }
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'AutoLedger',
            headerLargeTitle: true,
          }} 
        />
      </Stack>
    </>
  );
}
