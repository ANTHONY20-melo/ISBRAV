import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, useWindowDimensions, Platform, Alert, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { supabase } from './supabase';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AnimatedFadeIn } from '@/components/ui/animated-fade-in';

export default function LoginScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = windowWidth > 768;
  const router = useRouter();
  const scanLinePos = useSharedValue(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Novo estado para visibilidade da senha
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    scanLinePos.value = withRepeat(
      withSequence(withTiming(1, { duration: 2000 }), withTiming(0, { duration: 2000 })),
      -1,
      true
    );
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('ERRO_DE_SINTAXE', 'Credenciais incompletas.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      });

      if (error) {
        Alert.alert('ACESSO_NEGADO', error.message);
        setLoading(false);
        return;
      }

      // Verificação de status do nó (is_active)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', data.user?.id)
        .single();

      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        Alert.alert('NÓ_SUSPENSO', 'Este acesso foi desativado pelo administrador central.');
        setLoading(false);
        return;
      }

    } catch (err) {
      Alert.alert('FALHA_DO_SISTEMA', 'Erro ao conectar com o nó central.');
      setLoading(false);
    }
  };

  const scanStyle = useAnimatedStyle(() => ({
    top: `${scanLinePos.value * 100}%`,
  }));

  return (
    <ThemedView style={styles.container}>
      <View style={styles.backgroundDecor}>
        <View style={styles.circleDecor} />
      </View>

      <AnimatedFadeIn style={[styles.loginCard, isWeb && { maxWidth: 400 }]} offsetY={20}>
        <View style={styles.scanContainer}>
          <Animated.View style={[styles.scanLine, scanStyle]} />
        </View>

        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        
        <View style={styles.headerSpacer}>
          <ThemedText type="title" style={styles.title}>ACESSO</ThemedText>
          <View style={styles.yellowUnderline} />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>USUÁRIO</ThemedText>
            <TextInput 
              style={styles.input} 
              placeholder="IDENTIFICADOR_ID" 
              placeholderTextColor="#555"
              value={username} 
              onChangeText={setUsername} 
              autoCapitalize="none"
              autoComplete="off"
              textContentType="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>SENHA</ThemedText>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={[styles.input, styles.passwordInput]} 
                placeholder="••••••••" 
                placeholderTextColor="#555"
                secureTextEntry={!showPassword} 
                value={password} 
                onChangeText={setPassword}
                autoComplete="off"
                textContentType="none"
              />
              <TouchableOpacity 
                style={styles.togglePasswordVisibility} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <IconSymbol name={showPassword ? "eye.slash.fill" : "eye.fill"} size={20} color="#FFD700" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.loginBtn, loading && { opacity: 0.7 }]} 
          onPress={handleLogin} 
          disabled={loading}
        >
          <ThemedText style={styles.loginBtnText}>
            {loading ? 'CARREGANDO...' : 'ENTRAR'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/signup')} style={styles.signupLink}>
          <ThemedText style={styles.signupText}>Solicitar novo acesso</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backToSiteBtn}>
          <ThemedText style={styles.backToSiteText}>← VOLTAR_AO_SITE</ThemedText>
        </TouchableOpacity>
      </AnimatedFadeIn>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  backgroundDecor: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', opacity: 0.2 },
  circleDecor: { 
    position: 'absolute', 
    top: -100, 
    right: -100, 
    width: 400, 
    height: 400, 
    borderRadius: 200, 
    borderWidth: 1, 
    borderColor: '#FFD700' 
  },
  scanContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', opacity: 0.1, pointerEvents: 'none' },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#FFD700' },
  loginCard: {
    width: '85%',
    maxWidth: 380,
    backgroundColor: '#000',
    borderRadius: 0,
    padding: 40,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  logo: { width: 140, height: 50, marginBottom: 30 },
  headerSpacer: { alignItems: 'center', marginBottom: 35 },
  title: { color: '#FFF', fontSize: 22, fontWeight: '700', letterSpacing: 5 },
  yellowUnderline: { width: 30, height: 3, backgroundColor: '#FFD700', marginTop: 8 },
  inputGroup: { width: '100%', gap: 20 },
  inputContainer: { width: '100%' },
  inputWrapper: { width: '100%', position: 'relative', justifyContent: 'center' },
  label: { color: '#FFD700', fontSize: 10, fontWeight: '800', marginBottom: 8, letterSpacing: 2 },
  input: { 
    backgroundColor: '#0A0A0A', 
    borderWidth: 1, 
    borderColor: '#222', 
    color: '#FFF', 
    padding: 15, 
    fontSize: 14,
    borderRadius: 2
  },
  passwordInput: {
    paddingRight: 50, // Espaço para o ícone
  },
  togglePasswordVisibility: {
    position: 'absolute',
    right: 15,
    zIndex: 10,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    marginTop: 35,
    alignItems: 'center',
    borderRadius: 2,
  },
  loginBtnText: { color: '#000', fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  signupLink: { marginTop: 25 },
  signupText: { color: '#555', fontSize: 11, fontWeight: '600' },
  backToSiteBtn: { marginTop: 15, padding: 10 },
  backToSiteText: { color: '#FFD700', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
});