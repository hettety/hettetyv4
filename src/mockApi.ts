import { Property, UserProfile, Purchase } from './types';

// No seed/demo data — the app runs entirely on real Firestore data.
const MOCK_PROPERTIES: Property[] = [];

let usersTable: UserProfile[] = [];

let purchasesTable: Purchase[] = [];

export const api = {
  getProperties: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, data: MOCK_PROPERTIES };
  },
  addProperty: async (property: Omit<Property, 'id'>) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newProperty = { ...property, id: Math.random().toString(36).substring(7) };
    MOCK_PROPERTIES.push(newProperty);
    return { success: true, data: newProperty };
  },
  getProfile: async (userEmail?: string | null) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find user by email
    let user = usersTable.find(u => u.email === userEmail);
    
    if (!user) {
      if (userEmail === 'abdallahahmedpilot2426@gmail.com') {
        user = usersTable[0];
      } else if (userEmail) {
        // Create a temporary user if not found in mock DB
        user = {
          id: `u${Math.random().toString(36).substring(7)}`,
          name: userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1),
          email: userEmail,
          phone: '',
          preferences: ''
        };
        usersTable.push(user);
      } else {
        // Default to first user if no email provided (for demo)
        user = usersTable[0];
      }
    }

    // SQL JOIN simulation: SELECT * FROM purchases JOIN properties ON purchases.propertyId = properties.id WHERE userId = user.id
    // For mock purposes, we'll just return all purchases for now, or filter if we had user IDs on purchases
    const purchases = purchasesTable.map(p => ({
      ...p,
      property: MOCK_PROPERTIES.find(prop => prop.id === p.propertyId)
    }));
    return { success: true, data: { user, purchases } };
  },
  updateProfile: async (updates: Partial<UserProfile>) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    usersTable[0] = { ...usersTable[0], ...updates };
    return { success: true, data: usersTable[0] };
  },
  purchaseProperty: async (propertyId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newPurchase: Purchase = {
      id: `p${Math.random().toString().slice(2, 8)}`,
      propertyId,
      purchaseDate: new Date().toISOString().split('T')[0],
      status: 'Processing'
    };
    purchasesTable.push(newPurchase);
    return { success: true, data: newPurchase };
  },
  chat: async (text: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, data: "Based on your preferences, I recommend looking at properties in New Cairo. Would you like to see some listings?" };
  },
  uploadDocument: async (name: string, type: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, data: { isValid: true } };
  },
  saveConsent: async (preferences: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Consent saved to backend:", preferences);
    return { success: true };
  }
};
