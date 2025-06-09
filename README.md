# Teste Front App MinC

Este repositório contém uma interface gráfica (Electron) para execução de testes automatizados no frontend do Sistema do Ministério da Cultura (MinC), utilizando Playwright.

## Para Desenvolvedores

### Como Rodar e Compilar Localmente

1. **Clone o repositório e instale as dependências:**
   ```sh
   git clone https://github.com/seu-usuario/Teste-Front.git
   cd Teste-Front
   npm install
   ```

2. **Execute o app em modo desenvolvimento:**
   ```sh
   npm start
   ```
   Isso irá iniciar o Electron e abrir a interface gráfica. Você pode desenvolver e testar localmente sem necessidade de empacotar o app.

3. **Compilar o projeto:**
   ```sh
   npm run build
   ```
   Isso compila o TypeScript e copia os assets necessários para a pasta de build.

4. **Empacotar para Windows (opcional):**
   Caso queira gerar um executável ou instalador, utilize:
   ```sh
   npm run build:package
   ```
   > **Atenção:** A função de empacotamento pode não estar 100% funcional. Recomenda-se rodar e testar localmente conforme instruções acima.

### Scripts Principais

- `npm run setup` — Instala dependências e prepara ambiente.
- `npm start` — Executa o app em modo desenvolvimento.
- `npm run build` — Compila TypeScript e copia assets.
- `npm run build:package` — Empacota o app para Windows.
- `npm run embed-playwright` — Incorpora navegadores Playwright ao pacote.
- `npm run embed-node` — Incorpora Node.js ao pacote.
- `npm run build:zip` — Gera o arquivo ZIP final.
- `npm run build:full` — Executa todos os passos de build e empacotamento.

### Estrutura do Projeto

- `main.js` — Backend Electron/Express.
- `public/` — Frontend HTML/CSS/JS.
- `testes/` — Scripts de teste Playwright.
- `config/` — Arquivos de configuração e autenticação.
- `contadores/` — Contadores para nomes únicos nos testes.

### Observações

- Os scripts de teste utilizam Playwright e requerem cookies válidos para autenticação.
- O app pode ser executado em modo desenvolvimento ou empacotado para distribuição.

## Como Contribuir

1. Faça um fork deste repositório.
2. Crie uma branch para sua feature ou correção:
   ```sh
   git checkout -b minha-feature
   ```
3. Faça suas alterações e commit:
   ```sh
   git commit -am "Descrição da alteração"
   ```
4. Envie para seu fork:
   ```sh
   git push origin minha-feature
   ```
5. Abra um Pull Request para o repositório principal.

Sinta-se à vontade para abrir issues para sugestões, dúvidas ou problemas encontrados.

## Visão Geral

O aplicativo permite que usuários executem testes automatizados para diferentes entidades do sistema (Agente, Espaço, Evento, Oportunidade, Projeto) de forma simples, sem necessidade de instalar Node.js ou Playwright manualmente. O sistema pode ser distribuído como executável Windows ou instalador MSI.

## Requisitos

- **Para usuários finais:**  
  Não é necessário instalar Node.js, Playwright ou qualquer dependência. Basta baixar o ZIP ou instalador e executar.
- **Para desenvolvedores:**  
  - Node.js >= 18.x
  - npm >= 9.x

## Como Distribuir para Windows

### Opção 1: Arquivo ZIP

1. Baixe `TesteFrontApp-win32-x64.zip` da pasta `dist/`.
2. Extraia para qualquer pasta.
3. Execute `TesteFrontApp.exe`.

### Opção 2: Instalador MSI

1. Baixe `TesteFrontApp-Installer.exe` da pasta `dist/installer/`.
2. Execute o instalador e siga as instruções.

## Como Usar

### 1. Configuração de Autenticação

1. Selecione o ambiente alvo (HMG2, UPD, PROD).
2. Faça login no ambiente no navegador e copie os cookies:
   - `mapasculturais.uid`
   - `PHPSESSID`
3. Cole os valores no app e clique em "Generate auth.json".

### 2. Executando Testes

- Clique em "Run All Tests" para executar todos os testes.
- Ou execute testes específicos (Agente, Espaço, Evento, Oportunidade, Projeto).

O progresso e logs serão exibidos na interface.

### 3. Cancelando Testes

- Clique em "Stop Execution" para cancelar um teste em andamento.

## Resolução de Problemas

- **App não inicia:**  
  Verifique permissões, antivírus, e caminho da pasta.
- **Erro ao gerar auth.json:**  
  Confira os cookies e tente novamente.
- **Testes não executam:**  
  Certifique-se de que `auth.json` foi gerado e o ambiente está acessível.

## Licença

MIT

---

Ministério da Cultura - Automação de Testes Frontend
