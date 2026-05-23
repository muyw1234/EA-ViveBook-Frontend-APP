import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../services/i18n';
import { Switch, Button, Card, Divider } from 'react-native-paper';
import { useAccessibility } from '../context/AccessibilityContext';
import { AppText as Text } from '../components/AppText'; 

export default function SettingsScreen() {
    const { t, i18n } = useTranslation();
    const { isFocusModeEnabled, toggleFocusMode } = useAccessibility();

    // Helper to see which language is currently active
    const currentLanguage = i18n.language;

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.header}>
                {t('accessibility_settings')}
            </Text>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionLabel}>
                        {t('lang_label')}
                    </Text>
                    <Divider style={styles.divider} />
                    
                    <View style={styles.buttonContainer}>
                        <Button 
                            mode={currentLanguage === 'es' ? "contained" : "outlined"} 
                            onPress={() => changeLanguage('es')}
                            style={styles.langButton}
                            buttonColor={currentLanguage === 'es' ? "#D183BA" : undefined}
                            textColor={currentLanguage === 'es' ? "#fff" : "#D183BA"}
                        >
                            Español
                        </Button>

                        <Button 
                            mode={currentLanguage === 'ca' ? "contained" : "outlined"} 
                            onPress={() => changeLanguage('ca')}
                            style={styles.langButton}
                            buttonColor={currentLanguage === 'ca' ? "#D183BA" : undefined}
                            textColor={currentLanguage === 'ca' ? "#fff" : "#D183BA"}
                        >
                            Català
                        </Button>

                        <Button 
                            mode={currentLanguage === 'en' ? "contained" : "outlined"} 
                            onPress={() => changeLanguage('en')}
                            style={styles.langButton}
                            buttonColor={currentLanguage === 'en' ? "#D183BA" : undefined}
                            textColor={currentLanguage === 'en' ? "#fff" : "#D183BA"}
                        >
                            English
                        </Button>
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.switchRow}>
                        <View style={{ flex: 1, paddingRight: 15 }}>
                            <Text variant="titleMedium" style={styles.sectionLabel}>
                                {t('focus_mode_title')}
                            </Text>
                            <Text variant="bodySmall" style={{ color: '#666' }}>
                                {t('focus_mode_desc')}
                            </Text>
                        </View>
                        <Switch 
                            value={isFocusModeEnabled} 
                            onValueChange={toggleFocusMode} 
                            color="#D183BA" 
                        />
                    </View>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#F5EBF4',
    },
    header: {
        marginBottom: 20,
        fontWeight: 'bold',
        color: '#D6AED2',
    },
    card: {
        padding: 8,
        backgroundColor: '#ffffff',
    },
    sectionLabel: {
        fontWeight: '600',
        marginBottom: 8,
    },
    divider: {
        marginBottom: 16,
    },
    buttonContainer: {
        gap: 10, // Adds clean spacing between the buttons vertically
    },
    langButton: {
        borderRadius: 8,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    }
});