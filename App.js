import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header / Navbar */}
      <View style={styles.header}>
        <Image 
          source={require('./assets/images/logo.png')} 
          style={styles.logoHeader} 
          resizeMode="contain"
        />
        <View style={styles.navLinks}>
          <TouchableOpacity><Text style={styles.link}>Dashboard</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.link}>Pacientes</Text></TouchableOpacity>
          <TouchableOpacity style={styles.loginBtn}>
            <Text style={styles.loginText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.title}>Gestão Inteligente de Clínicas</Text>
          <Text style={styles.subtitle}>Eficiência em preto e amarelo para o seu negócio.</Text>
        </View>

        {/* Cards de Exemplo */}
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total de Consultas</Text>
            <Text style={styles.cardValue}>1,240</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Novos Pacientes</Text>
            <Text style={styles.cardValue}>85</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#FFD700' }]}>
            <Text style={[styles.cardTitle, { color: '#000' }]}>Faturamento</Text>
            <Text style={[styles.cardValue, { color: '#000' }]}>R$ 45.000</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    height: 70,
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    elevation: 4,
  },
  logoHeader: {
    width: 140,
    height: 45,
  },
  logo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#333',
    letterSpacing: 1.5,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  link: {
    marginHorizontal: 15,
    fontWeight: '600',
    color: '#000',
  },
  loginBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
  },
  loginText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  content: {
    padding: 40,
    alignItems: 'center',
  },
  hero: {
    marginBottom: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginTop: 10,
  },
  grid: {
    flexDirection: width > 768 ? 'row' : 'column',
    width: '100%',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#1E1E1E',
    width: width > 768 ? '30%' : '100%',
    padding: 25,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: { color: '#FFD700', fontSize: 14, textTransform: 'uppercase', marginBottom: 10 },
  cardValue: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
});