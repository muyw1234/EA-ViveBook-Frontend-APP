import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  es: {
    translation: {
      // General
      error: "Error",
      success: "Éxito",
      loading: "Cargando...",
      save: "Guardar",
      cancel: "Cancelar",
      close: "Cerrar",
      back: "Volver",
      logout: "Cerrar Sesión",
      retry: "Reintentar",
      edit: "Editar",
      save_changes: "Guardar Cambios",
      // AddBookScreen
      add_book_title: "Subir Nuevo Libro",
      isbn_label: "ISBN",
      title_label: "Título",
      type_label: "Tipo",
      price_label: "Precio",
      state_label: "Estado",
      btn_submit_now: "Subir ahora",
      err_missing_fields: "Todos los campos son obligatorios",
      msg_add_success: "Libro subido correctamente",
      msg_add_error: "No se pudo subir el libro",
      edit_book_title: "Editar Libro",
      rental_start_label: "Fecha de inicio del alquiler",
      rental_end_label: "Fecha de fin del alquiler",
      // Books Rent / Sale
      rent_header: "Libros en Alquiler",
      sale_header: "Libros en Venta",
      no_books: "No hay libros disponibles en este momento.",
      rent_action: "Alquilar",
      buy_action: "Comprar",
      //Chat
      chat_header: "Chat",
      chat_placeholder: "Escribe tu mensaje...",
      chat_open_message: "Toca para abrir el chat",
      chat_empty: "No tienes chats activos",
      chat_error_load: "No se han podido cargar los mensajes",
      chat_error_fetch: "Error al obtener los chats",
      // Dashboard
      dash_header: "Inicio",
      dash_sales_title: "Libros en venta",
      dash_sales_desc: "Explora el catálogo de libros a la venta.",
      dash_sales_btn: "Ver libros a la venta",
      dash_rent_title: "Libros disponibles para alquilar",
      dash_rent_desc: "Encuentra libros para alquilar por tiempo limitado.",
      dash_rent_btn: "Ver libros para alquilar",
      dash_add_title: "Subir libro",
      dash_add_desc: "Añade un libro para vender o alquilar.",
      dash_add_btn: "Subir ahora",
      // HomeScreen
      welcome: "ViveBook",
      welcome_subtitle: "Tu plataforma favorita para libros y eventos literarios.",
      btn_create_account: "Crear Cuenta",
      btn_login: "Iniciar Sesión",
      // LoginScreen
      login_title: "ViveBook",
      login_subtitle: "Inicia sesión para continuar",
      email_label: "Email",
      password_label: "Contraseña",
      btn_enter: "Entrar",
      no_account_link: "¿No tienes cuenta? Regístrate",
      already_have_account_link: "¿Ya tienes cuenta? Inicia sesión",
      err_credentials: "Por favor, introduce tus credenciales",
      err_login_failed: "Email o contraseña incorrectos",
      // RegisterScreen
      register_title: "Registro",
      register_subtitle: "Crea tu cuenta en ViveBook",
      name_label: "Nombre Completo",
      confirm_email_label: "Confirmar Email",
      confirm_password_label: "Confirmar Contraseña",
      err_missing_reg: "Por favor, rellena todos los campos",
      err_emails_dont_match: "Los correos electrónicos no coinciden",
      err_passwords_dont_match: "Las contraseñas no coinciden",
      err_reg_problem: "Hubo un problema al registrarte",
      msg_reg_success: "Usuario registrado correctamente",
      // ProfileScreen
      profile_title: "Editar Perfil",
      profile_err_loading: "No se pudo cargar el perfil",
      profile_err_fields: "El nombre y el email son obligatorios",
      profile_success_update: "Perfil actualizado correctamente",
      profile_err_update: "No se pudo actualizar el perfil",
      profile_name_label: "Nombre:",
      profile_email_label: "Email:",
      profile_edit_btn: "Editar",
      // Accessibility Menu
      accessibility_settings: "Ajustes de Accesibilidad",
      high_contrast: "Alto Contraste",
      lang_label: "Idioma / Language",
      my_books: "Mis Libros",
      uploaded: "Subidos",
      bought: "Comprados",
      rented: "Alquilados",
      talk_to_seller: "Hablar con el vendedor",
      buy_directly: "Comprar directamente",
      rent_directly: "Alquilar directamente",
      about_me_label: "Sobre mí",
      uploaded_by: "Subido por: ",
      view_profile: "Ver perfil",
      rating_title: "Valorar vendedor",
      rating_label: "Puntuación",
      rating_comment_placeholder: "Escribe un comentario sobre tu experiencia...",
      rating_success: "Valoración enviada correctamente",
      rating_error: "No se pudo enviar la valoración",
      reviews_header: "Valoraciones recibidas",
      no_reviews: "Aún no tiene valoraciones",
      avg_rating: "Valoración media",
      btn_publish: "Publicar"
    }
  },
  ca: {
    translation: {
      // General
      error: "Error",
      success: "Èxit",
      loading: "Carregant...",
      save: "Guardar",
      cancel: "Cancel·lar",
      close: "Tancar",
      back: "Tornar",
      logout: "Tancar Sessió",
      retry: "Reintentar",
      edit: "Editar",
      save_changes: "Guardar Canvis",
      // AddBookScreen
      add_book_title: "Penjar Nou Llibre",
      isbn_label: "ISBN",
      title_label: "Títol",
      type_label: "Tipus",
      price_label: "Preu",
      state_label: "Estat",
      btn_submit_now: "Penjar ara",
      err_missing_fields: "Tots els camps són obligatoris",
      msg_add_success: "Llibre penjat correctament",
      msg_add_error: "No s'ha pogut penjar el llibre",
      edit_book_title: "Editar Llibre",
      rental_start_label: "Data d'inici del lloguer",
      rental_end_label: "Data de fi del lloguer",
      // Books Rent / Sale
      rent_header: "Llibres en Lloguer",
      sale_header: "Llibres a la Venda",
      no_books: "No hi ha llibres disponibles en aquest moment.",
      rent_action: "Llogar",
      buy_action: "Comprar",
      //Chat
        chat_header: "Xat",
        chat_placeholder: "Escriu el teu missatge...",
        chat_open_message: "Tocar per obrir el xat",
        chat_empty: "No tens xats actius",
        chat_error_load: "No s'han pogut cargar los mensajes",
        chat_error_fetch: "Error fetching chats",
      // Dashboard
      dash_header: "Inici",
      dash_sales_title: "Llibres a la venda",
      dash_sales_desc: "Explora el catàleg de llibres a la venda.",
      dash_sales_btn: "Veure llibres a la venda",
      dash_rent_title: "Llibres disponibles per llogar",
      dash_rent_desc: "Troba llibres per llogar per temps limitat.",
      dash_rent_btn: "Veure llibres per llogar",
      dash_add_title: "Penjar llibre",
      dash_add_desc: "Afegeix un llibre per vendre o llogar.",
      dash_add_btn: "Penjar ara",
      // HomeScreen
      welcome: "ViveBook",
      welcome_subtitle: "La teva plataforma preferida per a llibres i esdeveniments literaris.",
      btn_create_account: "Crear Compte",
      btn_login: "Iniciar Sessió",
      // LoginScreen
      login_title: "ViveBook",
      login_subtitle: "Inicia sessió per continuar",
      email_label: "Email",
      password_label: "Contrasenya",
      btn_enter: "Entrar",
      no_account_link: "No tens compte? Registra't",
      already_have_account_link: "Ja tens compte? Inicia sessió",
      err_credentials: "Per favor, introdueix les teves credencials",
      err_login_failed: "Email o contrasenya incorrectes",
      // RegisterScreen
      register_title: "Registre",
      register_subtitle: "Crea el teu compte a ViveBook",
      name_label: "Nom Complet",
      confirm_email_label: "Confirmar Email",
      confirm_password_label: "Confirmar Contrasenya",
      err_missing_reg: "Per favor, emplena tots els camps",
      err_emails_dont_match: "Els correus electrònics no coincideixen",
      err_passwords_dont_match: "Les contrasenyes no coincideixen",
      err_reg_problem: "Hi va haver un problema en registrar-te",
      msg_reg_success: "Usuari registrat correctament",
      // ProfileScreen
      profile_title: "Editar Perfil",
      profile_err_loading: "No s'ha pogut carregar el perfil",
      profile_err_fields: "El nom i l'email són obligatoris",
      profile_success_update: "Perfil actualitzat correctament",
      profile_err_update: "No s'ha pogut actualitzar el perfil",
      profile_name_label: "Nom:",
      profile_email_label: "Email:",
      profile_edit_btn: "Editar",
      // Accessibility Menu
      accessibility_settings: "Ajustos d'Accessibilitat",
      high_contrast: "Alt Contrast",
      lang_label: "Idioma / Language",
      my_books: "Els meus llibres",
      uploaded: "Penjats",
      bought: "Comprats",
      rented: "Llogats",
      talk_to_seller: "Parlar amb el venedor",
      buy_directly: "Comprar directament",
      rent_directly: "Llogar directament",
      about_me_label: "Sobre mi",
      uploaded_by: "Penjat per: ",
      view_profile: "Veure perfil",
      rating_title: "Valorar venedor",
      rating_label: "Puntuació",
      rating_comment_placeholder: "Escriu un comentari sobre la teva experiència...",
      rating_success: "Valoració enviada correctament",
      rating_error: "No s'ha pogut enviar la valoració",
      reviews_header: "Valoracions rebudes",
      no_reviews: "Encara no té valoracions",
      avg_rating: "Valoració mitjana",
      btn_publish: "Publicar"
    }
  },
  en: {
    translation: {
      // General
      error: "Error",
      success: "Success",
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      back: "Back",
      logout: "Log Out",
      retry: "Retry",
      edit: "Edit",
      save_changes: "Save Changes",
      // AddBookScreen
      add_book_title: "Upload New Book",
      isbn_label: "ISBN",
      title_label: "Title",
      type_label: "Type",
      price_label: "Price",
      state_label: "Condition",
      btn_submit_now: "Upload now",
      err_missing_fields: "All fields are required",
      msg_add_success: "Book uploaded successfully",
      msg_add_error: "Could not upload the book",
      edit_book_title: "Edit Book",
      rental_start_label: "Rental start date",
      rental_end_label: "Rental end date",
      // Books Rent / Sale
      rent_header: "Books for Rent",
      sale_header: "Books for Sale",
      no_books: "There are no books available at this moment.",
      rent_action: "Rent",
      buy_action: "Buy",
      //Chat
      chat_header: "Chat",
      chat_placeholder: "Type your message...",
      chat_open_message: "Tap to open the chat",
      chat_empty: "You have no active chats",
      chat_error_load: "Could not load messages",
      chat_error_fetch: "Error fetching chats",
      // Dashboard
      dash_header: "Home",
      dash_sales_title: "Books for sale",
      dash_sales_desc: "Explore the catalog of books for sale.",
      dash_sales_btn: "View books for sale",
      dash_rent_title: "Books available for rent",
      dash_rent_desc: "Find books to rent for a limited time.",
      dash_rent_btn: "View books for rent",
      dash_add_title: "Upload book",
      dash_add_desc: "Add a book to sell or rent.",
      dash_add_btn: "Upload now",
      // HomeScreen
      welcome: "ViveBook",
      welcome_subtitle: "Your favorite platform for books and literary events.",
      btn_create_account: "Create Account",
      btn_login: "Log In",
      // LoginScreen
      login_title: "ViveBook",
      login_subtitle: "Log in to continue",
      email_label: "Email",
      password_label: "Password",
      btn_enter: "Enter",
      no_account_link: "Don't have an account? Sign up",
      already_have_account_link: "Already have an account? Log in",
      err_credentials: "Please enter your credentials",
      err_login_failed: "Incorrect email or password",
      // RegisterScreen
      register_title: "Register",
      register_subtitle: "Create your ViveBook account",
      name_label: "Full Name",
      confirm_email_label: "Confirm Email",
      confirm_password_label: "Confirm Password",
      err_missing_reg: "Please fill in all fields",
      err_emails_dont_match: "Emails do not match",
      err_passwords_dont_match: "Passwords do not match",
      err_reg_problem: "There was a problem registering you",
      msg_reg_success: "User registered successfully",
      // ProfileScreen
      profile_title: "Edit Profile",
      profile_err_loading: "Could not load profile",
      profile_err_fields: "Name and email are required",
      profile_success_update: "Profile updated successfully",
      profile_err_update: "Could not update profile",
      profile_name_label: "Name:",
      profile_email_label: "Email:",
      profile_edit_btn: "Edit",
      // Accessibility Menu
      accessibility_settings: "Accessibility Settings",
      high_contrast: "High Contrast",
      lang_label: "Idioma / Language",
      my_books: "My Books",
      uploaded: "Uploaded",
      bought: "Bought",
      rented: "Rented",
      talk_to_seller: "Talk to seller",
      buy_directly: "Buy directly",
      rent_directly: "Rent directly",
      about_me_label: "About me",
      uploaded_by: "Uploaded by: ",
      view_profile: "View profile",
      rating_title: "Rate Seller",
      rating_label: "Rating",
      rating_comment_placeholder: "Write a comment about your experience...",
      rating_success: "Rating submitted successfully",
      rating_error: "Could not submit rating",
      reviews_header: "Received Reviews",
      no_reviews: "No reviews yet",
      avg_rating: "Average Rating",
      btn_publish: "Publish"
    }
  }
};

const LANGUAGE_KEY = '@user_language';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        return callback(savedLanguage);
      }
      callback('es');
    } catch (error) {
      callback('es');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {}
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    compatibilityJSON: 'v4',
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  });

export const changeLanguage = async (lng: 'es' | 'ca' | 'en') => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    await i18n.changeLanguage(lng);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};
export default i18n;