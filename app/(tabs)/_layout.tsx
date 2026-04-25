import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';

export default function TabLayout() {
  const segments = useSegments();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Busca a sessão inicial de forma assíncrona
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    // Escuta mudanças no estado de autenticação (Login, Logout, Token renovado)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setInitialized(true);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments.includes('login') || segments.includes('signup');
    const isDashboard = segments.includes('dashboard');
    const isRoot = segments.length === 1 && segments[0] === '(tabs)'; // Caso esteja na home

    if (!initialized) return;

    if (!session && (isDashboard)) {
      // Sem sessão tentando acessar área restrita
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // Já logado tentando acessar login/signup
      router.replace('/dashboard');
    }
  }, [session, segments, initialized, router]);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false, // Esconde o cabeçalho para a tela principal
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
          presentation: 'modal', // Efeito de slide moderno
        }}
      />
      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      {/* A tela 'explore' foi removida da navegação para focar na página principal.
          Se você precisar dela novamente, adicione-a aqui ou em outro navigator. */}
      {/* <Stack.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }} /> */}
    </Stack>
  );
}
