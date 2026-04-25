import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useWindowDimensions, Platform, Image, Dimensions, ViewStyle, ImageStyle, TextInput } from 'react-native';
import Animated, { 
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';

import { Collapsible } from '@/components/ui/collapsible';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { AnimatedFadeIn } from '@/components/ui/animated-fade-in';

function PulsingDot() {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.5, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: withTiming(scale.value === 1 ? 1 : 0.5),
  }));

  return <Animated.View style={[styles.livePulse, animatedStyle] as any} />;
}

function FeatureCard({ icon, 
  title, 
  description 
}: { icon: IconSymbolName; title: string; description: string }) {
  return (
    <View style={styles.card}>
      <IconSymbol size={40} name={icon} color="#FFD700" style={{ marginBottom: 10 }} />
      <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{title}</ThemedText>
      <ThemedText style={styles.cardDesc}>{description}</ThemedText>
    </View>
  );
}

function TeamCard({ name, role }: { name: string; role: string }) {
  return (
    <View style={styles.teamCard}>
      <View style={styles.teamIconContainer}>
        <IconSymbol name="person.3.fill" size={35} color="#FFD700" />
      </View>
      <ThemedText type="defaultSemiBold" style={styles.teamName}>{name}</ThemedText>
      <ThemedText style={styles.teamRole}>{role}</ThemedText>
    </View>
  );
}

function PricingCard({ 
  plan, 
  price, 
  features, 
  isHighlighted, 
  isWeb,
  icon
}: { 
  plan: string; 
  price: string; 
  features: string[]; 
  isHighlighted?: boolean; 
  isWeb: boolean;
  icon: IconSymbolName;
}) {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0);
  const borderGlow = useSharedValue(0.1);

  const animateIn = () => {
    scale.value = withTiming(1.03, { duration: 150, easing: Easing.out(Easing.ease) });
    shadowOpacity.value = withTiming(0.2, { duration: 150, easing: Easing.out(Easing.ease) });
    borderGlow.value = withTiming(0.8, { duration: 150 });
  };

  const animateOut = () => {
    scale.value = withTiming(1, { duration: 150, easing: Easing.in(Easing.ease) });
    shadowOpacity.value = withTiming(0, { duration: 150, easing: Easing.in(Easing.ease) });
    borderGlow.value = withTiming(0.1, { duration: 150 });
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    ...Platform.select({
      web: {
        boxShadow: `0px 10px 20px rgba(0,0,0,${shadowOpacity.value})` as any,
        borderColor: `rgba(255, 215, 0, ${borderGlow.value})`,
      },
    } as any) as any,
  }));

  const webProps = (Platform.OS === 'web' && isWeb) ? {
    onMouseEnter: animateIn,
    onMouseLeave: animateOut,
  } : {};

  return (
    <Animated.View 
      style={[styles.pricingCard, isHighlighted && styles.pricingCardHighlighted, animatedCardStyle]}
      onTouchStart={animateIn}
      onTouchEnd={animateOut}
      {...(Platform.OS === 'web' && isWeb ? { onMouseEnter: animateIn, onMouseLeave: animateOut } : {}) as any}
    >
      <View style={styles.planHeader}>
        <View style={styles.planIconRow}>
          <ThemedText style={styles.hudLabel}>[ NODE_ID: {plan.toUpperCase()} ]</ThemedText>
          <IconSymbol name={icon} size={20} color={isHighlighted ? "#000" : "#FFD700"} />
        </View>
        <View style={styles.planPriceRow}>
          <ThemedText style={[styles.pricingPrice, isHighlighted && { color: '#000' }]}>{price}</ThemedText>
          <ThemedText style={[styles.pricingPeriod, isHighlighted && { color: '#333' }]}>/mo</ThemedText>
        </View>
      </View>
      
      <View style={[styles.planDivider, isHighlighted && { backgroundColor: '#000' }]} />

      <View style={styles.pricingFeatures}>
        {features.map((feature, i) => (
          <View key={i} style={styles.pricingFeatureItem}>
            <IconSymbol name="checkmark.circle.fill" size={16} color={isHighlighted ? '#000' : '#FFD700'} />
            <ThemedText style={[styles.pricingFeatureText, isHighlighted && { color: '#333' }]}>{feature}</ThemedText>
          </View>
        ))}
      </View>
      <TouchableOpacity style={[styles.pricingCta, isHighlighted && styles.pricingCtaHighlighted]} activeOpacity={0.7}>
        <ThemedText style={[styles.pricingCtaText, isHighlighted && { color: '#FFD700' }]}>ACTIVATE_NODE</ThemedText>
      </TouchableOpacity>
    </Animated.View>
  );
}

