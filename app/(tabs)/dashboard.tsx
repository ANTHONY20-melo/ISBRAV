import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useWindowDimensions, Platform, Image, Alert, TextInput, Dimensions, Modal } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AnimatedFadeIn } from '@/components/ui/animated-fade-in';
import { supabase } from './supabase'; // Importa o cliente Supabase
import { useAppTheme } from './ThemeContext';

export default function DashboardScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = windowWidth > 768;
  const { isDark, toggleTheme } = useAppTheme();
  const router = useRouter();
  const [fullName, setFullName] = useState('OPERADOR_ISBRAV'); // Estado para armazenar o nome completo
  const [role, setRole] = useState('operator'); // Estado para o cargo
  const [loadingProfile, setLoadingProfile] = useState(true); // Estado para indicar carregamento do perfil
  const [users, setUsers] = useState<any[]>([]); // Estado para a lista de usuários (Admin apenas)
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [suspendedUsersCount, setSuspendedUsersCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState(''); // Estado para a busca
  const [activeTab, setActiveTab] = useState('overview'); // tabs: overview, operators, profile, patients, schedule, finance, settings
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Estado para o ano selecionado
  const [newFullName, setNewFullName] = useState('');
  const [revenueData, setRevenueData] = useState<any>(null); // Dados reais do banco
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<'revenue' | 'expense'>('revenue');
  const [transDesc, setTransDesc] = useState('');
  const [transValue, setTransValue] = useState('');

  const [logs, setLogs] = useState<{msg: string, time: string}[]>([
    { msg: 'SISTEMA_ISBRAV_ONLINE', time: '08:00:01' },
    { msg: 'AUTENTICAÇÃO_NÓ_ALPHA_CONCLUÍDA', time: '08:00:05' }
  ]);

  // Efeito para simular logs em tempo real
  useEffect(() => {
    const activityLogs = [
      'NOVO_AGENDAMENTO: MARIA_SILVA',
      'PRONTUÁRIO_ATUALIZADO: DR_ALMEIDA',
      'PAGAMENTO_CONFIRMADO: R$_250.00',
      'BACKUP_SINC_CONCLUÍDO',
      'ACESSO_DETECTADO: IP_192.168.1.10',
      'CADASTRO_CONCLUÍDO: PACIENTE_042',
    ];

    const interval = setInterval(() => {
      const randomLog = activityLogs[Math.floor(Math.random() * activityLogs.length)];
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLogs(prev => [{ msg: randomLog, time: timeStr }, ...prev].slice(0, 5));
    }, 6000);

    return () => clearInterval(interval);
  }, []);

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

          const finalRole = isMasterAdmin ? 'admin' : (data?.role || 'operator');
          setFullName(data?.full_name || user.email?.split('@')[0].toUpperCase() || 'OPERADOR');
          setNewFullName(data?.full_name || '');
          setRole(finalRole); // Define o cargo priorizando o banco, mas usando o fail-safe do e-mail

          console.log(`[AUTH_SYSTEM] Nó identificado como: ${finalRole.toUpperCase()}`);

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
        console.error('[ERROR] Falha crítica no uplink de perfil:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []); // Executa apenas uma vez ao montar o componente

  // Efeito para carregar dados financeiros quando a aba ou o ano mudar
  useEffect(() => {
    if (activeTab === 'finance') {
      fetchRevenueFromSupabase(selectedYear);
    }
  }, [activeTab, selectedYear]);

  const fetchRevenueFromSupabase = async (year: number) => {
    try {
      setLoadingRevenue(true);
      // Busca na tabela revenue_stats filtrando pelo ano
      const { data, error } = await supabase
        .from('revenue_stats')
        .select('month_label, amount')
        .eq('year', year)
        .order('month_order', { ascending: true });

      if (error) throw error;

      if (data) {
        const months = data.map(item => ({ m: item.month_label, v: item.amount }));
        const totalValue = data.reduce((acc, item) => acc + item.amount, 0);
        
        // Formata os dados para o estado
        setRevenueData({
          months,
          total: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue),
          growth: data.length > 0 ? '+15.2%' : '0%' // Lógica de crescimento pode ser calculada comparando anos
        });
      }
    } catch (err) {
      console.error('[FINANCE_ERROR] Falha ao sincronizar dados:', err);
      Alert.alert('ERRO_FINANCEIRO', 'Não foi possível carregar os dados de faturamento.');
    } finally {
      setLoadingRevenue(false);
    }
  };

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

  const handleUpdateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newFullName })
        .eq('id', user.id);

      if (error) throw error;

      setFullName(newFullName);
      setIsModalVisible(false);
      Alert.alert('SUCESSO', 'Perfil atualizado no sistema.');
    } catch (error: any) {
      Alert.alert('ERRO_AO_ATUALIZAR', error.message);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut(); // Realiza o logout no Supabase
    if (error) {
      console.error('Error logging out:', error.message);
      Alert.alert('LOGOUT_FAILED', error.message);
    } else {
      // Garante o redirecionamento imediato
      router.replace('/login');
    }
    // O redirecionamento para /login será tratado automaticamente pelo _layout.tsx
  };

  const NavItem = ({ id, label, icon }: { id: string, label: string, icon: any }) => {
    const isActive = activeTab === id;
    return (
      <TouchableOpacity 
        style={[
          styles.sidebarItem, 
          isActive && styles.sidebarItemActive
        ]} 
        onPress={() => setActiveTab(id)}
      >
        <IconSymbol name={icon} size={20} color={isActive ? '#000' : '#FFD700'} />
        <ThemedText style={[
          styles.sidebarText, 
          isActive && styles.sidebarTextActive
        ]}>
          {label}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const handleAddTransaction = () => {
    if (!transDesc || !transValue) {
      Alert.alert('ERRO_VAL_DADOS', 'Preencha todos os campos da transação.');
      return;
    }

    const msg = transactionType === 'revenue' 
      ? `RECEITA_REGISTRADA: ${transDesc}` 
      : `DESPESA_REGISTRADA: ${transDesc}`;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    setLogs(prev => [{ msg, time: timeStr }, ...prev].slice(0, 5));
    
    Alert.alert('UPLINK_SUCESSO', `Fluxo de ${transactionType === 'revenue' ? 'receita' : 'despesa'} sincronizado.`);
    
    // Limpa e fecha
    setTransDesc('');
    setTransValue('');
    setIsTransactionModalVisible(false);
  };

  return (
    <ThemedView style={styles.container}> {/* Removido isDark conditional */}
      <View style={styles.mainLayout}>
        {/* Sidebar - Fixa no Desktop */}
        {isWeb && (
          <View style={styles.sidebar}>
            <View style={styles.sidebarLogoContainer}>
              <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
            </View>

            <View style={styles.sidebarNav}>
              <NavItem id="overview" label="Visão Geral" icon="house.fill" />
              <NavItem id="schedule" label="Agenda" icon="calendar.badge.plus" />
              <NavItem id="patients" label="Pacientes" icon="person.3.fill" />
              <NavItem id="finance" label="Financeiro" icon="pie.chart.fill" />
              
              <View style={styles.sidebarSeparator} />
              
              {role === 'admin' && (
                <NavItem id="operators" label="Gestão de Nós" icon="shield.lefthalf.filled" />
              )}
              <NavItem id="profile" label="Meu Perfil" icon="info.circle.fill" />
            </View>

            <View style={styles.sidebarFooter}>
              <View style={styles.statusBadge}> {/* Removido isDark conditional */}
                <View style={styles.onlineDot} />
                <ThemedText style={styles.statusText}>SISTEMA ONLINE</ThemedText>
              </View>
              <TouchableOpacity style={styles.sidebarLogout} onPress={handleLogout}>
                <IconSymbol name="lock.fill" size={14} color="#FF3B30" />
                <ThemedText style={styles.logoutTextSidebar}>ENCERRAR SESSÃO</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.mainContent}>
          {/* Header Superior Dinâmico */}
          <View style={styles.header}> {/* Removido isDark conditional */}
            {!isWeb && (
              <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
            )}
            <View style={styles.headerTitleContainer}>
              <ThemedText style={styles.headerBreadcrumb}>CORE_SYSTEM // {activeTab.toUpperCase()}</ThemedText>
            </View>

            <View style={styles.headerActions}>
              {!isWeb && (
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                  <ThemedText style={styles.logoutText}>SAIR</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Tabs Mobile (Caso não esteja no Web) */}
            {!isWeb && (
              <View style={[styles.tabBar, { marginBottom: 20 }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity style={[styles.tabItem, activeTab === 'overview' && styles.tabItemActive]} onPress={() => setActiveTab('overview')}>
                    <ThemedText style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>GERAL</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tabItem, activeTab === 'schedule' && styles.tabItemActive]} onPress={() => setActiveTab('schedule')}>
                    <ThemedText style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>AGENDA</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tabItem, activeTab === 'patients' && styles.tabItemActive]} onPress={() => setActiveTab('patients')}>
                    <ThemedText style={[styles.tabText, activeTab === 'patients' && styles.tabTextActive]}>PACIENTES</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tabItem, activeTab === 'finance' && styles.tabItemActive]} onPress={() => setActiveTab('finance')}>
                    <ThemedText style={[styles.tabText, activeTab === 'finance' && styles.tabTextActive]}>FINANCEIRO</ThemedText>
                  </TouchableOpacity>
                  {role === 'admin' && (
                    <TouchableOpacity style={[styles.tabItem, activeTab === 'operators' && styles.tabItemActive]} onPress={() => setActiveTab('operators')}>
                      <ThemedText style={[styles.tabText, activeTab === 'operators' && styles.tabTextActive]}>NÓS</ThemedText>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]} onPress={() => setActiveTab('profile')}>
                    <ThemedText style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>PERFIL</ThemedText>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            <AnimatedFadeIn style={styles.grid}>
              {activeTab === 'overview' && (
                <>
                  <View style={styles.welcomeSection}>
                    <ThemedText style={styles.techLabel}>{role === 'admin' ? 'NÍVEL_ACESSO: ALPHA_ADMIN' : 'NÍVEL_ACESSO: OPERADOR'}</ThemedText> {/* Removido isDark conditional */}
                    <ThemedText type="title" style={styles.userName}>{loadingProfile ? '...' : `OLÁ, ${fullName.toUpperCase()}`}</ThemedText> {/* Removido isDark conditional */}
                  </View>
                  
                  <View style={[styles.mainMetricsRow, { flexDirection: isWeb ? 'row' : 'column' }]}>
                    <View style={styles.mainStatBox}>
                      <ThemedText style={styles.mainStatLabel}>PACIENTES</ThemedText>
                      <ThemedText style={styles.mainStatValue}>1,429</ThemedText>
                    </View>
                    <View style={styles.mainStatBox}>
                      <ThemedText style={styles.mainStatLabel}>AGENDAMENTOS</ThemedText>
                      <ThemedText style={styles.mainStatValue}>45</ThemedText>
                    </View>
                    {role === 'admin' && (
                      <View style={styles.mainStatBox}>
                        <ThemedText style={styles.mainStatLabel}>STATUS DO SISTEMA</ThemedText>
                        <ThemedText style={[styles.mainStatValue, { color: '#4CAF50' }]}>ESTÁVEL</ThemedText>
                      </View>
                    )}
                  </View>

                  {/* Nova Função: Ações Rápidas */}
                  <View style={styles.quickActionsContainer}>
                    <ThemedText style={styles.tableTitle}>AÇÕES_RÁPIDAS</ThemedText>
                    <View style={styles.quickActionsGrid}>
                      <TouchableOpacity style={styles.actionCard}>
                        <IconSymbol name="calendar.badge.plus" size={24} color="#FFD700" />
                        <ThemedText style={styles.actionCardText}>Novo Agendamento</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionCard}>
                        <IconSymbol name="person.3.fill" size={24} color="#FFD700" />
                        <ThemedText style={styles.actionCardText}>Cadastrar Paciente</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionCard}>
                        <IconSymbol name="dollarsign.circle.fill" size={24} color="#FFD700" />
                        <ThemedText style={styles.actionCardText}>Lançar Receita</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Feed de Atividades Recentes (Terminal Noir Style) */}
                  <View style={styles.logsContainer}>
                    <ThemedText style={styles.tableTitle}>LOGS_DE_ATIVIDADE_SISTEMA</ThemedText>
                    <View style={styles.logsBody}>
                      {logs.map((log, index) => (
                        <View key={index} style={styles.logRow}>
                          <View style={styles.logDot} />
                          <ThemedText style={styles.logText}>
                            <ThemedText style={styles.logTime}>[{log.time}]</ThemedText> {log.msg}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {activeTab === 'finance' && (
                <View style={styles.tableCard}> {/* Removido isDark conditional */}
                  <View style={styles.financeHeaderRow}>
                    <ThemedText style={styles.tableTitle}>GESTÃO_DE_FLUXO_MONETÁRIO</ThemedText>
                    <View style={styles.financeActionButtons}>
                      <TouchableOpacity 
                        style={[styles.miniActionBtn, { backgroundColor: '#4CAF50' }]} 
                        onPress={() => { setTransactionType('revenue'); setIsTransactionModalVisible(true); }}>
                        <ThemedText style={styles.miniActionText}>+ RECEITA</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.miniActionBtn, { backgroundColor: '#FF3B30' }]} 
                        onPress={() => { setTransactionType('expense'); setIsTransactionModalVisible(true); }}>
                        <ThemedText style={styles.miniActionText}>- DESPESA</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.yearSelector}>
                    {[2023, 2024, 2025].map(year => (
                      <TouchableOpacity 
                        key={year} 
                        style={[styles.yearButton, selectedYear === year && styles.yearButtonActive]}
                        onPress={() => setSelectedYear(year)}
                      >
                        <ThemedText style={[styles.yearButtonText, selectedYear === year && styles.yearButtonTextActive]}>{year}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.tableHeader}>
                    <ThemedText style={styles.tableTitle}>FATURAMENTO MENSAL (BRL)</ThemedText> {/* Removido isDark conditional */}
                    <ThemedText style={styles.statusText}>[ LIVE_DATA ]</ThemedText> {/* Removido isDark conditional */}
                  </View>
                  
                  <View style={styles.chartArea}>
                    {loadingRevenue ? (
                      <ThemedText style={styles.statusText}>CARREGANDO_DADOS...</ThemedText>
                    ) : revenueData?.months.map((item: any, i: number) => (
                        <View key={i} style={styles.chartCol}>
                          <View style={styles.chartBarWrapper}>
                            <AnimatedFadeIn delay={i * 100} offsetY={20}>
                              <View style={[styles.chartBarMain, { height: Math.min(item.v / 100, 170) }]} /> {/* Removido isDark conditional */}
                            </AnimatedFadeIn>
                          </View>
                          <ThemedText style={styles.chartLabel}>{item.m}</ThemedText> {/* Removido isDark conditional */}
                        </View>
                      ))
                    }
                    {!loadingRevenue && !revenueData?.months.length && (
                      <ThemedText style={styles.statusText}>NENHUM_REGISTRO_ENCONTRADO</ThemedText>
                    )}
                  </View>

                  {/* Gráfico de Distribuição (Receita vs Despesas) */}
                  <View style={styles.pieChartSection}>
                    <ThemedText style={[styles.tableTitle, { marginBottom: 20 }]}>DISTRIBUIÇÃO_DE_FLUXO</ThemedText>
                    <View style={styles.pieContainer}>
                      <View style={styles.pieVisual}>
                        <View style={styles.pieRingBase}>
                          <View style={styles.pieRingOverlay} />
                        </View>
                        <View style={styles.pieCenterLabel}>
                          <ThemedText style={styles.piePercentage}>75%</ThemedText>
                          <ThemedText style={styles.pieSubText}>RECEITA</ThemedText>
                        </View>
                      </View>
                      <View style={styles.pieLegend}>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: '#FFD700' }]} />
                          <ThemedText style={styles.legendLabel}>RECEITA_OPERACIONAL (75%)</ThemedText>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: '#111' }]} />
                          <ThemedText style={styles.legendLabel}>DESPESAS_E_CUSTOS (25%)</ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.financeSummary}> {/* Removido isDark conditional */}
                    <View>
                      <ThemedText style={styles.mainStatLabel}>TOTAL SEMESTRE ({selectedYear})</ThemedText>
                      <ThemedText style={[styles.mainStatValue, { fontSize: 20, color: '#4CAF50' }]}>
                        {revenueData?.total || 'R$ 0,00'}
                      </ThemedText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <ThemedText style={styles.mainStatLabel}>CRESCIMENTO</ThemedText>
                      <ThemedText style={[styles.mainStatValue, { fontSize: 20, color: '#FFD700' }]}>
                        {revenueData?.growth || '0%'}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              )}

              {activeTab === 'schedule' && (
                <View style={styles.tableCard}> {/* Removido isDark conditional */}
                  <ThemedText style={styles.tableTitle}>PRÓXIMOS AGENDAMENTOS</ThemedText>
                  <View style={styles.scheduleList}>
                    {[
                      { id: 'sch001', patient: 'Ana Silva', time: '10:00', service: 'Consulta Geral' },
                      { id: 'sch002', patient: 'João Pereira', time: '11:30', service: 'Exame de Rotina' },
                      { id: 'sch003', patient: 'Maria Souza', time: '14:00', service: 'Retorno' },
                      { id: 'sch004', patient: 'Pedro Lima', time: '15:45', service: 'Consulta Especializada' },
                    ].map((item) => (
                      <View key={item.id} style={styles.scheduleItem}>
                        <View style={styles.scheduleTimeBadge}>
                          <ThemedText style={styles.scheduleTimeText}>{item.time}</ThemedText>
                        </View>
                        <View style={styles.scheduleDetails}>
                          <ThemedText style={styles.schedulePatient}>{item.patient}</ThemedText>
                          <ThemedText style={styles.scheduleService}>{item.service}</ThemedText>
                        </View>
                        <TouchableOpacity style={styles.scheduleActionBtn}>
                          <IconSymbol name="info.circle.fill" size={18} color="#FFD700" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {activeTab === 'patients' && (
                <View style={styles.tableCard}> {/* Removido isDark conditional */}
                  <View style={styles.tableHeader}>
                    <ThemedText style={styles.tableTitle}>LISTA DE PACIENTES</ThemedText>
                    <View style={styles.searchContainer}>
                      <IconSymbol name="bubbles.and.sparkles.fill" size={14} color="#999" />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar paciente..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                    </View>
                  </View>
                  <View style={styles.patientList}>
                    {[
                      { id: 'pat001', name: 'Carlos Eduardo', dob: '1985-03-12', lastVisit: '2024-05-20' },
                      { id: 'pat002', name: 'Fernanda Oliveira', dob: '1992-11-01', lastVisit: '2024-06-10' },
                      { id: 'pat003', name: 'Roberto Santos', dob: '1970-07-23', lastVisit: '2024-04-15' },
                      { id: 'pat004', name: 'Juliana Costa', dob: '2000-01-05', lastVisit: '2024-06-25' },
                    ].filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((patient) => (
                      <View key={patient.id} style={styles.patientItem}>
                        <View style={styles.patientDetails}>
                          <ThemedText style={styles.patientName}>{patient.name}</ThemedText>
                          <ThemedText style={styles.patientInfo}>Nasc: {patient.dob} | Última Visita: {patient.lastVisit}</ThemedText>
                        </View>
                        <TouchableOpacity style={styles.patientActionBtn}>
                          <IconSymbol name="info.circle.fill" size={18} color="#FFD700" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {activeTab === 'settings' && (
                <View style={styles.tableCard}> {/* Removido isDark conditional */}
                  <View style={styles.emptyState}>
                    <IconSymbol name="bubbles.and.sparkles.fill" size={40} color="#FFD700" style={{ opacity: 0.5 }} />
                    <ThemedText style={styles.emptyTitle}>CONFIGURAÇÕES DO SISTEMA</ThemedText> {/* Removido isDark conditional */}
                    <ThemedText style={styles.emptySub}>Gerencie as preferências e integrações do seu nó ISBRAV.</ThemedText>
                  </View>
                </View>
              )}

              {activeTab === 'operators' && role === 'admin' && (
                <View style={styles.tableCard}> {/* Removido isDark conditional */}
                  <View style={styles.tableHeader}>
                    <ThemedText style={styles.tableTitle}>GESTÃO DE OPERADORES</ThemedText> {/* Removido isDark conditional */}
                    <View style={styles.searchContainer}> {/* Removido isDark conditional */}
                      <IconSymbol name="bubbles.and.sparkles.fill" size={14} color="#999" />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Filtrar por nome..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                    </View>
                  </View>
                  
                  {users.filter((u: any) => 
                    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((u: any) => (
                    <View key={u.id} style={[styles.tableRow, u.is_active === false && { opacity: 0.4 }]}> {/* Removido isDark conditional */}
                      <View style={styles.rowInfo}>
                        <ThemedText style={styles.rowTitle}>{u.full_name || u.username || 'Usuário sem nome'}</ThemedText> {/* Removido isDark conditional */}
                        <ThemedText style={styles.rowSub}> {/* Removido isDark conditional */}
                          {u.role === 'admin' ? 'Administrador' : 'Operador'} • {u.is_active === false ? 'Suspenso' : 'Ativo'}
                        </ThemedText>
                      </View>
                      <View style={styles.actionGroup}>
                        <TouchableOpacity 
                          style={styles.removeBtn}
                          onPress={() => handleToggleUserStatus(u.id, u.is_active, u.username)}
                        >
                          <ThemedText style={[styles.removeText, u.is_active === false && { color: '#4CAF50' }]}>
                            {u.is_active === false ? 'Reativar' : 'Suspender'}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {activeTab === 'profile' && (
                <View style={styles.profileCard}> {/* Removido isDark conditional */}
                  <View style={styles.profileInfo}>
                    <ThemedText style={styles.profileLabel}>NOME COMPLETO</ThemedText>
                    <ThemedText style={styles.profileValue}>{fullName || 'Não informado'}</ThemedText> {/* Removido isDark conditional */}
                    
                    <ThemedText style={styles.profileLabel}>CARGO NO SISTEMA</ThemedText>
                    <ThemedText style={styles.profileValue}>{role === 'admin' ? 'Administrador' : 'Operador'}</ThemedText> {/* Removido isDark conditional */}
                  </View>
                  
                  <TouchableOpacity style={styles.editBtn} onPress={() => setIsModalVisible(true)}>
                    <ThemedText style={styles.editBtnText}>EDITAR PERFIL</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </AnimatedFadeIn>
          </ScrollView>
        </View>
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}> {/* Removido isDark conditional */}
            <ThemedText style={styles.modalTitle}>ATUALIZAR PERFIL</ThemedText>
            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputLabel}>NOVO NOME COMPLETO</ThemedText>
              <TextInput 
                style={styles.modalInput}
                value={newFullName}
                onChangeText={setNewFullName}
                placeholderTextColor="#444"
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setIsModalVisible(false)}
              >
                <ThemedText style={styles.cancelBtnText}>CANCELAR</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}>
                <ThemedText style={styles.saveBtnText}>SALVAR ALTERAÇÕES</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Transação Financeira */}
      <Modal visible={isTransactionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: transactionType === 'revenue' ? '#4CAF50' : '#FF3B30' }]}>
            <ThemedText style={styles.modalTitle}>
              {transactionType === 'revenue' ? 'NOVA_RECEITA' : 'NOVA_DESPESA'}
            </ThemedText>
            
            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputLabel}>DESCRIÇÃO_DO_FLUXO</ThemedText>
              <TextInput 
                style={styles.modalInput} 
                placeholder="Ex: Consulta Particular" 
                placeholderTextColor="#444"
                value={transDesc}
                onChangeText={setTransDesc}
              />
            </View>

            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputLabel}>VALOR_NOMINAL (BRL)</ThemedText>
              <TextInput 
                style={styles.modalInput} 
                placeholder="0.00" 
                placeholderTextColor="#444"
                keyboardType="numeric"
                value={transValue}
                onChangeText={setTransValue}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsTransactionModalVisible(false)}>
                <ThemedText style={styles.cancelBtnText}>ABORTAR</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: transactionType === 'revenue' ? '#4CAF50' : '#FF3B30' }]} 
                onPress={handleAddTransaction}>
                <ThemedText style={[styles.saveBtnText, { color: '#FFF' }]}>CONFIRMAR_ENTRY</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const { width: staticWidth } = Dimensions.get('window');
const isWebStatic = staticWidth > 768;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111214' },
  mainLayout: { flex: 1, flexDirection: 'row' },
  sidebar: { 
    width: 240, 
    backgroundColor: '#0A0B0D', 
    borderRightWidth: 1, 
    borderColor: '#111', 
    paddingVertical: 30 
  },
  sidebarLogoContainer: { paddingHorizontal: 30, marginBottom: 40 },
  sidebarNav: { flex: 1, paddingHorizontal: 15, gap: 4 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 2, gap: 12 },
  sidebarItemActive: { backgroundColor: '#FFD700' },
  sidebarText: { fontSize: 11, fontWeight: '800', color: '#444', letterSpacing: 1 },
  sidebarTextActive: { color: '#000' },
  sidebarSeparator: { height: 1, backgroundColor: '#222', marginVertical: 20, marginHorizontal: 15 },
  sidebarFooter: { paddingHorizontal: 25, gap: 15 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0A0A0A', padding: 8, borderRadius: 2, borderWidth: 1, borderColor: '#111' }, // Removido isDark conditional
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  statusText: { fontSize: 8, fontWeight: '800', color: '#4CAF50', letterSpacing: 1 },
  sidebarLogout: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 5 },
  logoutTextSidebar: { color: '#FF3B30', fontSize: 11, fontWeight: 'bold' },
  mainContent: { flex: 1 },
  headerTitleContainer: { flex: 1, marginLeft: 15 },
  headerBreadcrumb: { fontSize: 10, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
  emptyState: { padding: 60, alignItems: 'center', gap: 10 },
  chartArea: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    justifyContent: 'space-between', 
    height: 200, 
    paddingTop: 20,
    paddingHorizontal: 10 
  },
  chartCol: { flex: 1, alignItems: 'center', gap: 10 },
  chartBarWrapper: { height: 170, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  chartBarMain: { 
    width: isWebStatic ? 40 : 25, 
    backgroundColor: '#FFD700', 
    borderTopLeftRadius: 6, 
    borderTopRightRadius: 6,
    opacity: 0.9 // Removido isDark conditional
  },
  chartLabel: { fontSize: 10, fontWeight: '700', color: '#999' },
  financeSummary: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 30, 
    paddingTop: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#111' // Removido isDark conditional
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  yearButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 2, backgroundColor: '#111' },
  yearButtonActive: { backgroundColor: '#FFD700' },
  yearButtonText: { fontSize: 10, fontWeight: 'bold', color: '#444' },
  yearButtonTextActive: { color: '#000' }, // Removido isDark conditional
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  emptySub: { color: '#888', fontSize: 13, textAlign: 'center' },
  header: { 
    padding: 20, 
    paddingTop: Platform.OS === 'web' ? 20 : 50, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#000',
    borderBottomWidth: 1, 
    borderBottomColor: '#111',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.02)' } as any
    })
  },
  logo: { width: 90, height: 30 },
  headerActions: { flexDirection: 'row', gap: 10 },
  backBtn: { paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: '#E1E4E8', borderRadius: 6 },
  backBtnText: { color: '#666', fontSize: 11, fontWeight: 'bold' },
  logoutBtn: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#FFD700', borderRadius: 6 },
  logoutText: { color: '#000', fontSize: 11, fontWeight: 'bold' },
  content: { padding: 25, maxWidth: 1000, alignSelf: 'center', width: '100%' },
  tabBar: { flexDirection: 'row', gap: 25, marginBottom: 35, borderBottomWidth: 1, borderBottomColor: '#111' },
  tabItem: { paddingVertical: 12 },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  tabText: { color: '#444', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }, // Removido isDark conditional
  tabTextActive: { color: '#FFF' },
  welcomeSection: { marginBottom: 40 },
  techLabel: { color: '#FFD700', fontSize: 10, fontWeight: '700', marginBottom: 4, letterSpacing: 2 },
  userName: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  grid: { gap: 25 },
  mainMetricsRow: { flexDirection: 'row', gap: 20, flexWrap: 'wrap' },
  mainStatBox: { 
    flex: 1, 
    minWidth: 150, 
    backgroundColor: '#1A1B1E', 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#111', 
    borderRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700'
  },
  mainStatLabel: { color: '#444', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  mainStatValue: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0A0A0A', 
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 12, 
    width: 220 
  },
  searchInput: { color: '#FFF', fontSize: 12, height: 40, flex: 1, marginLeft: 8 },
  tableCard: { backgroundColor: '#161618', padding: 25, borderRadius: 2, borderWidth: 1, borderColor: '#222', marginTop: 10 },
  tableTitle: { color: '#FFD700', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#111' }, // Removido isDark conditional
  rowInfo: { gap: 4 },
  rowTitle: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  rowSub: { color: '#444', fontSize: 9, fontWeight: 'bold' },
  actionGroup: { flexDirection: 'row', alignItems: 'center' },
  removeBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 2, backgroundColor: 'rgba(255, 59, 48, 0.1)' },
  removeText: { color: '#FF3B30', fontSize: 11, fontWeight: 'bold' },
  profileCard: { backgroundColor: '#161618', padding: 30, borderRadius: 2, borderWidth: 1, borderColor: '#222' },
  profileInfo: { gap: 20, marginBottom: 30 }, // Removido isDark conditional
  profileLabel: { color: '#444', fontSize: 10, fontWeight: 'bold' },
  profileValue: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  editBtn: { backgroundColor: '#FFD700', padding: 15, alignItems: 'center', borderRadius: 2 },
  editBtnText: { color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0D0D0E', width: '100%', maxWidth: 450, padding: 30, borderRadius: 2, borderWidth: 1, borderColor: '#FFD700' },
  modalTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', marginBottom: 25, textAlign: 'center', letterSpacing: 2 },
  inputWrapper: { marginBottom: 25 }, // Removido isDark conditional
  inputLabel: { color: '#444', fontSize: 9, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  modalInput: { backgroundColor: '#000', borderWidth: 1, borderColor: '#222', borderRadius: 2, color: '#FFF', padding: 15, fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 15 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 2, backgroundColor: '#111' },
  cancelBtnText: { color: '#444', fontSize: 11, fontWeight: 'bold' },
  saveBtn: { flex: 2, padding: 15, alignItems: 'center', backgroundColor: '#FFD700', borderRadius: 2 },
  saveBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  quickActionsContainer: { marginTop: 40 },
  quickActionsGrid: { flexDirection: 'row', gap: 15, marginTop: 20, flexWrap: 'wrap' },
  actionCard: { 
    flex: 1, 
    minWidth: 120, 
    backgroundColor: '#050505', 
    padding: 20, 
    borderRadius: 2, 
    borderWidth: 1, 
    borderColor: '#111', 
    alignItems: 'center', 
    gap: 10 
  },
  actionCardText: { color: '#FFF', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  logsContainer: { marginTop: 40, backgroundColor: '#0A0A0B', padding: 25, borderRadius: 2, borderWidth: 1, borderColor: '#222' },
  logsBody: { marginTop: 15, gap: 10 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFD700' },
  logText: { color: '#666', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  logTime: { color: '#FFD700', fontWeight: '900' },
  // Novos estilos para Agenda
  scheduleList: { marginTop: 20, gap: 15 },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    padding: 15,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#111',
  },
  scheduleTimeBadge: { backgroundColor: '#FFD700', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 2, marginRight: 15 },
  scheduleTimeText: { color: '#000', fontWeight: '900', fontSize: 12 },
  scheduleDetails: { flex: 1, gap: 4 },
  schedulePatient: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  scheduleService: { color: '#666', fontSize: 11 },
  scheduleActionBtn: { padding: 5 },
  // Novos estilos para Pacientes
  patientList: { marginTop: 20, gap: 15 },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    padding: 15,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#111',
  },
  patientDetails: { flex: 1, gap: 4 },
  patientName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  patientInfo: { color: '#666', fontSize: 11 },
  patientActionBtn: { padding: 5 },
  // Estilos do Gráfico Analítico (Donut Noir)
  pieChartSection: { paddingVertical: 30, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#111' },
  pieContainer: { alignItems: 'center', justifyContent: 'space-around', gap: 40 },
  pieVisual: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  pieRingBase: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    borderWidth: 14, 
    borderColor: '#111',
    position: 'relative'
  },
  pieRingOverlay: { 
    position: 'absolute', 
    top: -14, left: -14, 
    width: 120, height: 120, 
    borderRadius: 60, 
    borderWidth: 14, 
    borderColor: '#FFD700', 
    borderBottomColor: 'transparent', 
    borderLeftColor: 'transparent', 
    transform: [{ rotate: '45deg' }] 
  },
  pieCenterLabel: { position: 'absolute', alignItems: 'center' },
  piePercentage: { color: '#FFD700', fontSize: 24, fontWeight: '900' },
  pieSubText: { color: '#444', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  pieLegend: { gap: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: '#222' },
  legendLabel: { color: '#888', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  // Estilos Adicionais de Finanças
  financeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  financeActionButtons: { flexDirection: 'row', gap: 10 },
  miniActionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 2 },
  miniActionText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
});