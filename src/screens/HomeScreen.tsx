import { useNavigation } from "@react-navigation/native";
import { View } from "react-native";
import { Text, Button } from "react-native-paper";
import style from "../../styles/default.old";



export default function HomeScreen() {
  const navigation : Navigation = useNavigation();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {/* <Text>Home Screen</Text> */}
      <Text variant="displayMedium">Home</Text>
      <Button mode="contained" style={style.primaryButton} onPress={() => navigation.navigate("Register")}> Register </Button>
      <Button mode="contained" onPress={() => navigation.navigate("Login")}> Login </Button>

    </View>
  );
}
