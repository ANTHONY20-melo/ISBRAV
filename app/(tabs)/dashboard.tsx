import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useWindowDimensions, Platform, Image, Alert, TextInput, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AnimatedFadeIn } from '@/components/ui/animated-fade-in';
import { supabase } from './supabase'; // Importa o cliente Supabase

export default function DashboardScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = windowWidth > 768;
  const router = useRouter();
  const [fullName, setFullName] = useState('OPERADOR_ISBRAV'); // Estado para armazenar o nome completo
  const [role, setRole] = useState('operator'); // Estado para o cargo
  const [loadingProfile, setLoadingProfile] = useState(true); // Estado para indicar carregamento do perfil
  const [users, setUsers] = useState<any[]>([]); // Estado para a lista de usuários (Admin apenas)
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [suspendedUsersCount, setSuspendedUsersCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview'); // Estado para a aba ativa
  const [searchQuery, setSearchQuery] = useState(''); // Estado para a busca

  // Componente interno para as Abas
  const TabItem = ({ id, label, active, setter }: any) => (
    <TouchableOpacity 
      style={[styles.tabButton, active === id && styles.tabButtonActive]} 
      onPress={() => setter(id)}
    >
      <View style={styles.tabContent}>
        {active === id && <View style={styles.tabIndicator} />}
        <ThemedText style={[styles.tabText, active === id && styles.tabTextActive]}>
          {label}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (user && !authError) {
          // Caso especial: Força admin para o e-mail mestre (Fail-safe)
          const isMasterAdmin = user.email === 'admin@isbrav.com';

          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .single();

          // Define o cargo priorizando o banco, mas usando o fail-safe do e-mail
          const finalRole = isMasterAdmin ? 'admin' : (data?.role || 'operator');
          setRole(finalRole);

          if (data) {
            setFullName(data.full_name || user.email?.split('@')[0].toUpperCase() || 'OPERADOR');
          } else {
            setFullName(user.email?.split('@')[0].toUpperCase() || 'OPERADOR');
          }

          console.log(`[AUTH_SYSTEM] Nó identificado como: ${finalRole.toUpperCase()}`);

            // Se detectado como admin (via banco ou fail-safe), carrega os dados restritos
            if (finalRole === 'admin') {
              const { data: allUsers, error: usersError } = await supabase
                .from('profiles')
                .select('id, username, full_name, role, is_active')
                .order('role', { ascending: true });
              
              if (!usersError && allUsers) {
                setUsers(allUsers);
                setActiveUsersCount(allUsers.filter(u => u.is_active).length);
                setSuspendedUsersCount(allUsers.filter(u => !u.is_active).length);
              }
            }
          }
      } catch (err) {
        console.error('Falha crítica no uplink de perfil:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []); // Executa apenas uma vez ao montar o componente

  const handlePromoteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);

      if (error) throw error;

      // Atualiza o estado local para refletir a mudança na UI sem novo fetch
      setUsers((prev: any[]) => 
        prev.map(u => u.id === userId ? { ...u, role: 'admin' } : u)
      );
    } catch (error: any) {
      Alert.alert('PROMOTION_FAILED', error.message);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean, username: string) => {
    const nextStatus = !currentStatus;
    const actionLabel = nextStatus ? 'REATIVAR' : 'SUSPENDER';

    Alert.alert(
      'CONFIRMAR_ALTERAÇÃO',
      `Deseja realmente ${actionLabel} o nó [${username}]?`,
      [
        { text: 'CANCELAR', style: 'cancel' },
        { 
          text: actionLabel,
          style: nextStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ is_active: nextStatus })
                .eq('id', userId);

              if (error) throw error;

              setUsers((prev: any[]) => prev.map(u => u.id === userId ? { ...u, is_active: nextStatus } : u));
            } catch (error: any) {
              Alert.alert('ERRO_NO_UPLINK', error.message);
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut(); // Realiza o logout no Supabase
    if (error) {
      console.error('Error logging out:', error.message);
      Alert.alert('LOGOUT_FAILED', error.message);
    }
    // O redirecionamento para /login será tratado automaticamente pelo _layout.tsx
  };

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

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.techLabel}>[ SESSION_ACTIVE: {role.toUpperCase()} ]</ThemedText>
          <ThemedText type="title" style={styles.userName}>WELCOME_{loadingProfile ? '...' : fullName.toUpperCase()}</ThemedText>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <IconSymbol name="lock.fill" size={16} color="#FF3B30" />
          <ThemedText style={styles.logoutText}>TERMINATE</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <View style={styles.tabInner}>
          <TabItem id="overview" label="DASHBOARD_CORE" active={activeTab} setter={setActiveTab} />
          {role === 'admin' && (
            <TabItem id="users" label="NODE_OPERATORS" active={activeTab} setter={setActiveTab} />
          )}
          <TabItem id="patients" label="PATIENT_DATABASE" active={activeTab} setter={setActiveTab} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <AnimatedFadeIn style={styles.grid}>
          {activeTab === 'overview' && (
            <>
              {/* Métricas HUD */}
              <View style={[styles.statsRow, { flexDirection: isWeb ? 'row' : 'column' }]}>
                <View style={styles.statBox}>
                  <ThemedText style={styles.statLabel}>PATIENTS_SYNC</ThemedText>
                  <ThemedText style={styles.statValue}>1,429</ThemedText>
                  <View style={styles.progressLine}><View style={[styles.progressFill, { width: '85%' }]} /></View>
                </View>
                
                {/* Visão de Administrador: Lucro e Faturamento */}
                {role === 'admin' ? (
                  <>
                    <View style={[styles.statBox, { borderLeftColor: '#4CAF50' }]}>
                      <ThemedText style={styles.statLabel}>TOTAL_REVENUE</ThemedText>
                      <ThemedText style={[styles.statValue, { color: '#4CAF50' }]}>R$ 452K</ThemedText>
                      <View style={styles.progressLine}><View style={[styles.progressFill, { width: '70%', backgroundColor: '#4CAF50' }]} /></View>
                    </View>
                    <View style={[styles.statBox, { borderLeftColor: '#FFF' }]}>
                      <ThemedText style={styles.statLabel}>NET_PROFIT</ThemedText>
                      <ThemedText style={styles.statValue}>R$ 124K</ThemedText>
                      <ThemedText style={styles.subText}>MARGIN: 27.4%</ThemedText>
                    </View>
                  </>
                ) : (
                  <View style={[styles.statBox, { opacity: 0.5 }]}>
                    <ThemedText style={styles.statLabel}>RESTRICTED_DATA</ThemedText>
                    <ThemedText style={[styles.statValue, { fontSize: 18, color: '#444' }]}>LEVEL_ADMIN_REQUIRED</ThemedText>
                    <IconSymbol name="lock.fill" size={20} color="#222" style={{ marginTop: 10 }} />
                  </View>
                )}

                <View style={styles.statBox}>
                  <ThemedText style={styles.statLabel}>SYSTEM_HEALTH</ThemedText>
                  <ThemedText style={[styles.statValue, { color: '#4CAF50' }]}>99.9%</ThemedText>
                  <ThemedText style={styles.subText}>ALL_NODES_OPERATIONAL</ThemedText>
                </View>
              </View>

              {/* Gráfico de Proporção de Usuários - Visível apenas para Admin */}
              {role === 'admin' && (
                <View style={styles.chartCard}>
                  <ThemedText style={styles.chartTitle}>PROPORÇÃO_DE_NÓS_OPERACIONAIS</ThemedText>
                  <PieChart
                    data={[
                      {
                        name: 'ATIVOS',
                        population: activeUsersCount,
                        color: '#FFD700', // Amarelo ISBRAV
                        legendFontColor: '#FFF',
                        legendFontSize: 10,
                      },
                      {
                        name: 'SUSPENSOS',
                        population: suspendedUsersCount,
                        color: '#FF3B30', // Vermelho de alerta
                        legendFontColor: '#FFF',
                        legendFontSize: 10,
                      },
                    ]}
                    width={windowWidth * (isWeb ? 0.4 : 0.8)} // Largura responsiva
                    height={200}
                    chartConfig={{
                      backgroundColor: '#000',
                      backgroundGradientFrom: '#000',
                      backgroundGradientTo: '#000',
                      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      decimalPlaces: 0, // Não mostrar casas decimais
                    }}
                    accessor="population" // Campo que representa o valor
                    backgroundColor="transparent"
                    paddingLeft="15" // Ajuste de padding para a legenda
                    center={[10, 0]} // Centraliza o gráfico um pouco mais
                  />
                </View>
              )}

              {/* Feed de Atividades Terminal Style */}
              <View style={styles.activityFeed}>
                <ThemedText style={styles.feedTitle}>[ LIVE_SYSTEM_LOGS ]</ThemedText>
                <ThemedText style={styles.logItem}>{'> 10:42 - NOVO AGENDAMENTO: UNIDADE_SUL'}</ThemedText>
                <ThemedText style={styles.logItem}>{'> 10:38 - UPLINK DE PRONTUÁRIO CONCLUÍDO'}</ThemedText>
                <ThemedText style={styles.logItem}>{'> 10:30 - BACKUP_REDUNDANTE: OK'}</ThemedText>
                <ThemedText style={styles.logItem}>{'> 10:15 - GATEWAY_SECURITY: ENCRYPTED'}</ThemedText>
              </View>
            </>
          )}

          {activeTab === 'users' && role === 'admin' && (
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <ThemedText style={styles.tableTitle}>GERENCIAMENTO_DE_NÓS_E_OPERADORES</ThemedText>
                <View style={styles.searchContainer}>
                  <IconSymbol name="questionmark.circle.fill" size={14} color="#666" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="BUSCAR_IDENTIFICADOR..."
                    placeholderTextColor="#444"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>
              
              {users.filter((u: any) => 
                u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((u: any) => (
                <View key={u.id} style={[styles.tableRow, u.is_active === false && { opacity: 0.4 }]}>
                  <View style={styles.rowInfo}>
                    <ThemedText style={styles.rowTitle}>{u.username?.toUpperCase() || 'UID_UNKNOWN'}</ThemedText>
                    <ThemedText style={styles.rowSub}>
                      ROLE: {u.role?.toUpperCase()} | STATUS: {u.is_active === false ? 'OFFLINE' : 'ONLINE'}
                    </ThemedText>
                  </View>
                  <View style={styles.actionGroup}>
                    {u.role === 'operator' && (
                      <>
                        <TouchableOpacity 
                          style={styles.removeBtn}
                          onPress={() => handleToggleUserStatus(u.id, u.is_active, u.username)}
                        >
                          <ThemedText style={[styles.removeText, u.is_active === false && { color: '#4CAF50' }]}>
                            {u.is_active === false ? '[ACTIVATE]' : '[SUSPEND]'}
                          </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.promoteBtn} 
                          onPress={() => handlePromoteUser(u.id)}
                        >
                          <ThemedText style={styles.promoteText}>[PROMOTE_ROOT]</ThemedText>
                        </TouchableOpacity>
                      </>
                    )}
                    <View style={[styles.statusBadge, { borderColor: u.role === 'admin' ? '#FFD700' : '#444' }]}>
                      <ThemedText style={[styles.statusText, { color: u.role === 'admin' ? '#FFD700' : '#444' }]}>
                        {u.role === 'admin' ? 'ROOT' : 'OPERATOR'}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'patients' && (
            <View style={styles.tableCard}>
              <ThemedText style={styles.tableTitle}>GERENCIAMENTO_DE_PACIENTES</ThemedText>
              <ThemedText style={styles.logItem}>[ DATA_STREAM_INATIVO: MÓDULO_EM_DESENVOLVIMENTO ]</ThemedText>
              <ThemedText style={styles.logItem}>[ UPLINK_REQUIRED: CONTACT_ADMIN ]</ThemedText>
            </View>
          )}
        </AnimatedFadeIn>
      </ScrollView>
    </ThemedView>
  );
}

const { width: staticWidth } = Dimensions.get('window');
const isWebStatic = staticWidth > 768;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.92)' },
  header: { padding: 30, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 215, 0, 0.1)' },
  headerLeft: { gap: 5 },
  techLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  userName: { color: '#FFF', fontSize: 24, letterSpacing: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: '#FF3B30', borderRadius: 2 },
  logoutText: { color: '#FF3B30', fontSize: 10, fontWeight: 'bold' },
  tabBar: { backgroundColor: 'rgba(5, 5, 5, 0.8)', borderBottomWidth: 1, borderBottomColor: '#222' },
  tabInner: { flexDirection: 'row', justifyContent: 'center', maxWidth: 1100, alignSelf: 'center', width: '100%' },
  tabButton: { paddingHorizontal: 25, paddingVertical: 18, borderRightWidth: 1, borderRightColor: '#111' },
  tabButtonActive: { backgroundColor: 'rgba(255, 215, 0, 0.03)' },
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tabIndicator: { width: 4, height: 4, backgroundColor: '#FFD700', borderRadius: 2 },
  tabText: { color: '#444', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  tabTextActive: { color: '#FFD700' },
  content: { padding: 25 },
  grid: { gap: 20 },
  statsRow: { gap: 20 },
  statBox: { flex: 1, backgroundColor: 'rgba(15, 15, 15, 0.6)', padding: 25, borderRadius: 2, borderWidth: 1, borderColor: '#222', borderLeftWidth: 4, borderLeftColor: '#FFD700' },
  statLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
  statValue: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  progressLine: { height: 2, backgroundColor: '#222', width: '100%', marginTop: 15 },
  progressFill: { height: '100%', backgroundColor: '#FFD700' },
  subText: { color: '#4CAF50', fontSize: 8, marginTop: 10, letterSpacing: 1 },
  activityFeed: { backgroundColor: 'rgba(20,20,20,0.5)', padding: 30, borderRadius: 2, borderWidth: 1, borderColor: '#222', marginTop: 10 },
  feedTitle: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', marginBottom: 20, letterSpacing: 2 },
  logItem: { color: '#4CAF50', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 8, opacity: 0.8 },
  chartCard: { backgroundColor: '#0A0A0A', padding: 20, borderRadius: 2, borderWidth: 1, borderColor: '#222', marginTop: 20, alignItems: 'center' },
  chartTitle: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', letterSpacing: 2, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 15 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderWidth: 1, borderColor: '#222', paddingHorizontal: 12, borderRadius: 4, width: isWebStatic ? 300 : '100%' },
  searchInput: { color: '#FFD700', fontSize: 12, height: 40, flex: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  tableCard: { backgroundColor: '#0A0A0A', padding: 30, borderRadius: 2, borderWidth: 1, borderColor: '#222', marginTop: 20 },
  tableTitle: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', letterSpacing: 2, marginBottom: 30 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#111' },
  rowInfo: { gap: 4 },
  rowTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  rowSub: { color: '#444', fontSize: 9, letterSpacing: 1 },
  actionGroup: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  promoteBtn: { paddingVertical: 4, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#FFD700' },
  promoteText: { color: '#FFD700', fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
  removeBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  removeText: { color: '#FF3B30', fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
  statusBadge: { borderWidth: 1, borderColor: '#4CAF50', paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { color: '#4CAF50', fontSize: 8, fontWeight: 'bold' },
});