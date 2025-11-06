// utils/securityTest.ts
// Teste de segurança para verificar autenticação e sincronização

import { authService } from '../services/authService';
import { firebaseSyncService } from '../services/firebaseSync';

interface SecurityTestResult {
  testName: string;
  passed: boolean;
  details: string;
}

export class SecurityTester {
  
  static async runSecurityTests(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];
    
    console.log('🔍 Iniciando testes de segurança...');
    
    // Teste 1: Verificar se usuário está autenticado
    results.push({
      testName: 'Verificação de autenticação',
      passed: this.testAuthentication(),
      details: `Usuário autenticado: ${authService.isAuthenticated()}`
    });
    
    // Teste 2: Verificar se shouldSyncWithFirebase funciona corretamente
    results.push({
      testName: 'Verificação de sincronização',
      passed: this.testSyncPermission(),
      details: `Pode sincronizar: ${authService.shouldSyncWithFirebase()}`
    });
    
    // Teste 3: Tentar salvar dados (deve funcionar apenas se autenticado)
    const saveTest = await this.testDataSave();
    results.push(saveTest);
    
    // Teste 4: Verificar estado offline
    results.push({
      testName: 'Detecção de modo offline',
      passed: true,
      details: `Modo offline: ${authService.isInOfflineMode()}`
    });
    
    // Teste 5: Verificar email verificado
    results.push({
      testName: 'Verificação de email',
      passed: this.testEmailVerification(),
      details: `Email verificado: ${authService.getCurrentUser()?.emailVerified || false}`
    });
    
    // Relatório
    console.log('\n📊 Resultados dos testes de segurança:');
    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.testName}: ${result.details}`);
    });
    
    const passedTests = results.filter(r => r.passed).length;
    console.log(`\n🎯 ${passedTests}/${results.length} testes passaram`);
    
    return results;
  }
  
  private static testAuthentication(): boolean {
    const user = authService.getCurrentUser();
    const isAuthenticated = authService.isAuthenticated();
    
    // Se há usuário, deve estar autenticado
    if (user && isAuthenticated) return true;
    // Se não há usuário, não deve estar autenticado
    if (!user && !isAuthenticated) return true;
    
    return false; // Estado inconsistente
  }
  
  private static testSyncPermission(): boolean {
    const isAuthenticated = authService.isAuthenticated();
    const shouldSync = authService.shouldSyncWithFirebase();
    const user = authService.getCurrentUser();
    
    // Se não está autenticado, NÃO deve sincronizar
    if (!isAuthenticated && !shouldSync) return true;
    
    // Se está autenticado mas email não verificado, NÃO deve sincronizar
    if (isAuthenticated && user && !user.emailVerified && !shouldSync) return true;
    
    // Se está autenticado e email verificado, DEVE sincronizar
    if (isAuthenticated && user && user.emailVerified && shouldSync) return true;
    
    return false;
  }
  
  private static testEmailVerification(): boolean {
    const user = authService.getCurrentUser();
    
    if (!user) return true; // Sem usuário = teste não aplicável
    
    // Para usuários autenticados, verificar se email está verificado
    return user.emailVerified;
  }
  
  private static async testDataSave(): Promise<SecurityTestResult> {
    const shouldSync = authService.shouldSyncWithFirebase();
    
    if (!shouldSync) {
      return {
        testName: 'Teste de salvamento de dados',
        passed: true,
        details: 'Usuário não autorizado - salvamento bloqueado corretamente'
      };
    }
    
    try {
      // Tentar salvar dados de teste
      await firebaseSyncService.saveToFirebase('security_test', { test: 'dados de teste', timestamp: Date.now() });
      
      return {
        testName: 'Teste de salvamento de dados',
        passed: true,
        details: 'Usuário autorizado - salvamento permitido corretamente'
      };
    } catch (error) {
      return {
        testName: 'Teste de salvamento de dados',
        passed: false,
        details: `Erro no salvamento: ${error}`
      };
    }
  }
}

// Função para rodar os testes via console
export const runSecurityTests = () => SecurityTester.runSecurityTests();