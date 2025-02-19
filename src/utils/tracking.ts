import { customAlphabet } from 'nanoid';

// Create a custom nanoid generator with only uppercase letters and numbers
const generateId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 12);

export function generateTrackingNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Format: TRK-YYMMDD-XXXXXXXXXXXX (where X is random)
  return `TRK-${year}${month}${day}-${generateId()}`;
} 