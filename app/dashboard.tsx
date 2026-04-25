import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useWindowDimensions, Platform, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  return (
    <ThemedView style={styles.container}>
      {/* Sidebar Mini (Web Only) */}
      <View style={[styles.sidebar, !isWeb && { display: 'none' }]}>
        <Image source={require('../assets/images/logo.png')} style={styles.sidebarLogo} resizeMode="contain" />
        <View style={styles.sidebarLinks}>
          <TouchableOpacity style={styles.activeLink}><IconSymbol name="house.fill" color="#FFD700" size={20} /></TouchableOpacity>
          <TouchableOpacity><IconSymbol name="person.3.fill" color="#444" size={20} /></TouchableOpacity>
          <TouchableOpacity><IconSymbol name="chart.bar.fill" color="#444" size={20} /></TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/')}>
            <IconSymbol name="lock.fill" color="#FF3B30" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
        <View style={styles.header}>
          <ThemedText style={styles.greeting}>BEM-VINDO, <ThemedText style={{color: '#FFD700'}}>OPERADOR_ISBRAV</ThemedText></ThemedText>
          <ThemedText style={styles.subGreeting}>ESTADO_DO_SISTEMA: ESTÁVEL | NÓ_LOCAL: 01_SAO_PAULO</ThemedText>
        </View>

        <View style={[styles.grid, { flexDirection: isWeb ? 'row' : 'column' }]}>
          <View style={styles.statCard}>
             <ThemedText style={styles.statLabel}>PACIENTES_TOTAIS</ThemedText>
             <ThemedText style={styles.statValue}>12,842</ThemedText>
             <View style={styles.statTrend}><ThemedText style={{color: '#4CAF50', fontSize: 10}}>+12% vs MÊS_ANTERIOR</ThemedText></View>
          </View>
          <View style={styles.statCard}>
             <ThemedText style={styles.statLabel}>RECURSOS_EM_USO</ThemedText>
             <ThemedText style={styles.statValue}>84%</ThemedText>
             <View style={styles.progressTrack}><View style={[styles.progressBar, { width: '84%' }]} /></View>
          </View>
          <View style={styles.statCard}>
             <ThemedText style={styles.statLabel}>FILA_DE_PROCESSAMENTO</ThemedText>
             <ThemedText style={styles.statValue}>0.04ms</ThemedText>
             <ThemedText style={styles.statLabelSmall}>LATÊNCIA_REDE_ISBRAV</ThemedText>
          </View>
        </View>

        <View style={styles.tableCard}>
           <ThemedText style={styles.tableTitle}>ULTIMAS_OPERAÇÕES_CLÍNICAS</ThemedText>
           {[1, 2, 3].map((i) => (
             <View key={i} style={styles.tableRow}>
                <View style={styles.rowInfo}>
                  <ThemedText style={styles.rowTitle}>PACIENTE_DATA_ENTRY_#{i * 492}</ThemedText>
                  <ThemedText style={styles.rowSub}>TIPO: CHECKUP_GERAL | AGENTE: IA_ANALYSIS</ThemedText>
                </View>
                <View style={styles.statusBadge}><ThemedText style={styles.statusText}>COMPLETADO</ThemedText></View>
             </View>
           ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', flexDirection: 'row' },
  sidebar: { width: 80, backgroundColor: '#050505', borderRightWidth: 1, borderRightColor: '#222', alignItems: 'center', paddingVertical: 30 },
  sidebarLogo: { width: 40, height: 40, marginBottom: 50 },
  sidebarLinks: { gap: 40, flex: 1 },
  activeLink: { padding: 10, backgroundColor: 'rgba(255, 215, 0, 0.1)', borderRadius: 8 },
  logoutBtn: { marginTop: 'auto' },
  mainScroll: { flex: 1 },
  mainContent: { padding: 40 },
  header: { marginBottom: 40 },
  greeting: { fontSize: 24, fontWeight: '900', letterSpacing: 1, color: '#FFF' },
  subGreeting: { color: '#444', fontSize: 10, letterSpacing: 2, marginTop: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  grid: { gap: 20, marginBottom: 40 },
  statCard: { flex: 1, backgroundColor: '#0A0A0A', padding: 25, borderRadius: 2, borderWidth: 1, borderColor: '#222', borderLeftWidth: 4, borderLeftColor: '#FFD700' },
  statLabel: { color: '#444', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  statLabelSmall: { color: '#222', fontSize: 8, fontWeight: 'bold', marginTop: 5 },
  statValue: { color: '#FFF', fontSize: 32, fontWeight: '900', marginVertical: 10 },
  statTrend: { backgroundColor: 'rgba(76, 175, 80, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4 },
  progressTrack: { height: 2, backgroundColor: '#222', width: '100%', marginTop: 10 },
  progressBar: { height: '100%', backgroundColor: '#FFD700' },
  tableCard: { backgroundColor: '#0A0A0A', padding: 30, borderRadius: 2, borderWidth: 1, borderColor: '#222' },
  tableTitle: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', letterSpacing: 2, marginBottom: 30 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#111' },
  rowInfo: { gap: 4 },
  rowTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  rowSub: { color: '#444', fontSize: 9, letterSpacing: 1 },
  statusBadge: { borderWidth: 1, borderColor: '#4CAF50', paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { color: '#4CAF50', fontSize: 8, fontWeight: 'bold' }
});