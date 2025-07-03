# Espaço Construir Frontend

## Visão Geral

Este projeto é o frontend do sistema Espaço Construir, uma plataforma para agendamento de aulas, gerenciamento de alunos e acompanhamento de históricos, voltada para professores e responsáveis (pais/guardians).

## Requisitos

- Node.js (versão 18.x ou superior)
- npm (versão 9.x ou superior)
- Git

## Tecnologias Principais

- React 18.3
- TypeScript 5.5
- Vite 5.4
- TailwindCSS 3.4
- React Router DOM 6.22
- Axios 1.9
- Framer Motion 12.12

## Como Rodar o Projeto

1. Clone o repositório:

   ```bash
   git clone https://github.com/Dev-Adrianoo/espaco-construir-frontend.git
   cd espaco-construir-frontend
   ```

2. Execute o script de inicialização:

   ```bash
   .\start.bat
   ```

   Este script irá automaticamente instalar as dependências e iniciar o servidor de desenvolvimento.

3. Acesse o projeto:
   - O servidor estará rodando em `http://localhost:5173` (porta padrão do Vite)
   - Abra seu navegador e acesse a URL exibida no terminal

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento com Vite
- `npm run build` - Cria a versão de produção otimizada
- `npm run preview` - Visualiza a versão de produção localmente
- `npm run lint` - Executa a verificação de código com ESLint

## Estrutura do Projeto

```
espaco-construir-frontend/
├── src/
│   ├── components/         # Componentes reutilizáveis (Button, Card, Modal, Input, etc.)
│   ├── layouts/            # Layouts globais (MainLayout)
│   ├── pages/              # Páginas principais (Login, Dashboard, Agendamento, etc.)
│   ├── services/           # Serviços de integração com backend (api, authService, studentService, scheduleService)
│   ├── contexts/           # Contextos globais (AuthContext)
│   ├── images/             # Imagens e logos
│   ├── App.tsx             # Componente principal e roteamento
│   ├── index.css           # Estilos globais
│   ├── main.tsx            # Ponto de entrada
│   └── vite-env.d.ts       # Tipos do ambiente Vite
├── public/                 # Arquivos estáticos
├── node_modules/          # Dependências
├── .git/                  # Configuração do Git
├── .gitignore            # Arquivos ignorados pelo Git
├── index.html            # Ponto de entrada HTML
├── package.json          # Configurações e dependências
├── tsconfig.json         # Configuração do TypeScript
├── tsconfig.app.json     # Configuração do TypeScript para a aplicação
├── tsconfig.node.json    # Configuração do TypeScript para Node
├── vite.config.ts        # Configuração do Vite
├── tailwind.config.js    # Configuração do TailwindCSS
├── postcss.config.js     # Configuração do PostCSS
└── eslint.config.js      # Configuração do ESLint
```

## Fluxo de Autenticação e Contexto

- O contexto de autenticação (`AuthContext`) gerencia o estado global do usuário, token, login/logout e persistência no `localStorage`.
- O login e registro são realizados via modais, com diferenciação de fluxo para professores (`PROFESSORA`) e responsáveis (`RESPONSAVEL`).
- O token é validado e renovado automaticamente via refresh token, garantindo sessões seguras.
- O contexto expõe métodos para login, logout e verifica o papel do usuário para navegação condicional.

## Roteamento e Proteção de Rotas

- O roteamento é feito em `App.tsx` usando `react-router-dom`.
- Rotas públicas: `/` (login/registro), `/login` (redireciona para `/`).
- Rotas protegidas para professores:
  - `/teacher-dashboard` — Painel do Professor
  - `/students` — Gerenciamento de alunos
  - `/manage-schedule` — Agenda semanal
  - `/register-teacher` — Cadastro de professor
- Rotas protegidas para responsáveis:
  - `/children` — Dashboard de filhos
  - `/schedule` — Agendamento de aulas
  - `/history` — Histórico de aulas
  - `/register-responsible` — Cadastro de responsável
- Qualquer rota não reconhecida redireciona para `/`.
- O componente `ProtectedRoute` garante que apenas usuários autenticados e com o papel correto acessem as rotas.

## Integração com Backend

- Toda comunicação com o backend é feita via `services/api.ts` (Axios), com interceptadores para autenticação e renovação de token.
- Serviços específicos:
  - `authService`: login, registro, logout, verificação de autenticação.
  - `studentService`: CRUD de alunos.
  - `scheduleService`: agendamento, consulta e cancelamento de aulas.
- O backend espera tokens JWT e diferencia usuários por papel (`PROFESSORA`, `RESPONSAVEL`).

## Componentes Principais

- **Button, Input, Select, Textarea, MaskedInput**: componentes de formulário reutilizáveis.
- **Modal, SuccessModal, ErrorModal**: modais para feedback e formulários.
- **LoadingSpinner**: indicador de carregamento.
- **Card, ChildrenList**: exibição de dados em cards e listas.
- **ProtectedRoute**: wrapper para rotas protegidas.

## Layout e Navegação

- O `MainLayout` define a navegação principal, com menus dinâmicos conforme o tipo de usuário.
- O layout é responsivo, com navegação lateral em desktop e menu mobile.
- O rodapé exibe informações institucionais.

## Funcionalidades Principais

- **Autenticação mock**: login/registro com persistência local.
- **Dashboard do Professor**: agenda semanal, gerenciamento de alunos, histórico de aulas.
- **Dashboard do Responsável**: cadastro/listagem de filhos, agendamento, histórico.
- **Agendamento de Aulas**: tabela semanal, seleção de horários, status visual.
- **Histórico de Aulas**: visualização de presença, ausência, atrasos e anotações.
- **Acessibilidade e UX**: feedback visual, tabelas responsivas, mensagens de orientação.

## Como Contribuir

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git commit -m 'Adiciona nova feature`)
5. Abra um Pull Request

## Suporte

Em caso de dúvidas ou problemas, por favor abra uma issue no repositório.
