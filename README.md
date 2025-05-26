# MinC Testes Frontend

Interface gráfica para execução de testes automatizados para o frontend do Sistema do Ministério da Cultura.

## Como Distribuir para Windows

Este projeto pode ser distribuído para máquinas Windows sem necessidade de instalação prévia do Node.js, Playwright ou qualquer outra dependência. O aplicativo é totalmente autônomo e pode ser executado diretamente em qualquer computador Windows moderno.

### Opção 1: Arquivo ZIP (Mais Simples)

1. Baixe o arquivo `TesteFrontApp-win32-x64.zip`
2. Extraia o arquivo para qualquer pasta no seu computador
3. Navegue até a pasta extraída e dê um duplo clique em `TesteFrontApp.exe`
4. O aplicativo será iniciado automaticamente

### Opção 2: Instalador (Recomendado)

1. Baixe o arquivo `TesteFrontApp-Installer.exe`
2. Execute o instalador e siga as instruções na tela
3. Após a instalação, o aplicativo poderá ser encontrado no Menu Iniciar ou na área de trabalho
4. Dê um duplo clique no ícone para iniciar o aplicativo

## Utilizando o Aplicativo

### 1. Configuração de Autenticação

Primeiro, é necessário configurar a autenticação:

1. Selecione o ambiente alvo (HMG2, UPD ou PROD)
2. Obtenha os cookies necessários:
   - Faça login no ambiente selecionado usando seu navegador
   - Acesse as Ferramentas de Desenvolvedor (F12)
   - Vá para a aba "Application" (ou "Storage"), depois "Cookies"
   - Copie os valores dos seguintes cookies:
     - `mapasculturais.uid`
     - `PHPSESSID`
3. Cole os valores dos cookies nos campos correspondentes
4. Clique em "Generate auth.json"
5. Aguarde a confirmação de sucesso

### 2. Executando os Testes

Após gerar o arquivo `auth.json`, você pode executar os testes:

- **Execute todos os testes**: Clique no botão "Run All Tests"
- **Execute testes específicos**: Clique no botão correspondente ao tipo de teste desejado:
  - Run Agente Test
  - Run Espaço Test
  - Run Evento Test
  - Run Oportunidade Test
  - Run Projeto Test

Durante a execução do teste, o aplicativo abrirá automaticamente um navegador Chrome e realizará as operações de teste. Você poderá acompanhar o progresso na interface.

### 3. Visualizando Resultados

Os resultados do teste serão exibidos na interface após a conclusão. Se necessário, você pode:

- Cancelar um teste em execução clicando no botão "Stop Execution"
- Visualizar logs detalhados na área de resultados
- Executar novos testes conforme necessário

## Resolução de Problemas

### O aplicativo não inicia

- Verifique se você tem permissões de administrador na sua máquina
- Certifique-se de que o antivírus não está bloqueando a execução
- Tente extrair o arquivo ZIP para um caminho mais curto (ex: `C:\TesteFront`)

### Erro ao gerar auth.json

- Verifique se os valores dos cookies estão corretos
- Tente fazer login novamente no ambiente alvo para obter cookies atualizados
- Verifique sua conexão com a internet

### Testes falham ou não são executados

- Verifique se o auth.json foi gerado com sucesso
- Certifique-se de que você tem permissões suficientes no ambiente alvo
- Verifique se o ambiente alvo está acessível a partir da sua rede

### Outros erros

Se você encontrar outros problemas:

1. Reinicie o aplicativo
2. Verifique se há atualizações disponíveis
3. Entre em contato com a equipe de suporte técnico

## Para Desenvolvedores

### Construindo o Aplicativo a partir do Código Fonte

Para construir o aplicativo a partir do código fonte:

1. Clone o repositório
2. Instale as dependências:
   ```
   npm run setup
   ```
3. Execute o aplicativo em modo de desenvolvimento:
   ```
   npm start
   ```
4. Para criar um pacote distribuível:
   ```
   npm run build:full
   ```

Os arquivos distribuíveis serão gerados na pasta `dist/`.


```
# Compila TypeScript, copia assets, e empacota como .exe
npm run build

# Para incluir navegadores Playwright no pacote
npm run embed-playwright

# Para criar um arquivo zip final
npm run build:full
```
