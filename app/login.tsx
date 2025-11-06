import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { authService } from '../services/authService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEmailNotVerified, setIsEmailNotVerified] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [hasAutoLogin, setHasAutoLogin] = useState(false);
  const router = useRouter();

  // Carregar email salvo quando a tela carregar
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedEmail = await authService.getSavedEmail();
        const hasSavedCredentials = await authService.hasSavedCredentials();
        
        if (savedEmail) {
          setEmail(savedEmail);
          console.log('📧 Email salvo carregado:', savedEmail);
        }
        
        if (hasSavedCredentials) {
          setHasAutoLogin(true);
          console.log('🔑 Credenciais salvas detectadas');
        }
      } catch (error) {
        console.warn('Erro ao carregar dados salvos:', error);
      }
    };
    loadSavedData();
  }, []);

  const goToApp = () => {
    router.replace('/(tabs)');
  };

  const toggleAuthMode = () => {
    setIsRegister(!isRegister);
    // Limpar campos ao alternar entre login e registro
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowForgotPassword(false);
    setResetEmail('');
    setIsEmailNotVerified(false);
    setPendingEmail('');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Email e senha são necessários' });
      return;
    }
    setLoading(true);
    setIsEmailNotVerified(false);
    try {
      await authService.signInWithEmail(email.trim(), password);
      await AsyncStorage.setItem('has_seen_login', 'true');
      Toast.show({ type: 'success', text1: 'Login bem sucedido' });
      
      // Redirecionar sempre para a tela home após login
      console.log('🏠 Redirecionando para a tela home após login');
      goToApp();
    } catch (error: any) {
      if (error?.message === 'EMAIL_NOT_VERIFIED') {
        setIsEmailNotVerified(true);
        setPendingEmail(email.trim());
        Toast.show({ 
          type: 'error', 
          text1: 'Email não verificado', 
          text2: 'Verifique seu email antes de fazer login' 
        });
      } else {
        Toast.show({ type: 'error', text1: 'Erro no login', text2: error?.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Nome é obrigatório' });
      return;
    }
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Email e senha são necessários' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'As senhas não coincidem' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }
    setLoading(true);
    try {
      await authService.registerWithEmail(email.trim(), password);
      await AsyncStorage.setItem('user_name', name.trim());
      Toast.show({ 
        type: 'success', 
        text1: 'Conta criada com sucesso!', 
        text2: 'Verifique seu email para ativar a conta' 
      });
      
      // Limpar formulário e alternar para modo login
      setEmail('');
      setPassword('');
      setName('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setIsRegister(false);
      
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erro ao criar conta', text2: error?.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingEmail) return;
    
    setLoading(true);
    try {
      await authService.resendVerificationEmail();
      Toast.show({ 
        type: 'success', 
        text1: 'Email reenviado', 
        text2: 'Verifique sua caixa de entrada' 
      });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erro ao reenviar', text2: error?.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!pendingEmail) return;
    
    setLoading(true);
    try {
      const isVerified = await authService.checkEmailVerification();
      if (isVerified) {
        setIsEmailNotVerified(false);
        setPendingEmail('');
        Toast.show({ 
          type: 'success', 
          text1: 'Email verificado!', 
          text2: 'Agora você pode fazer login' 
        });
      } else {
        Toast.show({ 
          type: 'info', 
          text1: 'Email ainda não verificado', 
          text2: 'Verifique sua caixa de entrada' 
        });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erro ao verificar', text2: error?.message });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Toast.show({ type: 'error', text1: 'Digite seu email' });
      return;
    }
    
    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      Toast.show({ type: 'error', text1: 'Email inválido' });
      return;
    }
    
    setLoading(true);
    try {
      await authService.sendPasswordReset(resetEmail.trim());
      Toast.show({ 
        type: 'success', 
        text1: 'Email enviado!', 
        text2: 'Verifique sua caixa de entrada para redefinir a senha' 
      });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erro ao enviar email', text2: error?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com gradiente roxo */}
      <View style={styles.header}>
        <View style={styles.headerCurve} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="fitness" size={50} color="#667eea" />
            </View>
            <Text style={styles.logoText}>GymFlow</Text>
          </View>

          {/* Frase motivacional */}
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>
              {showForgotPassword 
                ? 'Não se preocupe, vamos ajudá-lo a recuperar sua conta' 
                : 'Entre na sua conta para continuar sua jornada'
              }
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {showForgotPassword ? (
              // Formulário de recuperação de senha
              <>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color="#667eea" />
                  <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>

                <View style={styles.forgotPasswordHeader}>
                  <Ionicons name="key-outline" size={48} color="#667eea" />
                  <Text style={styles.title}>Redefinir senha</Text>
                </View>
                
                <Text style={styles.forgotPasswordDescription}>
                  Digite seu email para receber as instruções de redefinição de senha
                </Text>
                
                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#667eea" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Digite seu email"
                      placeholderTextColor="#999"
                      value={resetEmail}
                      onChangeText={setResetEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus={true}
                    />
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleForgotPassword}
                    disabled={loading || !resetEmail.trim()}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Enviar email</Text>
                        <Ionicons 
                          name="send-outline" 
                          size={20} 
                          color="#ffffff" 
                          style={styles.buttonIcon} 
                        />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // Formulário de login/registro normal
              <>
                <Text style={styles.title}>
                  {isRegister ? 'Criar Conta' : 'Bem-vindo de volta'}
                </Text>
                
                <View style={styles.form}>
              {isRegister && (
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#667eea" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nome completo"
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>

              {!isRegister && (
                <TouchableOpacity 
                  style={styles.forgotPasswordButton}
                  onPress={() => {
                    setResetEmail(email); // Preencher com o email do campo de login
                    setShowForgotPassword(true);
                  }}
                >
                  <Text style={styles.forgotPasswordText}>Esqueci minha senha  </Text>
                </TouchableOpacity>
              )}

              {isRegister && (
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#667eea" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmar senha"
                    placeholderTextColor="#999"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCorrect={false}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]}
                onPress={isRegister ? handleRegister : handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>
                      {isRegister ? 'Criar Conta' : 'Entrar'}
                    </Text>
                    <Ionicons 
                      name="arrow-forward" 
                      size={20} 
                      color="#ffffff" 
                      style={styles.buttonIcon} 
                    />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.toggleButton}
                onPress={toggleAuthMode}
              >
                <Text style={styles.toggleText}>
                  {isRegister ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
                </Text>
                <Text style={styles.toggleTextBold}>
                  {isRegister ? 'Entre aqui' : 'Cadastre-se'}
                </Text>
              </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Card de verificação de email (mostrar apenas quando necessário) */}
          {isEmailNotVerified && (
            <View style={styles.verificationCard}>
              <View style={styles.verificationHeader}>
                <Ionicons name="mail-outline" size={32} color="#667eea" />
                <Text style={styles.verificationTitle}>Verifique seu email</Text>
              </View>
              
              <Text style={styles.verificationText}>
                Enviamos um email de verificação para{'\n'}
                <Text style={styles.verificationEmail}>{pendingEmail}</Text>
              </Text>
              
              <Text style={styles.verificationInstructions}>
                Clique no link do email para ativar sua conta. Depois, clique em "Verificar" para continuar.
              </Text>
              
              <View style={styles.verificationButtons}>
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton, { flex: 1 }]}
                  onPress={handleResendVerification}
                  disabled={loading}
                >
                  <Ionicons name="refresh-outline" size={16} color="#667eea" />
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                    Reenviar
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.primaryButton, { flex: 1 }]}
                  onPress={handleCheckVerification}
                  disabled={loading}
                >
                  <Ionicons name="checkmark-outline" size={16} color="#ffffff" />
                  <Text style={styles.buttonText}>
                    Verificar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

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
    height: height * 0.10,
    position: 'relative',
  },
  headerCurve: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.10,
    backgroundColor: '#667eea',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'space-between',
    paddingBottom: height * 0.08, // Espaço para o footer
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: -20,
    marginBottom: 30,
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
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e8ecef',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#fafbfc',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    height: 56,
  },
  primaryButton: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#e8ecef',
  },
  secondaryButtonText: {
    color: '#667eea',
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
  toggleButton: {
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  toggleText: {
    color: '#666',
    fontSize: 14,
  },
  toggleTextBold: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  benefits: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  benefitText: {
    color: '#333',
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '500',
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
  verificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8f2ff',
  },
  verificationHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  verificationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  verificationEmail: {
    fontWeight: '600',
    color: '#667eea',
  },
  verificationInstructions: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  verificationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  forgotPasswordText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  forgotPasswordHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
});
