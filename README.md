# Espaço Construir Frontend

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
├── src/                    # Código fonte
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

## Configuração do Ambiente de Desenvolvimento

O projeto utiliza várias ferramentas de desenvolvimento:

- **TypeScript**: Para tipagem estática
- **ESLint**: Para linting e formatação de código
- **TailwindCSS**: Para estilização
- **PostCSS**: Para processamento de CSS
- **Vite**: Para build e desenvolvimento

## Dependências Principais

### Dependências de Produção

- `react` e `react-dom`: Framework principal
- `react-router-dom`: Roteamento
- `axios`: Cliente HTTP
- `date-fns`: Manipulação de datas
- `framer-motion`: Animações
- `lucide-react`: Ícones

### Dependências de Desenvolvimento

- `typescript`: Suporte a TypeScript
- `vite`: Build tool
- `tailwindcss`: Framework CSS
- `eslint`: Linting
- `postcss`: Processamento de CSS

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Suporte

Em caso de dúvidas ou problemas, por favor abra uma issue no repositório.

## Rotas da Aplicação

A aplicação possui rotas protegidas e públicas, com navegação diferenciada para professores e responsáveis (pais).

### Fluxo de Autenticação

- `/` — Tela inicial de login e seleção de tipo de usuário (professor ou responsável)
- `/login` — Redireciona para `/`

### Rotas para Professores

- `/teacher-dashboard` — Painel do Professor: visão geral da agenda, alunos e aulas do dia
- `/students` — Gerenciamento de alunos (cadastro e listagem)
- `/manage-schedule` — Agenda semanal para professores (visualização e gerenciamento de horários)
- `/register-teacher` — Cadastro de novo professor

### Rotas para Responsáveis (Pais)

- `/children` — Dashboard de filhos: cadastro e listagem de filhos
- `/schedule` — Agendar Aula: visualização de horários disponíveis e agendamento de aulas
- `/history` — Histórico de aulas dos filhos
- `/register-responsible` — Cadastro de novo responsável

### Outras rotas

- `*` — Qualquer rota não reconhecida redireciona para `/`

---

## Funcionalidades Principais

- **Autenticação mock**: Login e registro via modal, com persistência de tipo de usuário e ID no localStorage
- **Dashboard do Professor**: Visualização de agenda semanal, gerenciamento de alunos, detalhes de cada aluno
- **Dashboard do Responsável**: Cadastro e listagem de filhos, agendamento de aulas, histórico de aulas
- **Agendamento de Aulas**: Tabela moderna, responsiva, com horários customizáveis e status visual
- **Histórico de Aulas**: Visualização de presença, ausência e atrasos, com anotações do professor
- **Identidade Visual**: Paleta de cores alinhada ao logo, componentes modernos com TailwindCSS
- **Acessibilidade e UX**: Mensagens de orientação, tabelas responsivas, feedback visual em botões e status
