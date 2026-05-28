import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  TextInput,
  Button,
  SegmentedButtons,
  Card,
  Menu,
  TouchableRipple,
} from "react-native-paper";
import { AppText as Text } from "../components/AppText";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import api from "../services/api";
//import { pick, keepLocalCopy } from "@react-native-documents/picker"; // https://medium.com/@paramasivam3448/migrating-from-react-native-document-picker-to-react-native-documents-picker-a-complete-guide-6cbd33266816
//import * as DocumentPicker from "expo-document-picker"; // https://medium.com/@olusanyajolaoluwa/simplifying-document-management-with-expo-document-picker-in-react-native-debc6060c3f3
import * as ImagePicker from 'expo-image-picker';
import FormData from 'form-data';
import { styles as globalStyles } from "../../styles/default";
import ImageService from "../services/ImageService";
import { ILibro, SellType } from "../models/Libro";

export default function AddBookScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const [autor, setAutor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [estadoMenuVisible, setEstadoMenuVisible] = useState(false);
  const [type, setType] = useState<SellType>("VENTA");
  const [precio, setPrecio] = useState("");
  const [estado, setEstado] = useState("");
  const [rentalStartDate, setRentalStartDate] = useState("");
  const [rentalEndDate, setRentalEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  // Al dar click en el boton de subida
  const handleAddBook = async () => {
    if (!isbn || !title || !precio || !estado) {
      Alert.alert(t("error"), t("err_missing_fields"));
      return;
    }

    setLoading(true);
    try {
      
      const bookData: ILibro = {
        isbn,
        title,
        autor,
        categoria,
        type,
        precio: parseFloat(precio),
        estado,
      };
      

      if (type === "ALQUILER") {
        bookData.rentalStartDate = new Date(rentalStartDate);
        bookData.rentalEndDate = new Date(rentalEndDate);
        if (!rentalStartDate || !rentalEndDate) {
          Alert.alert(
            t("error"),
            t("err_missing_dates") || "Faltan las fechas de alquiler",
          );
          setLoading(false);
          return;
        }
        if (bookData.rentalEndDate < bookData.rentalStartDate) {
          Alert.alert(
            t("error"),
            t("err_invalid_dates") ||
              "La fecha de fin no puede ser anterior a la de inicio",
          );
          setLoading(false);
          return;
        }
        // bookData.rentalStartDate = new Date(rentalStartDate);
        // bookData.rentalEndDate = new Date(rentalEndDate);
      }
      //Alert.alert('Adding book',JSON.stringify(bookData));
      const response = await api.post("/libros", bookData);

      if (response.status === 201) {
        Alert.alert(t("success"), t("msg_add_success"));
        navigation.goBack();
      }
      if(response.data.status === 401) Alert.alert('Adding book', response.data.message);
    } catch (error: any) {
      console.error("Error adding book:", error);
      Alert.alert(t("error"), t("msg_add_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            {t("add_book_title")}
          </Text>

          <TextInput
            label={t("isbn_label")}
            value={isbn}
            onChangeText={setIsbn}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label={t("title_label")}
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label={t("author_label")}
            value={autor}
            onChangeText={setAutor}
            style={styles.input}
            mode="outlined"
          />

          <Button
            icon="camera"
            mode="elevated"
            onPress={async () => {
              try {
                // const result = await DocumentPicker.getDocumentAsync({
                //   multiple: false, // Disallows the user to select any file
                //   type: ["image/jpeg", "image/png"],
                // });
                // if (!result.canceled) {
                //   const successResult =
                //     result as DocumentPicker.DocumentPickerSuccessResult;
                    
                //   Alert.alert(
                //     "Image Selector",
                //     `You have selected: ${JSON.stringify(result.assets[0].)}`,
                //   );
                //   // const formData : FormData = new FormData();
                //   // formData.append('file', result.assets[0].file!);
                //   // const url = await ImageService.upload(formData);
                //   // setImageUrl(url!);
                // }
                
                
                const url = await ImageService.uploadOnAndroid(); // todo refactorizado :)
                setImageUrl(url!);
              } catch (error) {
                Alert.alert(
                  "Image Selector",
                  `Error selecting a image: ${error}`,
                );
              }
            }}
          >
            Subir foto
          </Button>

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableRipple onPress={() => setMenuVisible(true)}>
                <View pointerEvents="none">
                  <TextInput
                    label="Categoría"
                    value={categoria}
                    style={styles.input}
                    mode="outlined"
                    right={<TextInput.Icon icon="menu-down" />}
                  />
                </View>
              </TouchableRipple>
            }
          >
            {[
              "Terror",
              "Misterio",
              "Aventura",
              "Juvenil",
              "Policíaco",
              "Infantil",
              "Autoayuda",
              "Novela",
              "Biografías",
              "Cómics",
              "Otros",
            ].map((cat) => (
              <Menu.Item
                key={cat}
                onPress={() => {
                  setCategoria(cat);
                  setMenuVisible(false);
                }}
                title={cat}
              />
            ))}
          </Menu>

          <Text style={styles.label}>{t("type_label")}:</Text>
          <SegmentedButtons
            value={type}
            onValueChange={setType}
            buttons={[
              { value: "VENTA", label: t("buy_action") },
              { value: "ALQUILER", label: t("rent_action") },
            ]}
            style={styles.segmented}
          />

          <TextInput
            label={t("price_label")}
            value={precio}
            onChangeText={setPrecio}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />

          <Menu
            visible={estadoMenuVisible}
            onDismiss={() => setEstadoMenuVisible(false)}
            anchor={
              <TouchableRipple onPress={() => setEstadoMenuVisible(true)}>
                <View pointerEvents="none">
                  <TextInput
                    label={t("state_label")}
                    value={estado}
                    style={styles.input}
                    mode="outlined"
                    right={<TextInput.Icon icon="menu-down" />}
                  />
                </View>
              </TouchableRipple>
            }
          >
            {[
              "Nuevo",
              "Como nuevo",
              "Bien",
              "Aceptable",
              "Usado",
              "Usado con marcas",
            ].map((est) => (
              <Menu.Item
                key={est}
                onPress={() => {
                  setEstado(est);
                  setEstadoMenuVisible(false);
                }}
                title={est}
              />
            ))}
          </Menu>

          {type === "ALQUILER" && (
            <>
              <TextInput
                label={t("rental_start_label")}
                value={rentalStartDate}
                onChangeText={setRentalStartDate}
                style={styles.input}
                mode="outlined"
                placeholder="YYYY-MM-DD"
              />
              <TextInput
                label={t("rental_end_label")}
                value={rentalEndDate}
                onChangeText={setRentalEndDate}
                style={styles.input}
                mode="outlined"
                placeholder="YYYY-MM-DD"
              />
            </>
          )}

          <Button
            mode="contained"
            onPress={handleAddBook}
            loading={loading}
            style={styles.button}
            buttonColor="#D183BA"
          >
            {t("btn_submit_now")}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F5EBF4",
  },
  card: {
    padding: 8,
    marginTop: 10,
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  input: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  segmented: {
    marginBottom: 16,
  },
  button: {
    marginTop: 10,
  },
});
