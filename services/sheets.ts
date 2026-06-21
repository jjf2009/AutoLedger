import { BillItem } from '../types';

export const saveToSheet = async (bikeNumber: string, items: BillItem[], total: number) => {
  const url = process.env.EXPO_PUBLIC_SHEET_URL;
  if (!url) {
    throw new Error("Missing Google Sheets URL in environment variables");
  }

  const payload = {
    timestamp: new Date().toISOString(),
    bikeNumber,
    items: JSON.stringify(items),
    total
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Failed to save to sheet');
  }

  return response;
};
