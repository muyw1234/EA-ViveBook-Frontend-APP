import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet, Image, Text as RNText, Platform } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { styles as globalStyles } from '../../styles/default';
import {
  configureGoogleSignIn,
  loginWithGoogle,
  isAppleLoginAvailable,
  loginWithApple,
} from '../services/socialAuth';
import { unwrapApiData } from '../utils/apiResponse';
import { saveSession } from '../services/session';

type AuthResponse = {
  token: string;
  user: Record<string, unknown>;
};

export default function LoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    configureGoogleSignIn();
    const checkApple = async () => {
      const isAvailable = await isAppleLoginAvailable();
      setAppleAvailable(isAvailable);
    };
    checkApple();
  }, []);

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg(t('err_credentials'));
      Alert.alert(t('error'), t('err_credentials'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/signin', { email, password });

      if (response.status === 200) {
        const { token, user } = unwrapApiData<AuthResponse>(response.data);
        console.log('Login successful. User:', JSON.stringify(user));

        await saveSession(token, user, 'Main');
      }
    } catch (error: any) {
      let message = t('err_login_failed');

      if (error.response) {
        const status = error.response.status;
        if (status >= 500) {
          message = `${t('err_server_error')} (Status: ${status})`;
        } else {
          if (typeof error.response.data === 'string') {
            message = error.response.data;
          } else if (error.response.data && typeof error.response.data.message === 'string') {
            message = error.response.data.message;
          } else {
            message = t('err_login_failed');
          }
        }
      } else if (error.request) {
        message = t('err_network_error');
        if (error.message) {
          message += ` (${error.message})`;
        }
      } else {
        message = error.message || t('err_login_failed');
      }

      setErrorMsg(message);
      Alert.alert(t('error'), message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setErrorMsg('');
    setLoading(true);
    try {
      let idToken = '';
      let name = '';
      if (provider === 'google') {
        const userInfo: any = await loginWithGoogle();
        idToken = userInfo?.data?.idToken || userInfo?.idToken || '';
        if (!idToken) throw new Error('No Google ID Token');
      } else if (provider === 'apple') {
        const credential = await loginWithApple();
        idToken = credential.identityToken || '';
        if (!idToken) throw new Error('No Apple Identity Token');
        if (credential.fullName?.givenName) {
          name = `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim();
        }
      }

      const response = await api.post('/auth/social-login', { provider, idToken, name });

      if (response.status === 200 || response.status === 201) {
        const { token, user } = unwrapApiData<AuthResponse>(response.data);

        await saveSession(token, user, 'Main');
      }
    } catch (error: any) {
      console.log(error);
      const msg = error.message || t('err_login_failed');
      setErrorMsg(msg);
      Alert.alert(t('error'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#F5EBF4', '#F5EBF4']} style={globalStyles.gradient}>
      <View style={globalStyles.card}>
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <Image
            source={require('../../assets/libro_inicio.webp')}
            style={{ width: 120, height: 120, resizeMode: 'contain' }}
          />
        </View>
        <Text variant="headlineLarge" style={globalStyles.title}>
          {t('login_title')}
        </Text>
        <Text variant="bodyMedium" style={globalStyles.subtitle}>
          {t('login_subtitle')}
        </Text>

        <TextInput
          label={t('email_label')}
          value={email}
          onChangeText={setEmail}
          mode="flat"
          underlineColor="transparent"
          keyboardType="email-address"
          autoCapitalize="none"
          style={globalStyles.input}
          left={<TextInput.Icon icon={() => <RNText style={{ fontSize: 20 }}>✉️</RNText>} />}
        />

        <TextInput
          label={t('password_label')}
          value={password}
          onChangeText={setPassword}
          mode="flat"
          underlineColor="transparent"
          secureTextEntry={!showPassword}
          style={globalStyles.input}
          left={<TextInput.Icon icon={() => <RNText style={{ fontSize: 20 }}>🔒</RNText>} />}
          right={
            <TextInput.Icon
              icon={() => <RNText style={{ fontSize: 20 }}>{showPassword ? '👁️' : '👀'}</RNText>}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />

        {errorMsg ? (
          <RNText
            style={{
              color: 'red',
              textAlign: 'center',
              marginBottom: 10,
              fontFamily: 'Outfit_500Medium',
            }}
          >
            {errorMsg}
          </RNText>
        ) : null}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={globalStyles.button}
          buttonColor="#D183BA"
        >
          {t('btn_enter')}
        </Button>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 10,
            marginBottom: 10,
            width: '100%',
          }}
        >
          {Platform.OS !== 'web' && (
            <Button
              mode="outlined"
              onPress={() => handleSocialLogin('google')}
              disabled={loading}
              style={{ flex: 1, marginRight: appleAvailable ? 5 : 0, borderColor: '#D183BA' }}
              textColor="#D183BA"
              icon={() => <RNText style={{ fontSize: 18 }}>G</RNText>}
            >
              Google
            </Button>
          )}
          {appleAvailable && (
            <Button
              mode="outlined"
              onPress={() => handleSocialLogin('apple')}
              disabled={loading}
              style={{ flex: 1, marginLeft: 5, borderColor: '#D183BA' }}
              textColor="#D183BA"
              icon={() => <RNText style={{ fontSize: 18 }}></RNText>}
            >
              Apple
            </Button>
          )}
        </View>

        <Button onPress={() => navigation.navigate('Register' as never)} textColor="#D183BA">
          {t('no_account_link')}
        </Button>

        <Button onPress={() => navigation.navigate('Home' as never)} textColor="#64748b">
          {t('back')}
        </Button>
      </View>
    </LinearGradient>
  );
}
