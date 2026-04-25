import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, useWindowDimensions, Platform, Alert, Image } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { supabase } from './supabase';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AnimatedFadeIn } from '@/components/ui/animated-fade-in';

export default function LoginScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const router = useRouter();
  const isWeb = windowWidth > 768;
  const scanLinePos = useSharedValue(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    scanLinePos.value = withRepeat(
      withSequence(withTiming(1, { duration: 2000 }), withTiming(0, { duration: 2000 })),
      -1,
      true
    );
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('ERRO_DE_SINTAXE', 'Credenciais incompletas.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
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

      // O redirecionamento será tratado pelo onAuthStateChange no _layout.tsx
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
      <View style={[styles.mainWrapper, { flexDirection: isWeb ? 'row' : 'column' }]}>
        {/* Lado Esquerdo: Impacto Visual */}
        <View style={[styles.visualSide, !isWeb && StyleSheet.absoluteFillObject]}>
          <Video
            source={require('../../assets/video/rhino-bg.mp4')}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay isLooping isMuted
          />
          <View style={styles.overlay} />
          {isWeb && (
            <View style={styles.brandingOverlay}>
              <Image source={require('../../assets/images/logo.png')} style={styles.largeLogo} resizeMode="contain" />
              <ThemedText style={styles.brandingTag}>NEURAL_INTERFACE_v1.0</ThemedText>
            </View>
          )}
        </View>

        {/* Lado Direito: Formulário Terminal */}
        <View style={styles.formSide}>
          <AnimatedFadeIn style={styles.loginCard} offsetY={30}>
            <View style={styles.loginHeader}>
              <IconSymbol name="lock.fill" size={40} color="#FFD700" />
              <Animated.View style={[styles.scanLine, scanStyle]} />
            </View>
            
            <ThemedText type="title" style={styles.title}>NEURAL_ACCESS</ThemedText>
            <ThemedText style={styles.subtitle}>ESTABLISH_SESSION_LINK</ThemedText>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <ThemedText style={styles.inputLabel}>ID_NODE</ThemedText>
                <TextInput 
                  style={styles.input} 
                  placeholder="admin@isbrav.com" 
                  placeholderTextColor="#333"
                  value={email} onChangeText={setEmail} autoCapitalize="none"
                />
              </View>
              <View style={styles.inputWrapper}>
                <ThemedText style={styles.inputLabel}>ACCESS_KEY</ThemedText>
                <TextInput 
                  style={styles.input} 
                  placeholder="••••••••" 
                  placeholderTextColor="#333"
                  secureTextEntry value={password} onChangeText={setPassword}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.loginBtn, loading && { opacity: 0.5 }]} 
              onPress={handleLogin} disabled={loading}
            >
              <ThemedText style={styles.loginBtnText}>{loading ? 'SYNCING...' : 'INITIALIZE_SESSION'}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/signup')} style={{ marginTop: 25 }}>
              <ThemedText style={styles.backBtnText}>[ REQUEST_NEW_NODE_ACCESS ]</ThemedText>
            </TouchableOpacity>
          </AnimatedFadeIn>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
  mainWrapper: { flex: 1, width: '100%' },
  visualSide: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  formSide: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  brandingOverlay: { position: 'absolute', top: 60, left: 60, zIndex: 10 },
  largeLogo: { width: 150, height: 60 },
  brandingTag: { color: '#FFD700', fontSize: 10, letterSpacing: 3, fontWeight: 'bold', marginTop: 10 },
  loginCard: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'rgba(20, 20, 20, 0.6)',
    borderRadius: 4,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    ...Platform.select({ web: { backdropFilter: 'blur(20px)' } as any }),
  },
  loginHeader: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  techLabel: { color: '#FFD700', fontSize: 8, marginTop: 10, letterSpacing: 1, position: 'absolute', bottom: 5 },
  title: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 4, marginBottom: 10 },
  subtitle: { color: '#666', fontSize: 12, textAlign: 'center', marginBottom: 40, lineHeight: 18 },
  inputGroup: { width: '100%', gap: 25 },
  inputWrapper: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 5 },
  inputLabel: { color: '#FFD700', fontSize: 9, fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 },
  input: { color: '#FFF', fontSize: 16, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  loginBtn: {
    width: '100%',
    backgroundColor: '#FFD700',
    paddingVertical: 18,
    marginTop: 50,
    alignItems: 'center',
    borderRadius: 4,
  },
  loginBtnText: { color: '#000', fontWeight: '900', letterSpacing: 2, fontSize: 13 },
  backBtn: { marginTop: 20 },
  backBtnText: { color: '#444', fontSize: 10, letterSpacing: 1, fontWeight: 'bold' },
});