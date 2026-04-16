import { TabActions } from "@react-navigation/native";
import { View} from "react-native";
import { Text } from "react-native-paper";

// De momento no es visible
// Esto tendria que ser un formulario de login
// export default function LoginScreen() {
//   return (
//     <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
//       <Text variant="displayMedium">Login</Text>
//     </View>
//   );
// }

// redirigir directamente a las pestañas autenticadas. La version final tendriamos una pantalla de Login decente para acceder a las pestañas y al perfil después de autenticar.

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import ProfileScreen from "./ProfileScreen";
import SettingsScreen from "./SettingsScreen";
import style from "../../styles/default.old"
import Ionicons from '@react-native-vector-icons/ionicons';
import HomeScreen from "./HomeScreen";
const Tab = createBottomTabNavigator();
export default function LoginScreen()
{
  return (
    <Tab.Navigator initialRouteName="Profile" screenOptions={{
      tabBarActiveTintColor: "	#000080", // azul marino, como la tinta
      sceneStyle: style.screen
    }}>
      {/* <Tab.Screen name="Home" component={HomeScreen}/> */}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{
        tabBarIcon: ({color}) => <Ionicons name="person" size={20} color={color}/>}}/>
      <Tab.Screen name="Settings" component={SettingsScreen}/>
    </Tab.Navigator>
  )
}