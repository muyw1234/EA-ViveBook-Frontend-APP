import React from 'react';
import { View, Button, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../services/i18n';

export default function AccessibilityMenu() {
  const { t } = useTranslation();

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>
        {t('accessibility_settings')}
      </Text>
      
      <Text style={{ marginBottom: 10 }}>{t('lang_label')}</Text>
      
      <Button title="Español" onPress={() => changeLanguage('es')} />
      <Button title="Català" onPress={() => changeLanguage('ca')} />
      <Button title="English" onPress={() => changeLanguage('en')} />
    </View>
  );
}