export function traduzirErroFirebase(codigo: string): string {
  const mensagens: Record<string, string> = {
    'auth/email-already-in-use': 'Este e-mail já está cadastrado. Tente entrar na sua conta.',
    'auth/invalid-email': 'Digite um e-mail válido.',
    'auth/weak-password': 'A senha precisa ter no mínimo 6 caracteres.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'Não encontramos uma conta com esse e-mail.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.',
  };

  return mensagens[codigo] ?? 'Ocorreu um erro inesperado. Tente novamente.';
}