function TestimonialCard({
  text,
  author, 
  clinic,
  isWeb, 
  windowWidth
}: { text: string; author: string; clinic: string; isWeb: boolean; windowWidth: number }) {
  return (
    <View style={[styles.testimonialCard, { width: isWeb ? 400 : windowWidth * 0.8 } as any]}>
      <IconSymbol name="bubbles.and.sparkles.fill" size={24} color="rgba(255, 215, 0, 0.4)" style={{ marginBottom: 15 }} />
      <ThemedText style={styles.testimonialText}>"{text}"</ThemedText>
      <View style={{ marginTop: 'auto' }}>
        <ThemedText type="defaultSemiBold" style={styles.testimonialAuthor}>- {author}</ThemedText>
        <ThemedText style={styles.testimonialClinic}>{clinic}</ThemedText>
      </View>
    </View>
  );
}

function HUDChartBar({ targetHeight, delay }: { targetHeight: number; delay: number }) {
  const height = useSharedValue(0);

  useEffect(() => {
    // Animação de crescimento com easing exponencial para suavidade premium
    height.value = withDelay(delay, withTiming(targetHeight, { 
      duration: 1500, 
      easing: Easing.out(Easing.exp) 
    }));
  }, [targetHeight, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View 
      style={[styles.chartBar, animatedStyle, { opacity: 0.3 + (targetHeight / 100) }]} 
    />
  );
}

export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const router = useRouter();
  const isWeb = windowWidth > 768;
  const [isAnnual, setIsAnnual] = useState(false);
  const [systemLogs, setSystemLog] = useState(['> INITIALIZING_ISBRAV_CORE...', '> ENCRYPTED_LINK_ESTABLISHED']);
  
  // Referências para Scroll Automático
  const scrollRef = useRef<ScrollView>(null);
  const [solutionsY, setSolutionsY] = useState(0);
  const [plansY, setPlansY] = useState(0);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  useEffect(() => {
    const logsList = ['> CACHE_PURGED', '> LATENCY: 12ms', '> NODES_ACTIVE: 4', '> SYNCING_CLINICAL_DATA...'];
    const interval = setInterval(() => {
      setSystemLog(prev => [...prev.slice(-2), logsList[Math.floor(Math.random() * logsList.length)]]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemedView style={styles.container}>
      {/* Navbar Fixa Superior */}
      <View style={styles.navbar}>
        <View style={styles.navInner}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.navLogo} 
            resizeMode="contain"
          />
          
          {isWeb && (
            <View style={styles.navLinks}>
              <TouchableOpacity onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}>
                <ThemedText style={styles.navLink}>INÍCIO</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => scrollRef.current?.scrollTo({ y: solutionsY - 80, animated: true })}>
                <ThemedText style={styles.navLink}>EXPLORAR</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => scrollRef.current?.scrollTo({ y: plansY - 80, animated: true })}>
                <ThemedText style={styles.navLink}>PLANOS</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={styles.navLoginBtn} 
            onPress={() => router.push('/login')}
          >
            <ThemedText style={styles.navLoginText}>LOGIN</ThemedText>
            <IconSymbol name="lock.fill" size={12} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.rhinoBackgroundContainer}>
        <Video
          source={require('../../assets/video/rhino-bg.mp4')}
          style={styles.rhinoAnimation}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
        />
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={[styles.logoBackground as any, { opacity: 0.07 }]} 
          resizeMode="cover"
        />
        <View style={styles.rhinoOverlay} />
      </View>

      <ScrollView 
        ref={scrollRef}
        style={styles.transparentContainer} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Espaço vazio para visualização do vídeo de fundo */}
        <View style={styles.heroSpacer} />

        {/* Dashboard Preview */}
        <ThemedView style={styles.dashboardOverviewSection}>
          <AnimatedFadeIn delay={400} offsetY={30}>
            <View style={styles.hudHeader}>
              <View style={styles.hudHeaderLeft}>
                <View style={styles.hudSquare} />
                <ThemedText type="subtitle" style={styles.dashboardOverviewTitle}>A JORNADA ISBRAV: FUNDADA EM 2026</ThemedText>
              </View>
              <View style={styles.hudLine} />
              <ThemedText style={styles.hudStatus}>[ SYSTEM_OPTIMIZED: v1.0.4 ]</ThemedText>
            </View>
            
            <View style={styles.storyContainer}>
              <ThemedText style={styles.storyText}>
                Em um futuro não tão distante, precisamente em 2026, a ISBRAV foi concebida sob a premissa de que a saúde não deveria ser um labirinto burocrático. Nascemos da fusão entre a engenharia de precisão e a necessidade vital de humanizar a gestão clínica.
              </ThemedText>
              <ThemedText style={styles.storyText}>
                Nossa fundação marcou o fim dos processos desconectados. Criamos um ecossistema onde agendamentos, prontuários e inteligência operacional convergem em um único fluxo de dados contínuo. Nosso intuito foi, e sempre será, prover o "cérebro digital" para clínicas que buscam a excelência em cada batimento.
              </ThemedText>
              <ThemedText style={styles.storyText}>
                Hoje, a ISBRAV ajuda centenas de especialistas a recuperarem o que têm de mais valioso: o tempo. Tempo para focar no diagnóstico, tempo para focar no cuidado, enquanto nossa infraestrutura garante que o gerenciamento ocorra com a fluidez de um código perfeito.
              </ThemedText>
            </View>
          </AnimatedFadeIn>
        </ThemedView>

        {/* Soluções (Grid no PC, Carousel no Mobile) */}
        <ThemedView 
          style={styles.featuresCarouselSection}
          onLayout={(e) => setSolutionsY(e.nativeEvent.layout.y)}
        >
          <ThemedText type="subtitle" style={styles.sectionTitle}>Nossas Soluções</ThemedText> 
          {isWeb ? (
            <View style={styles.servicesGrid}>
              <View style={styles.serviceGridItem}>
                <FeatureCard icon="bolt.fill" title="Agilidade" description="Fluxo de atendimento inteligente." />
              </View>
              <View style={styles.serviceGridItem}>
                <FeatureCard icon="shield.lefthalf.filled" title="Segurança" description="Dados criptografados e LGPD." />
              </View>
              <View style={styles.serviceGridItem}>
                <FeatureCard icon="chart.bar.fill" title="Análise" description="Decisões baseadas em dados." />
              </View>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuresCarouselContent} snapToInterval={windowWidth * 0.8 + 20}>
              <View style={{ width: windowWidth * 0.8 }}>
                <FeatureCard icon="bolt.fill" title="Agilidade" description="Atendimento inteligente." />
              </View>
              <View style={{ width: windowWidth * 0.8 }}>
                <FeatureCard icon="shield.lefthalf.filled" title="Segurança" description="Dados seguros." />
              </View>
              <View style={{ width: windowWidth * 0.8 }}>
                <FeatureCard icon="chart.bar.fill" title="Análise" description="Relatórios reais." />
              </View>
            </ScrollView>
          )}
        </ThemedView>

        {/* Equipe */}
        <ThemedView style={styles.teamSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Nossa Equipe</ThemedText>
          <View style={[styles.teamGrid, { flexDirection: isWeb ? 'row' : 'column', gap: 20 }]}>
            <TeamCard name="Israel Almeida" role="Co-founder & Tech Lead" />
            <TeamCard name="Bruno Valente" role="Co-founder & Operations" />
            <TeamCard name="Rafael Santos" role="Co-founder & Product" />
          </View>
        </ThemedView>

        {/* Depoimentos Carousel */}
        <ThemedView style={styles.testimonialsSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>O que Nossos Clientes Dizem</ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={[styles.testimonialsScroll, { justifyContent: isWeb ? 'center' : 'flex-start' }]}
            style={styles.fullWidth}
          >
            <TestimonialCard text="O ISBRAV revolucionou nossa gestão." author="Dra. Ana Paula" clinic="Clínica Saúde" isWeb={isWeb} windowWidth={windowWidth} />
            <TestimonialCard text="Faturamento aumentou em 30%." author="Dr. Carlos" clinic="Centro Médico" isWeb={isWeb} windowWidth={windowWidth} />
            <TestimonialCard text="Suporte impecável." author="Juliana Costa" clinic="Bem Estar" isWeb={isWeb} windowWidth={windowWidth} />
          </ScrollView>
        </ThemedView>

        {/* Planos Section */}
        <ThemedView 
          style={styles.pricingSection}
          onLayout={(e) => setPlansY(e.nativeEvent.layout.y)}
        >
          <View style={styles.hudHeader}>
            <View style={styles.hudLine} />
            <ThemedText style={styles.dashboardOverviewTitle}>ESCALABILIDADE DE INFRAESTRUTURA</ThemedText>
            <View style={styles.hudLine} />
          </View>

          <TouchableOpacity 
            style={styles.billingToggle} 
            onPress={() => setIsAnnual(!isAnnual)}
            activeOpacity={1}
          >
            <View style={[styles.toggleBackground, isAnnual && styles.toggleBackgroundActive]}>
              <View style={[styles.toggleKnob, isAnnual && styles.toggleKnobActive]} />
            </View>
            <ThemedText style={styles.toggleLabel}>
              {isAnnual ? 'FATURAMENTO ANUAL [ -20% ]' : 'FATURAMENTO MENSAL'}
            </ThemedText>
          </TouchableOpacity>

          <View style={[styles.pricingGrid, { flexDirection: isWeb ? 'row' : 'column', gap: 20 }]}>
            <PricingCard 
              plan="Core" 
              price={isAnnual ? "R$ 159" : "R$ 199"} 
              features={["Agendamento", "Prontuário", "Suporte"]} 
              isWeb={isWeb}
              icon="bolt.fill"
            />
            <PricingCard 
              plan="Advanced" 
              price={isAnnual ? "R$ 319" : "R$ 399"} 
              features={["Core + Financeiro", "BI Dashboard", "Multi-unidade"]} 
              isHighlighted 
              isWeb={isWeb}
              icon="shield.lefthalf.filled"
            />
            <PricingCard 
              plan="Quantum" 
              price="CUSTOM" 
              features={["Infra Dedicada", "API Access", "Uptime SLA"]} 
              isWeb={isWeb}
              icon="bubbles.and.sparkles.fill"
            />
          </View>
        </ThemedView>

        {/* FAQ e Empresa */}
        <ThemedView style={styles.faqSection}>
          <IconSymbol name="questionmark.circle.fill" size={48} color="#FFD700" style={{ marginBottom: 20 }} />
          <ThemedText type="subtitle" style={styles.sectionTitle}>CENTRAL DE INTELIGÊNCIA & SUPORTE</ThemedText>
          <View style={styles.faqGrid}>
            <View style={styles.faqItem}>
              <Collapsible title="Segurança dos Dados">
                <ThemedText style={styles.faqAnswer}>
                  Protocolo de criptografia AES-256 e conformidade total com a LGPD. 
                  Seus dados são fragmentados e protegidos em múltiplos nós de segurança.
                </ThemedText>
              </Collapsible>
            </View>
            <View style={styles.faqItem}>
              <Collapsible title="Migração de Sistema">
                <ThemedText style={styles.faqAnswer}>
                  Uplink de dados automatizado via IA. Convertemos bases legadas 
                  para o ecossistema ISBRAV em ciclos de processamento de até 24h.
                </ThemedText>
              </Collapsible>
            </View>
          </View>

          <View style={styles.contactForm}>
            <ThemedText style={styles.contactTitle}>[ INICIALIZAR_PROTOCOLO_DE_CONTATO ]</ThemedText>
            <ThemedText style={styles.contactSubtitle}>Insira suas credenciais para consultoria técnica especializada.</ThemedText>
            <TextInput 
              style={styles.contactInput} 
              placeholder="NOME_COMPLETO_IDENTIFICADOR" 
              placeholderTextColor="#444"
              value={contactName}
              onChangeText={setContactName}
            />
            <TextInput 
              style={styles.contactInput} 
              placeholder="EMAIL_DE_CONTATO_COMM" 
              placeholderTextColor="#444"
              value={contactEmail}
              onChangeText={setContactEmail}
              keyboardType="email-address"
            />
            <TextInput 
              style={styles.contactInput} 
              placeholder="WHATSAPP_UPLINK_NUM" 
              placeholderTextColor="#444"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={styles.contactSubmitBtn} activeOpacity={0.8}>
              <ThemedText style={styles.contactSubmitText}>EXECUTAR_UPLINK_DE_DADOS</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        <View style={styles.footerSection}>
          <View style={styles.scanLine} />
          <View style={styles.footerLogoContainer}>
            <ThemedText style={styles.massiveLogoText}>ISBRAV</ThemedText>
          </View>
          <AnimatedFadeIn style={styles.footerContent} delay={500}>
            <ThemedText style={styles.footerTag}>[ UPLINK_STATUS: ACTIVE ]</ThemedText>
            <ThemedText style={styles.footerTitle}>TRANSFORME SUA CLÍNICA EM UM HUB DE ALTA PERFORMANCE.</ThemedText>
            
            <View style={styles.terminalContainer}>
              <View style={styles.terminalHeader}>
                <View style={styles.terminalDot} />
                <ThemedText style={styles.terminalTitle}>SECURE_ACCESS_V1.0.4</ThemedText>
              </View>
              <View style={styles.terminalBody}>
                {systemLogs.map((log, i) => (
                  <ThemedText key={i} style={styles.terminalLogText}>{log}</ThemedText>
                ))}
                <View style={styles.inputRow}>
                  <ThemedText style={styles.terminalPrompt}>$ JOIN_ECOSYSTEM_EMAIL:</ThemedText>
                  <ThemedText style={styles.terminalCursor}>_</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.systemReadout}>
              <ThemedText style={styles.readoutText}>LOCAL_NODE: ONLINE</ThemedText>
              <ThemedText style={styles.readoutText}>ENCRYPTION: AES-256</ThemedText>
              <ThemedText style={styles.readoutText}>STATUS: READY</ThemedText>
            </View>
            
            <ThemedText style={styles.footerCopyright}>ISBRAV® OS v1.0.4 | 2024 ENCRYPTED_CONNECTION</ThemedText>
          </AnimatedFadeIn>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const { width: staticWidth } = Dimensions.get('window');
const isWebStatic = staticWidth > 768;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  transparentContainer: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Escurecido para melhor contraste no Blur
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
    ...Platform.select({
      web: { backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)' } as any,
    }),
  },
  navInner: {
    flex: 1,
    maxWidth: 1100, // Centraliza os elementos da Navbar um pouco mais
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
  },
  navLogo: { width: 100, height: 40 },
  navLinks: { flexDirection: 'row', gap: 35 },
  navLink: { color: '#FFF', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  navLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 2,
  },
  navLoginText: { color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  rhinoBackgroundContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 },
  rhinoAnimation: { ...StyleSheet.absoluteFillObject },
  logoBackground: { position: 'absolute', width: '100%', height: '100%', zIndex: 1 },
  rhinoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  heroSpacer: { height: Dimensions.get('window').height * 0.7, width: '100%' },
  stickyWrapper: { width: '100%', alignItems: 'center', zIndex: 10, backgroundColor: 'transparent' },
  hero: { paddingVertical: 80, paddingHorizontal: 20, alignItems: 'center', width: '100%', borderBottomWidth: 3, borderBottomColor: '#FFD700' },
  heroSubtitle: { textAlign: 'center', color: '#AAA', maxWidth: 700, marginVertical: 30, lineHeight: 24 },
  ctaButton: { backgroundColor: '#FFD700', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  ctaText: { color: '#000', fontWeight: 'bold' },
  statsBar: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)', 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 100, 
    borderWidth: 1.5, 
    borderColor: 'rgba(255, 215, 0, 0.4)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    alignSelf: 'center',
    gap: 15,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    marginTop: 10,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  statLabel: { color: '#888', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  statValue: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  statValueActive: { color: '#4CAF50', fontWeight: 'bold', fontSize: 13 },
  statSeparator: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 5 },
  dashboardOverviewSection: { paddingVertical: 100, alignItems: 'center', width: '100%' },
  hudHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 50, 
    gap: 20, 
    width: '100%', 
    paddingHorizontal: 20,
    maxWidth: 1100, // Limita a expansão do HUD para manter o foco central
    alignSelf: 'center' 
  },
  hudHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hudSquare: { width: 14, height: 14, backgroundColor: '#FFD700' },
  hudLine: { height: 1, flex: 1, backgroundColor: 'rgba(255, 215, 0, 0.15)' },
  storyContainer: {
    maxWidth: 850,
    paddingHorizontal: 20,
    gap: 20,
    marginTop: 10,
  },
  storyText: {
    color: '#CCC',
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0.5,
  },
  hudStatus: { color: '#666', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 },
  dashboardOverviewTitle: { color: '#FFF', fontSize: 16, letterSpacing: 4, fontWeight: '900' },
  dashboardMetricsGrid: { 
    width: '100%', 
    paddingHorizontal: 20,
    maxWidth: 1100, // Alinha as métricas com o cabeçalho HUD
    alignSelf: 'center' 
  },
  metricCard: { backgroundColor: 'rgba(12, 12, 12, 0.7)', padding: 25, borderRadius: 2, alignItems: 'flex-start', flex: 1, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.1)', borderTopWidth: 4, borderTopColor: '#FFD700' },
  metricCardHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  hudLabel: { color: '#444', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 },
  metricValueContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  metricValue: { color: '#FFF', fontSize: 44, fontWeight: '900' },
  metricUnit: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', opacity: 0.6 },
  metricLabel: { color: '#666', fontSize: 9, letterSpacing: 3, fontWeight: 'bold', marginTop: 5 },
  dataCard: { backgroundColor: '#050505', padding: 30, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.05)', marginTop: 30, overflow: 'hidden' },
  chartTitle: { color: '#333', fontSize: 10, letterSpacing: 2, marginBottom: 30, textAlign: 'center', fontWeight: 'bold' },
  chartGridOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.03, backgroundColor: 'transparent', borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#FFD700' },
  scanEffect: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#FFD700', opacity: 0.05 },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 200, gap: 12 },
  chartBar: { width: isWebStatic ? 45 : 30, backgroundColor: '#FFD700', borderRadius: 1 },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)', paddingTop: 15 },
  chartLegend: { color: '#222', fontSize: 8, letterSpacing: 1, fontWeight: 'bold' },
  featuresCarouselSection: { paddingVertical: 50, width: '100%', alignItems: 'center' },
  featuresCarouselContent: { paddingHorizontal: 20, gap: 15 },
  servicesGrid: { flexDirection: 'row', gap: 20, paddingHorizontal: 20, maxWidth: 1100, width: '100%', justifyContent: 'center' },
  serviceGridItem: { width: 320, minHeight: 250 }, // Largura fixa no PC para evitar o efeito "esticado"
  card: { backgroundColor: '#1A1A1A', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#333', width: '100%', height: '100%' },
  cardTitle: { color: '#FFF', marginTop: 15, fontSize: 18 },
  cardDesc: { color: '#888', fontSize: 14, marginTop: 8 },
  teamSection: { paddingVertical: 50, width: '100%', alignItems: 'center' },
  teamGrid: { width: '100%', maxWidth: 900, gap: 20, paddingHorizontal: 20 },
  teamCard: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 20, alignItems: 'center', flex: 1, borderWidth: 1, borderColor: '#333' },
  teamIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#FFD700' },
  teamName: { color: '#FFF', fontSize: 16 },
  teamRole: { color: '#FFD700', fontSize: 12 },
  testimonialsSection: { paddingVertical: 60, width: '100%', alignItems: 'center' },
  testimonialsScroll: { paddingHorizontal: 20, gap: 20, alignItems: 'stretch' },
  testimonialCard: { backgroundColor: '#1A1A1A', padding: 25, borderRadius: 15, borderLeftWidth: 4, borderLeftColor: '#FFD700' },
  testimonialText: { color: '#CCC', fontSize: 15, fontStyle: 'italic', marginBottom: 15 },
  testimonialAuthor: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },
  testimonialClinic: { color: '#777', fontSize: 12 },
  pricingSection: { paddingVertical: 80, paddingHorizontal: 20, width: '100%', alignItems: 'center' },
  pricingGrid: { 
    width: '100%', 
    maxWidth: 1100, // Padroniza a largura dos planos com o resto do dashboard
    marginTop: 40,
    alignSelf: 'center'
  },
  pricingCard: { backgroundColor: 'rgba(26, 26, 26, 0.4)', padding: 35, borderRadius: 4, alignItems: 'flex-start', flex: 1, borderWidth: 1, borderColor: '#333' },
  pricingCardHighlighted: { backgroundColor: '#FFD700' },
  planHeader: { width: '100%', marginBottom: 20 },
  planIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  planDivider: { width: 40, height: 2, backgroundColor: '#FFD700', marginBottom: 25 },
  pricingPrice: { color: '#FFF', fontSize: 44, fontWeight: '900' },
  pricingPeriod: { color: '#888', fontSize: 14, marginBottom: 20 },
  pricingFeatures: { width: '100%', marginBottom: 25 },
  pricingFeatureItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  pricingFeatureText: { color: '#AAA', fontSize: 13 },
  pricingCta: { backgroundColor: 'transparent', width: '100%', paddingVertical: 15, borderRadius: 2, alignItems: 'center', borderWidth: 1, borderColor: '#FFD700' },
  pricingCtaHighlighted: { backgroundColor: '#000', borderColor: '#000' },
  pricingCtaText: { color: '#FFD700', fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  billingToggle: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 50, backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 50 },
  toggleBackground: { width: 50, height: 26, backgroundColor: '#333', borderRadius: 20, padding: 3 },
  toggleBackgroundActive: { backgroundColor: '#FFD700' },
  toggleKnob: { width: 20, height: 20, backgroundColor: '#888', borderRadius: 10 },
  toggleKnobActive: { transform: [{ translateX: 24 }], backgroundColor: '#000' },
  toggleLabel: { color: '#FFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  sectionTitle: { color: '#FFD700', fontSize: 28, marginBottom: 40, textAlign: 'center', fontWeight: 'bold' },
  fullWidth: { width: '100%' },
  footerSection: { paddingVertical: 150, width: '100%', backgroundColor: '#000', alignItems: 'center', overflow: 'hidden' },
  scanLine: { position: 'absolute', top: 0, width: '100%', height: 2, backgroundColor: '#FFD700', opacity: 0.1 },
  footerLogoContainer: { position: 'absolute', top: 60, width: '100%', alignItems: 'center', opacity: 0.03 },
  massiveLogoText: { fontSize: 220, fontWeight: '900', color: '#FFF', letterSpacing: -15 },
  footerContent: { alignItems: 'center', zIndex: 2, paddingHorizontal: 20 },
  terminalContainer: { width: '100%', maxWidth: 600, backgroundColor: '#050505', borderRadius: 8, borderWidth: 1, borderColor: '#333', marginTop: 40, overflow: 'hidden' },
  terminalHeader: { backgroundColor: '#111', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  terminalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  terminalTitle: { color: '#666', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  terminalBody: { padding: 20, gap: 5 },
  terminalLogText: { color: '#4CAF50', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', opacity: 0.7 },
  inputRow: { flexDirection: 'row', marginTop: 10 },
  terminalPrompt: { color: '#FFD700', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold' },
  terminalCursor: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },
  footerTag: { color: '#FFD700', letterSpacing: 4, fontSize: 10, marginBottom: 25, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  footerTitle: { color: '#FFF', fontSize: 32, textAlign: 'center', fontWeight: '900', maxWidth: 500, lineHeight: 40, letterSpacing: 1 },
  systemReadout: { flexDirection: 'row', gap: 20, marginTop: 60, opacity: 0.4 },
  readoutText: { color: '#FFF', fontSize: 8, letterSpacing: 1 },
  footerCopyright: { color: '#222', fontSize: 9, letterSpacing: 2, marginTop: 40, fontWeight: 'bold' },
  faqSection: { paddingVertical: 80, paddingHorizontal: 20, width: '100%', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.02)' },
  faqGrid: { width: '100%', maxWidth: 800, gap: 15 },
  faqItem: { backgroundColor: '#111', borderRadius: 15, padding: 10, borderWidth: 1, borderColor: '#222' },
  faqAnswer: { color: '#AAA', padding: 15, lineHeight: 22, backgroundColor: '#000', borderRadius: 10, marginTop: 10 },
  contactForm: { width: '100%', maxWidth: 600, marginTop: 60, padding: 30, backgroundColor: 'rgba(255, 215, 0, 0.02)', borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.1)' },
  contactTitle: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10, textAlign: 'center' },
  contactSubtitle: { color: '#666', fontSize: 9, textAlign: 'center', marginBottom: 25, letterSpacing: 1 },
  contactInput: { backgroundColor: '#050505', color: '#FFF', padding: 15, borderRadius: 2, marginBottom: 15, borderWidth: 1, borderColor: '#222', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13 },
  contactSubmitBtn: { backgroundColor: '#FFD700', padding: 18, alignItems: 'center', borderRadius: 2, marginTop: 10 },
  contactSubmitText: { color: '#000', fontWeight: '900', letterSpacing: 2, fontSize: 12 },
});