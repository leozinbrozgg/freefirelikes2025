# 🔐 Sistema de Controle de Acesso

## Como Funciona

O sistema agora requer um código de acesso para ser utilizado. Quando um usuário acessa a aplicação:

1. **Verificação Automática**: O sistema verifica se o usuário já tem acesso válido
2. **Modal de Acesso**: Se não tiver acesso, exibe um modal solicitando o código
3. **Validação**: Verifica se o código inserido está correto
4. **Acesso Temporário**: O acesso é válido por 24 horas (configurável)

## 🛠️ Configuração

### Alterar o Código de Acesso

Para alterar o código de acesso, edite o arquivo `src/config/access.ts`:

```typescript
export const ACCESS_CONFIG = {
  // Altere este código para vender acesso
  VALID_ACCESS_CODE: 'SEU_CODIGO_AQUI',
  
  // Tempo de expiração em horas (padrão: 24 horas)
  ACCESS_EXPIRATION_HOURS: 24,
  
  // Mensagens personalizáveis
  MESSAGES: {
    INVALID_CODE: 'Código de acesso inválido...',
    // ... outras mensagens
  }
};
```

### Exemplo de Uso

1. **Código Padrão**: `FF2024`
2. **Para Vender Acesso**: Altere para `VIP2024` ou qualquer código desejado
3. **Expiração**: Configure o tempo de acesso (em horas)

## 🔧 Funcionalidades

- ✅ **Modal de Acesso**: Interface amigável para inserção do código
- ✅ **Validação em Tempo Real**: Feedback imediato sobre códigos inválidos
- ✅ **Acesso Temporário**: Expira automaticamente após o tempo configurado
- ✅ **Persistência**: Mantém o acesso entre sessões do navegador
- ✅ **Segurança**: Código sensível a maiúsculas/minúsculas

## 📱 Interface do Usuário

O modal de acesso inclui:
- 🔒 Ícone de segurança
- 📝 Campo para inserir o código
- ⚠️ Mensagens de erro claras
- ✅ Botão de acesso com feedback visual
- 💡 Dicas para o usuário

## 🚀 Como Vender Acesso

1. **Defina seu código**: Altere `VALID_ACCESS_CODE` no arquivo de configuração
2. **Configure expiração**: Ajuste `ACCESS_EXPIRATION_HOURS` conforme necessário
3. **Personalize mensagens**: Modifique as mensagens em `MESSAGES`
4. **Deploy**: Faça o deploy da aplicação com as novas configurações

## 🔄 Renovação de Acesso

- O acesso expira automaticamente após o tempo configurado
- Usuários precisam inserir o código novamente após a expiração
- Ideal para vendas de acesso temporário

## 📊 Monitoramento

O sistema salva no localStorage:
- `ff-access-granted`: Status do acesso
- `ff-access-time`: Timestamp do acesso concedido

Isso permite verificar quando o acesso foi concedido e quando expira.
