function validateRequest_(payload) {
  const propertyName = ['WRITE', 'TOKEN'].join('_');
  const expectedToken = PropertiesService.getScriptProperties().getProperty(propertyName);

  if (!expectedToken) {
    throw new Error('A configuração de acesso ainda não foi concluída.');
  }
  if (!payload || !payload.token || payload.token !== expectedToken) {
    throw new Error('Acesso não autorizado.');
  }
}