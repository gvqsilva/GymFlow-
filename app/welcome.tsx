import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  // Marcar que o usuário viu a tela de welcome
  useEffect(() => {
    const markWelcomeSeen = async () => {
      try {
        await AsyncStorage.setItem('has_seen_welcome', 'true');
        console.log('✅ Welcome screen vista - marcada no AsyncStorage');
      } catch (error) {
        console.warn('Erro ao marcar welcome como vista:', error);
      }
    };
    markWelcomeSeen();
  }, []);

  const goToLogin = () => {
    console.log('🔗 Navegando para login...');
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com gradiente roxo */}
      <View style={styles.header}>
        <View style={styles.headerCurve} />
      </View>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="fitness" size={50} color="#667eea" />
        </View>
        <Text style={styles.logoText}>GymFlow</Text>
      </View>

      {/* Frase de boas-vindas */}
      <View style={styles.welcomeTextContainer}>
        <Text style={styles.welcomeText}>
          Transforme seu treino em{'\n'}
          <Text style={styles.welcomeTextBold}>resultados reais</Text>
        </Text>
      </View>

      {/* Cards de vantagens */}
      <View style={styles.benefitsContainer}>
        <View style={styles.benefitCard}>
          <Ionicons name="trending-up-outline" size={24} color="#667eea" />
          <Text style={styles.benefitText}>
            Acompanhe seu progresso com gráficos detalhados
          </Text>
        </View>

        <View style={styles.benefitCard}>
          <Ionicons name="people-outline" size={24} color="#667eea" />
          <Text style={styles.benefitText}>
            Compartilhe conquistas com a comunidade
          </Text>
        </View>

        <View style={styles.benefitCard}>
          <Ionicons name="cloud-upload-outline" size={24} color="#667eea" />
          <Text style={styles.benefitText}>
            Backup automático na nuvem com conta criada
          </Text>
        </View>
      </View>

      {/* Botões principais */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={goToLogin}>
          <Text style={styles.primaryButtonText}>Entrar / Criar uma conta</Text>
        </TouchableOpacity>
      </View>

      {/* Footer com gradiente roxo */}
      <View style={styles.footer}>
        <View style={styles.footerCurve} />
      </View>

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    height: height * 0.15,
    position: 'relative',
  },
  headerCurve: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.15,
    backgroundColor: '#667eea',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: -30,
    marginBottom: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    marginBottom: 15,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeTextContainer: {
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    textAlign: 'center',
    color: '#333',
    lineHeight: 32,
  },
  welcomeTextBold: {
    fontWeight: 'bold',
    color: '#667eea',
  },
  benefitsContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  benefitText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e8ecef',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#e8ecef',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    height: height * 0.06,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.06,
    backgroundColor: '#667eea',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
});