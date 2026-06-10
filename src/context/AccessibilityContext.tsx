import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccessibilityContextType {
  isFocusModeEnabled: boolean;
  toggleFocusMode: (value: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  isFocusModeEnabled: false,
  toggleFocusMode: () => {},
});

export const useAccessibility = () => useContext(AccessibilityContext);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFocusModeEnabled, setIsFocusModeEnabled] = useState(false);

  useEffect(() => {
    // Load preference on startup
    const loadPref = async () => {
      try {
        const storedValue = await AsyncStorage.getItem('focusReadingMode');
        if (storedValue !== null) {
          setIsFocusModeEnabled(storedValue === 'true');
        }
      } catch (error) {
        console.error('Error loading focus reading preference:', error);
      }
    };
    loadPref();
  }, []);

  const toggleFocusMode = async (value: boolean) => {
    try {
      setIsFocusModeEnabled(value);
      await AsyncStorage.setItem('focusReadingMode', value.toString());
    } catch (error) {
      console.error('Error saving focus reading preference:', error);
    }
  };

  return (
    <AccessibilityContext.Provider value={{ isFocusModeEnabled, toggleFocusMode }}>
      {children}
    </AccessibilityContext.Provider>
  );
};
