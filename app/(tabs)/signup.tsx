import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, useWindowDimensions, Platform, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { supabase } from './supabase';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AnimatedFadeIn } from '@/components/ui/animated-fade-in';

export default function SignUpScreen() {
  const router = useRouter();
  const scanLinePos = useSharedValue(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    scanLinePos.value = withRepeat(
      withSequence(withTiming(1, { duration: 2500 }), withTiming(0, { duration: 2500 })),
      -1,
      true
    );
  }, []);

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      Alert.alert('ERRO_DE_SINTAXE', 'Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          full_name: fullName,
        },
      },
    });

    if (error) {
      Alert.alert('PROVISIONAMENTO_FALHOU', error.message);
      setLoading(false);
    } else {
      Alert.alert('NÓ_ATIVADO', 'Provisionamento concluído com sucesso. Inicializando interface...');
      router.replace('/dashboard');
    }
  };

  const scanStyle = useAnimatedStyle(() => ({
    top: `${scanLinePos.value * 100}%`,
  }));

  return (
    <ThemedView style={styles.container}>
      <Video
        source={require('../../assets/video/rhino-bg.mp4')}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
      <View style={styles.overlay} />

      <AnimatedFadeIn style={styles.loginCard} offsetY={30}>
        <View style={styles.biometricContainer}>
          <IconSymbol name="paperplane.fill" size={40} color="#FFD700" />
          <Animated.View style={[styles.scanLine, scanStyle]} />
          <ThemedText style={styles.techLabel}>[ DATA_PROVISIONING ]</ThemedText>
        </View>

        <ThemedText type="title" style={styles.title}>NEW_NODE_REGISTRATION</ThemedText>
        <ThemedText style={styles.subtitle}>Inicialize seu perfil no ecossistema ISBRAV.</ThemedText>

        <View style={styles.inputGroup}>
          <View style={styles.inputWrapper}>
            <ThemedText style={styles.inputLabel}>FULL_NAME</ThemedText>
            <TextInput 
              style={styles.input} 
              placeholder="Israel Almeida" 
              placeholderTextColor="#444"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputWrapper}>
            <ThemedText style={styles.inputLabel}>NODE_ID (USERNAME)</ThemedText>
            <TextInput 
              style={styles.input} 
              placeholder="israel.tech" 
              placeholderTextColor="#444"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.inputWrapper}>
            <ThemedText style={styles.inputLabel}>COMM_LINK (EMAIL)</ThemedText>
            <TextInput 
              style={styles.input} 
              placeholder="israel@isbrav.sys" 
              placeholderTextColor="#444"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputWrapper}>
            <ThemedText style={styles.inputLabel}>SECURE_KEY (PASSWORD)</ThemedText>
            <TextInput 
              style={styles.input} 
              placeholder="••••••••" 
              placeholderTextColor="#444"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.loginBtn, loading && { opacity: 0.5 }]} 
          onPress={handleSignUp}
          disabled={loading}
        >
          <ThemedText style={styles.loginBtnText}>
            {loading ? 'UPLINKING...' : 'INITIALIZE_NODE'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText style={styles.backBtnText}>_CANCEL_UPLINK</ThemedText>
        </TouchableOpacity>
      </AnimatedFadeIn>
    </ThemedView>
  );
}

// Reutilizando os estilos do Login para consistência
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
  loginCard: {
    width: '95%',
    maxWidth: 450,
    backgroundColor: 'rgba(20, 20, 20, 0.6)',
    padding: 30,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    ...Platform.select({ web: { backdropFilter: 'blur(20px)' } as any }),
  },
  biometricContainer: { width: 100, height: 100, borderWidth: 1, borderColor: '#FFD700', alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden' },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#FFD700', shadowColor: '#FFD700', shadowOpacity: 1, shadowRadius: 10 },
  techLabel: { color: '#FFD700', fontSize: 8, marginTop: 10, letterSpacing: 1, position: 'absolute', bottom: 5 },
  title: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  subtitle: { color: '#666', fontSize: 11, textAlign: 'center', marginBottom: 30 },
  inputGroup: { width: '100%', gap: 15 },
  inputWrapper: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 5 },
  inputLabel: { color: '#FFD700', fontSize: 8, fontWeight: 'bold', marginBottom: 2, letterSpacing: 1 },
  input: { color: '#FFF', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  loginBtn: { width: '100%', backgroundColor: '#FFD700', paddingVertical: 18, marginTop: 30, alignItems: 'center' },
  loginBtnText: { color: '#000', fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  backBtn: { marginTop: 20 },
  backBtnText: { color: '#444', fontSize: 9, letterSpacing: 1, fontWeight: 'bold' },
});