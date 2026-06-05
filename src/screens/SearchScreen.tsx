import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Text as RNText,
  Platform,
} from "react-native";
import {
  Searchbar,
  Card,
  Button,
  Avatar,
  Divider,
  IconButton,
  Portal,
  Modal,
  TextInput,
  Chip,
  useTheme,
  Menu,
} from "react-native-paper";
import { AppText as Text } from "../components/AppText";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SearchScreen({ route }: any) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const initialQuery = route?.params?.query || "";

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [bookResults, setBookResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [requestedBookIds, setRequestedBookIds] = useState<string[]>([]);

  const [isGridView, setIsGridView] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Draft Filters State (for modal)
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterType, setFilterType] = useState("");

  // Applied Filters State
  const [appliedCategoria, setAppliedCategoria] = useState("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState("");
  const [appliedType, setAppliedType] = useState("");

  // New Chat/Requests states
  const [userId, setUserId] = useState<string | null>(null);
  const [msgRequests, setMsgRequests] = useState<any[]>([]);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [selectedBookForRequest, setSelectedBookForRequest] = useState<any>(null);
  const [initialMessage, setInitialMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const ALL_CATEGORIES = [
    "Todas",
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
  ];

  const fetchReservations = async () => {
    try {
      const resResponse = await api.get('/reservas/solicitadas');
      const resList = resResponse.data?.data || resResponse.data || [];
      const pendingBookIds = Array.isArray(resList)
        ? resList
            .filter((r: any) => r.estado?.toUpperCase() === 'PENDIENTE' || r.estado?.toUpperCase() === 'ACEPTADA')
            .map((r: any) => typeof r.libro === 'string' ? r.libro : r.libro?._id)
            .filter(Boolean)
        : [];
      setRequestedBookIds(pendingBookIds);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  };

  const fetchChatsAndRequests = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setUserId(u._id);
        
        const reqResponse = await api.get('/message-requests/sent');
        setMsgRequests(reqResponse.data?.data || reqResponse.data || []);

        const chatsResponse = await api.get('/chats');
        setActiveChats(chatsResponse.data?.data || chatsResponse.data || []);
      }
    } catch (err) {
      console.error('Error fetching chats/requests in SearchScreen:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReservations();
      fetchChatsAndRequests();
    }, [])
  );

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    } else {
      fetchAllBooks();
    }
    if (route?.params?.openFilters) {
      setIsFilterModalVisible(true);
    }
  }, [initialQuery, route?.params?.openFilters]);

  // Reset page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [appliedCategoria, appliedMaxPrice, appliedType, searchQuery]);

  const fetchAllBooks = async () => {
    setLoading(true);
    try {
      const response = await api.get("/libros");
      const resData = response.data?.data || response.data;
      const booksArray = Array.isArray(resData) ? resData : (Array.isArray(resData?.data) ? resData.data : []);
      setBookResults(booksArray);
    } catch (error) {
      console.error("Error fetching all books:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    console.log(`Searching for book and user: ${query}`);
    api
      .get(`/libros/search?term=${query}&page=1&limit=10`)
      .then((res) => {
        const resData = res.data?.data || res.data;
        const booksArray = Array.isArray(resData) ? resData : (Array.isArray(resData?.data) ? resData.data : []);
        setBookResults(booksArray);
      })
      .catch((error) => {
        setBookResults([]);
        console.log(`Error search libros: ${JSON.stringify(error)}`);
      });
      
    api
      .get(`/usuarios/search?term=${query}&page=1&limit=10`)
      .then((res) => {
        const resData = res.data?.data || res.data;
        const usersArray = Array.isArray(resData) ? resData : (Array.isArray(resData?.data) ? resData.data : []);
        setUserResults(usersArray);
      })
      .catch((error) => {
        setUserResults([]);
        console.log(`Error search usuarios: ${JSON.stringify(error)}`);
      });

    setLoading(false);
  };

  const openMenu = (id: string) => setMenuVisible(id);
  const closeMenu = () => setMenuVisible(null);

  const handleTalkToSeller = (book: any) => {
    closeMenu();

    const ownerId = book.owner?._id || book.owner;
    if (userId && userId === ownerId) {
      showAlert(t('error'), 'No puedes hablar contigo mismo.');
      return;
    }

    const chat = activeChats.find((c: any) => c.libro === book._id || c.libro?._id === book._id);
    if (chat) {
      navigation.navigate('ChatRoom', { chatId: chat._id });
      return;
    }

    const pending = msgRequests.find((r: any) => (r.book === book._id || r.book?._id === book._id) && r.status === 'pending');
    if (pending) {
      showAlert('Solicitud enviada', 'Ya tienes una solicitud de mensaje pendiente para este libro.');
      return;
    }

    setSelectedBookForRequest(book);
    setInitialMessage('');
    setRequestModalVisible(true);
  };

  const handleSendRequest = async () => {
    if (!selectedBookForRequest) return;
    setSendingRequest(true);
    try {
      await api.post('/message-requests', {
        bookId: selectedBookForRequest._id,
        initialMessage: initialMessage.trim()
      });
      showAlert('Solicitud enviada', 'Tu solicitud de mensaje ha sido enviada al vendedor.');
      setRequestModalVisible(false);
      
      const reqResponse = await api.get('/message-requests/sent');
      setMsgRequests(reqResponse.data?.data || reqResponse.data || []);
    } catch (error: any) {
      console.error('Error sending message request:', error);
      const msg = error.response?.data?.message || 'No se pudo enviar la solicitud de mensaje.';
      showAlert('Error', msg);
    } finally {
      setSendingRequest(false);
    }
  };

  const handleTransaction = async (book: any) => {
    closeMenu();
    try {
      const endpoint =
        book.type === "VENTA"
          ? `/libros/buy/${book._id}`
          : `/libros/rent/${book._id}`;
      await api.post(endpoint);
      showAlert(
        t("success"),
        `${book.type === "VENTA" ? t("buy_action") : t("rent_action")}: ${book.title}`,
      );
      if (searchQuery) handleSearch(searchQuery);
      else fetchAllBooks();
    } catch (error) {
      console.error(`Error processing transaction:`, error);
      showAlert(t("error"), "No se pudo completar la operación");
    }
  };

  const handleReserveBook = async (book: any) => {
    closeMenu();
    try {
      await api.post('/reservas', { libroId: book._id });
      setRequestedBookIds(prev => [...prev, book._id]);
      showAlert(t('success'), t('reserve_success', 'Solicitud de reserva enviada correctamente'));
    } catch (error: any) {
      console.error('Error reserving book:', error);
      let errMsg = t('reserve_err', 'No se pudo realizar la reserva');
      if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      } else if (error.response?.data?.error?.message) {
        errMsg = error.response.data.error.message;
      }
      showAlert(t('error'), errMsg);
    }
  };

  const renderBookItem = ({ item: book }: { item: any }) => {
    const hasPending = msgRequests.some((r: any) => (r.book === book._id || r.book?._id === book._id) && r.status === 'pending');

    return (
      <Card style={isGridView ? styles.gridCard : styles.listCard}>
        <Card.Content style={isGridView ? styles.gridCardContent : undefined}>
          <View style={isGridView ? undefined : styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text
                variant="titleMedium"
                numberOfLines={2}
                style={styles.titleText}
              >
                {book.title}
              </Text>
              <Text variant="bodySmall" style={styles.typeTag}>
                {book.type}
              </Text>
              {book.isReserved && (
                <Chip style={styles.reservedBadge} textStyle={styles.reservedBadgeText}>
                  {t('reserved', 'Reservado')}
                </Chip>
              )}
            </View>
            <Text variant="titleMedium" style={styles.priceText}>
              {book.precio}€
            </Text>
          </View>
          {!isGridView && (
            <>
              {book.autor ? (
                <Text variant="bodySmall" style={{ marginTop: book.isReserved ? 6 : 0 }}>
                  {t("author_label")}: {book.autor}
                </Text>
              ) : null}
              {book.categoria ? (
                <Text variant="bodySmall">Categoría: {book.categoria}</Text>
              ) : null}
              <Text variant="bodySmall">
                {t("isbn_label")}: {book.isbn}
              </Text>
              <Text variant="bodySmall">
                {t("state_label")}: {book.estado}
              </Text>
            </>
          )}
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Menu
            visible={menuVisible === book._id}
            onDismiss={closeMenu}
            anchor={
              <Button
                mode="contained"
                buttonColor={book.isReserved ? "#f59e0b" : "#D183BA"}
                onPress={() => openMenu(book._id)}
                compact
                style={styles.actionButton}
                labelStyle={{ fontSize: isGridView ? 10 : 12 }}
              >
                {book.isReserved ? t('reserved', 'Reservado') : (book.type === "VENTA" ? t("buy_action") : t("rent_action"))}
              </Button>
            }
            contentStyle={{ backgroundColor: "white" }}
          >
            <Menu.Item
              onPress={() => handleTalkToSeller(book)}
              title={hasPending ? 'Solicitud enviada' : t("talk_to_seller")}
              disabled={hasPending}
              leadingIcon={() => <RNText style={{ fontSize: 18 }}>💬</RNText>}
            />
            {!book.isReserved && (
              <>
                <Divider />
                <Menu.Item
                  onPress={() => handleTransaction(book)}
                  title={
                    book.type === "VENTA" ? t("buy_directly") : t("rent_directly")
                  }
                  leadingIcon={() => (
                    <RNText style={{ fontSize: 18 }}>
                      {book.type === "VENTA" ? "💰" : "📅"}
                    </RNText>
                  )}
                />
              </>
            )}
          </Menu>
          {!book.isReserved && (
            <Button
              mode="outlined"
              onPress={() => handleReserveBook(book)}
              textColor={theme.colors.primary}
              style={[
                styles.actionButton,
                !requestedBookIds.includes(book._id) && { borderColor: theme.colors.primary }
              ]}
              compact
              labelStyle={{ fontSize: isGridView ? 10 : 12 }}
              disabled={requestedBookIds.includes(book._id)}
            >
              {requestedBookIds.includes(book._id) ? 'Reserva solicitada' : t('request_reserve', 'Solicitar reserva')}
            </Button>
          )}
        </Card.Actions>
      </Card>
    );
  };

  const renderUserItem = ({ item: user }: { item: any }) => (
    <Card
      style={styles.userCard}
      onPress={() => navigation.navigate("UserProfile", { userId: user._id })}
    >
      <Card.Title
        title={user.name}
        subtitle={user.email}
        left={(props) => (
          <Avatar.Text
            {...props}
            label={user.name.substring(0, 2).toUpperCase()}
            style={{ backgroundColor: "#D183BA" }}
          />
        )}
        right={(props) => (
          <Button
            icon="chevron-right"
            onPress={() =>
              navigation.navigate("UserProfile", { userId: user._id })
            }
          >
            {""}
          </Button>
        )}
      />
    </Card>
  );

  const filteredBooks = bookResults.filter((book) => {
    if (appliedType && book.type !== appliedType) return false;
    if (
      appliedCategoria &&
      appliedCategoria !== "Todas" &&
      book.categoria !== appliedCategoria
    )
      return false;
    if (
      appliedMaxPrice &&
      !isNaN(parseFloat(appliedMaxPrice)) &&
      book.precio > parseFloat(appliedMaxPrice)
    )
      return false;
    return true;
  });

  const handleApplyFilters = () => {
    setAppliedCategoria(filterCategoria);
    setAppliedMaxPrice(filterMaxPrice);
    setAppliedType(filterType);
    setIsFilterModalVisible(false);
  };

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);
  const paginatedBooks = filteredBooks.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const renderFooter = () => {
    if (filteredBooks.length <= ITEMS_PER_PAGE) return null;
    return (
      <View style={styles.paginationContainer}>
        <Button disabled={page === 1} onPress={() => setPage(page - 1)}>
          Anterior
        </Button>
        <RNText style={styles.pageText}>
          Página {page} de {totalPages}
        </RNText>
        <Button
          disabled={page === totalPages}
          onPress={() => setPage(page + 1)}
        >
          Siguiente
        </Button>
      </View>
    );
  };

  const ListHeader = () => (
    <>
      {userResults.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Usuarios
          </Text>
          {userResults.map((user) => (
            <View key={user._id}>{renderUserItem({ item: user })}</View>
          ))}
          <Divider style={styles.divider} />
        </View>
      )}

      {filteredBooks.length > 0 && (
        <View style={styles.headerRowSection}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Libros
          </Text>
          <IconButton
            icon={isGridView ? "view-list" : "view-grid"}
            iconColor="#D183BA"
            size={28}
            onPress={() => setIsGridView(!isGridView)}
            style={{ margin: 0 }}
          />
        </View>
      )}
    </>
  );

  const renderEmptyState = () => {
    const hasFilters = appliedCategoria || appliedMaxPrice || appliedType;

    if (filteredBooks.length > 0) return null;

    if (hasFilters) {
      return (
        <Text style={styles.emptyText}>
          ¡No hay ningún libro disponible con esos requisitos por el momento!
        </Text>
      );
    }

    if (searchQuery) {
      return (
        <Text style={styles.emptyText}>
          {t("search_no_results", { query: searchQuery })}
        </Text>
      );
    }

    return (
      <Text style={styles.emptyText}>
        ¡No hay ningún libro disponible con esos requisitos por el momento!
      </Text>
    );
  };

  const handleOpenFilters = () => {
    setFilterCategoria(appliedCategoria);
    setFilterMaxPrice(appliedMaxPrice);
    setFilterType(appliedType);
    setIsFilterModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={t("search_placeholder")}
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={() => handleSearch(searchQuery)}
        style={styles.searchBar}
        icon={() => <RNText style={{ fontSize: 20 }}>🔍</RNText>}
        right={(props) => (
          <IconButton
            {...props}
            icon="tune"
            iconColor="#D183BA"
            size={24}
            onPress={handleOpenFilters}
          />
        )}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#D183BA"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          key={isGridView ? "grid" : "list"}
          ListHeaderComponent={ListHeader}
          data={paginatedBooks}
          renderItem={renderBookItem}
          keyExtractor={(item) => item._id}
          numColumns={isGridView ? 2 : 1}
          columnWrapperStyle={isGridView ? styles.columnWrapper : undefined}
          contentContainerStyle={styles.scrollContent}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
        />
      )}

      <Portal>
        <Modal
          visible={isFilterModalVisible}
          onDismiss={() => setIsFilterModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Filtros
          </Text>

          <Text style={styles.labelModal}>Categoría:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {ALL_CATEGORIES.map((cat) => {
              const isSelected = filterCategoria === (cat === "Todas" ? "" : cat);
              return (
                <Chip
                  key={cat}
                  selected={isSelected}
                  onPress={() => setFilterCategoria(cat === "Todas" ? "" : cat)}
                  style={[
                    { marginHorizontal: 4, height: 34 },
                    isSelected ? { backgroundColor: "#D183BA" } : { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc" }
                  ]}
                  textStyle={isSelected ? { color: "#fff" } : { color: "#333" }}
                  showSelectedOverlay
                >
                  {cat}
                </Chip>
              );
            })}
          </ScrollView>

          <TextInput
            label="Precio Máximo (€)"
            value={filterMaxPrice}
            onChangeText={setFilterMaxPrice}
            keyboardType="numeric"
            mode="outlined"
            style={styles.modalInput}
            outlineColor="#D183BA"
            activeOutlineColor="#D183BA"
          />

          <Text style={styles.labelModal}>Tipo:</Text>
          <View style={{ flexDirection: "row", marginBottom: 16, justifyContent: 'space-between' }}>
            {[
              { value: "", label: "Todos" },
              { value: "VENTA", label: "Venta" },
              { value: "ALQUILER", label: "Alquiler" }
            ].map((item) => {
              const isSelected = filterType === item.value;
              return (
                <Chip
                  key={item.label}
                  selected={isSelected}
                  onPress={() => setFilterType(item.value)}
                  style={[
                    { flex: 1, marginHorizontal: 2, height: 34 },
                    isSelected ? { backgroundColor: "#D183BA" } : { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc" }
                  ]}
                  textStyle={isSelected ? { color: "#fff" } : { color: "#333" }}
                  showSelectedOverlay
                >
                  {item.label}
                </Chip>
              );
            })}
          </View>

          <Button
            mode="contained"
            onPress={handleApplyFilters}
            buttonColor="#D183BA"
            style={{ marginTop: 16 }}
          >
            Aplicar Filtros
          </Button>
        </Modal>

        <Modal
          visible={requestModalVisible}
          onDismiss={() => !sendingRequest && setRequestModalVisible(false)}
          contentContainerStyle={{
            backgroundColor: 'white',
            padding: 24,
            margin: 20,
            borderRadius: 16,
          }}
        >
          <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
            Hablar con el vendedor
          </Text>
          <Text variant="bodyMedium" style={{ marginBottom: 16, color: '#666' }}>
            Escribe un mensaje de presentación para el libro "{selectedBookForRequest?.title}":
          </Text>
          <TextInput
            label="Mensaje inicial"
            placeholder="Hola, me interesa tu libro..."
            value={initialMessage}
            onChangeText={setInitialMessage}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={{ marginBottom: 20, height: 100 }}
            outlineColor="#D183BA"
            activeOutlineColor="#D183BA"
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button 
              onPress={() => setRequestModalVisible(false)} 
              disabled={sendingRequest}
              textColor="#666"
            >
              Cancelar
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSendRequest}
              loading={sendingRequest}
              disabled={sendingRequest}
              buttonColor="#D183BA"
            >
              Enviar Solicitud
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5EBF4",
  },
  searchBar: {
    margin: 16,
    elevation: 4,
    backgroundColor: "#fff",
    borderRadius: 30,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  section: {
    marginBottom: 24,
  },
  headerRowSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#D6AED2",
    marginLeft: 4,
  },
  listCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  gridCard: {
    width: (width - 40) / 2,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  gridCardContent: {
    padding: 12,
    height: 100,
  },
  cardActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  actionButton: {
    width: 150,
  },
  gridButton: {
    width: "100%",
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  userCard: {
    marginBottom: 8,
    elevation: 1,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleText: {
    fontWeight: "bold",
    color: "#333",
  },
  typeTag: {
    color: "#D183BA",
    fontWeight: "bold",
    fontSize: 10,
    textTransform: "uppercase",
  },
  priceText: {
    color: "#D183BA",
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 16,
    backgroundColor: "#ddd",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 24,
    margin: 20,
    borderRadius: 16,
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  modalInput: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  labelModal: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  segmented: {
    marginBottom: 16,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  pageText: {
    marginHorizontal: 15,
    fontWeight: "bold",
    color: "#555",
  },
  reservedBadge: {
    backgroundColor: "#f59e0b",
    alignSelf: "flex-start",
    marginTop: 8,
    height: 28,
  },
  reservedBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
