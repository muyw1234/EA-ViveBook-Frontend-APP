import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { styles as globalStyles } from "../../styles/default";

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={['#F5E4F0', '#F5E4F0']}
      style={globalStyles.gradient}
    >
      <View style={globalStyles.card}>
        <Text variant="displaySmall" style={[globalStyles.title, { marginBottom: 10 }]}>ViveBook</Text>
        <Text variant="bodyLarge" style={globalStyles.subtitle}>
          Tu plataforma favorita para libros y eventos literarios.
        </Text>

        <Button 
          mode="contained" 
          style={[globalStyles.button, { backgroundColor: '#D183BA' }]} 
          onPress={() => navigation.navigate("Register" as never)}
        > 
          Crear Cuenta 
        </Button>

        <Button 
          mode="contained" 
          style={[globalStyles.button, { marginTop: 15, backgroundColor: '#D183BA' }]} 
          onPress={() => navigation.navigate("Login" as never)}
        > 
          Iniciar Sesión 
        </Button>
      </View>
    </LinearGradient>
  );
}
