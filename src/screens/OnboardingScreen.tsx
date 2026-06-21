import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText as Text } from '../components/AppText';

const { width, height } = Dimensions.get('window');

interface Slide {
  key: string;
  titleKey: string;
  descKey: string;
  icon: string;
  color: string;
  renderVisual: () => React.ReactNode;
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isReplay = route.params?.isReplay ?? false;

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Custom visual components for each slide to make the design feel premium and interactive
  const slides: Slide[] = [
    {
      key: 'welcome',
      titleKey: 'onboarding_welcome_title',
      descKey: 'onboarding_welcome_desc',
      icon: '📚',
      color: '#E4D0E2',
      renderVisual: () => (
        <View style={styles.visualContainer}>
          <Animated.Text style={[styles.visualEmoji, { fontSize: 80 }]}>📖</Animated.Text>
          <View style={styles.floatingStarsContainer}>
            <Text style={styles.starText}>✨</Text>
            <Text style={[styles.starText, { fontSize: 24, top: 40, right: 30 }]}>🌟</Text>
            <Text style={[styles.starText, { fontSize: 18, bottom: 20, left: 40 }]}>✨</Text>
          </View>
        </View>
      ),
    },
    {
      key: 'buy_rent',
      titleKey: 'onboarding_buy_rent_title',
      descKey: 'onboarding_buy_rent_desc',
      icon: '🤝',
      color: '#D1AED2',
      renderVisual: () => (
        <View style={styles.visualContainer}>
          <View style={styles.mockBookCard}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>📖</Text>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16 }}>Don Quijote</Text>
            <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
              <View style={[styles.mockButton, { backgroundColor: '#D183BA' }]}>
                <Text style={styles.mockButtonText}>{t('buy_action')}</Text>
              </View>
              <View style={[styles.mockButton, { backgroundColor: '#4f46e5' }]}>
                <Text style={styles.mockButtonText}>{t('rent_action')}</Text>
              </View>
            </View>
          </View>
        </View>
      ),
    },
    {
      key: 'upload',
      titleKey: 'onboarding_upload_title',
      descKey: 'onboarding_upload_desc',
      icon: '📤',
      color: '#F5E4F0',
      renderVisual: () => (
        <View style={styles.visualContainer}>
          <View style={styles.mockUploadBox}>
            <Text style={{ fontSize: 32, color: '#D183BA' }}>📤</Text>
            <Text
              style={{
                fontFamily: 'Outfit_500Medium',
                fontSize: 14,
                marginTop: 8,
                color: '#64748b',
              }}
            >
              {t('add_book_title')}
            </Text>
            <View style={styles.mockInputLine} />
            <View style={[styles.mockInputLine, { width: '60%' }]} />
          </View>
        </View>
      ),
    },
    {
      key: 'chats',
      titleKey: 'onboarding_chats_title',
      descKey: 'onboarding_chats_desc',
      icon: '💬',
      color: '#E2E8F0',
      renderVisual: () => (
        <View style={styles.visualContainer}>
          <View style={styles.chatBubbleLeft}>
            <Text style={styles.chatText}>¿Sigue disponible para alquiler?</Text>
          </View>
          <View style={styles.chatBubbleRight}>
            <Text style={[styles.chatText, { color: '#fff' }]}>¡Sí! Podemos quedar hoy.</Text>
          </View>
        </View>
      ),
    },
    {
      key: 'retos',
      titleKey: 'onboarding_retos_title',
      descKey: 'onboarding_retos_desc',
      icon: '🏆',
      color: '#FEF08A',
      renderVisual: () => (
        <View style={styles.visualContainer}>
          <View style={styles.challengeBadge}>
            <Text style={{ fontSize: 50 }}>🏆</Text>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, marginTop: 8 }}>
              {t('retos_completed_badge')}
            </Text>
            <Text style={{ fontSize: 12, color: '#b45309', fontFamily: 'Outfit_500Medium' }}>
              +150 XP
            </Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '80%' }]} />
            </View>
          </View>
        </View>
      ),
    },
    {
      key: 'accessibility',
      titleKey: 'onboarding_accessibility_title',
      descKey: 'onboarding_accessibility_desc',
      icon: '⚙️',
      color: '#E0F2FE',
      renderVisual: () => (
        <View style={styles.visualContainer}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <View style={styles.accessibilityOption}>
              <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14 }}>A</Text>
            </View>
            <View style={[styles.accessibilityOption, { transform: [{ scale: 1.15 }] }]}>
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#D183BA' }}>
                A+
              </Text>
            </View>
            <View style={styles.accessibilityOption}>
              <Text style={{ fontSize: 18 }}>👁️</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>
            {t('accessibility_settings')}
          </Text>
        </View>
      ),
    },
  ];

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
    listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const xOffset = event.nativeEvent.contentOffset.x;
      const index = Math.round(xOffset / width);
      if (index !== activeIndex) {
        setActiveIndex(index);
      }
    },
  });

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    if (isReplay) {
      navigation.goBack();
    } else {
      navigation.replace('Discover');
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const renderSlide = ({ item }: { item: Slide }) => {
    return (
      <View style={styles.slideWrapper}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            {item.renderVisual()}
            <Text style={styles.icon}>{item.icon}</Text>
            <Text variant="headlineSmall" style={styles.title}>
              {t(item.titleKey)}
            </Text>
            <Text variant="bodyLarge" style={styles.description}>
              {t(item.descKey)}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#F5E4F0', '#D6AED2']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header navigation bar */}
        <View style={styles.header}>
          <View />
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text variant="labelLarge" style={styles.skipButtonText}>
              {isReplay ? t('onboarding_close') : t('onboarding_skip')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* FlatList for slide rendering */}
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.key}
          style={styles.flatList}
        />

        {/* Footer with pagination dots and action button */}
        <View style={styles.footer}>
          {/* Pagination Indicators */}
          <View style={styles.dotsContainer}>
            {slides.map((_, i) => {
              const dotWidth = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [8, 20, 8],
                extrapolate: 'clamp',
              });

              const opacity = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [0.4, 1, 0.4],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={i.toString()}
                  style={[styles.dot, { width: dotWidth, opacity }]}
                />
              );
            })}
          </View>

          {/* Primary Action Button */}
          <Button
            mode="contained"
            buttonColor="#D183BA"
            textColor="#fff"
            onPress={handleNext}
            contentStyle={styles.actionBtnContent}
            style={styles.actionBtn}
          >
            {activeIndex === slides.length - 1
              ? isReplay
                ? t('onboarding_close')
                : t('onboarding_finish')
              : t('onboarding_next')}
          </Button>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipButtonText: {
    color: '#1e1b4b',
    fontFamily: 'Outfit_700Bold',
  },
  flatList: {
    flex: 1,
  },
  slideWrapper: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: width - 48,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 54,
    marginVertical: 12,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    color: '#1e1b4b',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Outfit_400Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  footer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e1b4b',
  },
  actionBtn: {
    width: '100%',
    borderRadius: 16,
  },
  actionBtnContent: {
    paddingVertical: 8,
  },

  // Mock visual components styling for cards
  visualContainer: {
    width: width - 96,
    height: 160,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  visualEmoji: {
    position: 'relative',
    zIndex: 2,
  },
  floatingStarsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  starText: {
    position: 'absolute',
    fontSize: 32,
    top: 20,
    left: 30,
    color: '#d97706',
  },
  mockBookCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mockButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  mockButtonText: {
    color: '#fff',
    fontFamily: 'Outfit_700Bold',
    fontSize: 12,
  },
  mockUploadBox: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#D183BA',
  },
  mockInputLine: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    width: '80%',
    marginTop: 10,
  },
  chatBubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    marginLeft: 20,
    marginBottom: 10,
    maxWidth: '70%',
  },
  chatBubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#D183BA',
    padding: 10,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    marginRight: 20,
    maxWidth: '70%',
  },
  chatText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: '#1e293b',
  },
  challengeBadge: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  progressBarTrack: {
    height: 6,
    width: 100,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3,
  },
  accessibilityOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
});
