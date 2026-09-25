# 🏢 Type77 Multi-Agent Pixel Office

<div align="center">

![Type77 Multi-Agent Pixel Office](https://img.shields.io/badge/Type77-Pixel_Office-ff6b6b?style=for-the-badge&logo=electron&logoColor=white)
![Next.js 15](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Phaser 3](https://img.shields.io/badge/Phaser_3-8B0000?style=for-the-badge&logo=gamedeveloper&logoColor=white)
![Prisma ORM](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

**Uma plataforma gamificada de orquestração multiagente de IA que combina escritórios virtuais interativos em Pixel Art 2D com execução autônoma ReAct, delegação hierárquica de tarefas e um Hub Multi-Provider de LLMs configurável 100% pelo frontend.**

[Recursos](#-principais-recursos) • [Arquitetura](#-arquitetura-do-sistema) • [Hub Multi-Provider](#-hub-multi-provider-de-llms) • [Servidor MCP](#-servidor-mcp-model-context-protocol) • [Modo Tycoon](#-simulação-e-modo-tycoon-de-escritório) • [Como Começar](#-como-começar) • [Roadmap](#-roadmap)

---

</div>

## 🌟 Visão Geral & Inspirações

O **Type77 Multi-Agent Pixel Office** une o gerenciamento de equipes e delegação de tarefas autônomas do **AgentFleet** com a simulação espacial nostálgica e interativa em pixel art do **pixel-agents**.

Em vez de acompanhar o progresso dos agentes em terminais ou listas estáticas de texto, seus funcionários de IA ganham vida dentro de um escritório virtual 2D interativo:
- 🧑💻 **Contratação & Configuração de Agentes:** Defina funções, personas, prompts de sistema personalizados, temperaturas e modelos de IA para cada membro da equipe.
- 🏢 **Modo Construtor / Tycoon de Escritório:** Projete e expanda seu escritório em tempo real adicionando mesas de trabalho, cafeteiras, bebedouros, salas de reunião e plantas decorativas.
- 🚶 **Simulação Espacial Dinâmica:** Agentes caminham com pathfinding A* até suas respectivas mesas, sentam-se para codificar/trabalhar, vão até a máquina de café em momentos de pausa e se reúnem em salas de conferência para deliberações em equipe.
- 💬 **Balões Vivos de Pensamento e Fala:** Acompanhe o raciocínio em tempo real (`pensamento`), execuções no terminal (`ação`) e diálogos entre agentes (`fala`) renderizados diretamente sobre os avatares em pixel art.
- 🔑 **Configuração 100% pelo Frontend:** Sem necessidade de arquivos `.env` complexos para os usuários. Gerencie chaves de API, URLs base personalizadas, tokens e modelos diretamente no painel de configurações da aplicação, com persistência segura no SQLite local.

---

## 🚀 Principais Recursos

### 1. 🎮 Simulação de Escritório Virtual em Pixel Art 2D
- **Viewport Phaser 3 em Alta Performance:** Renderização top-down fluida com controles de câmera (pan/arrastar, zoom) e camadas organizadas (Pisos, Paredes, Móveis, Personagens e Efeitos Visuais).
- **Pathfinding A\* & Colisão em Tempo Real:** Recálculo instantâneo da malha de navegação (navmesh) sempre que móveis forem posicionados, girados ou removidos.
- **Máquina de Estados de Animação:** Sprites de personagens com estados contextuais: `idle` (ocioso), `walking` (caminhando), `typing` (trabalhando na mesa), `drinking_coffee` (pausa para café), `meeting` (reunião) e `error` (bloqueio/erro).
- **Balões de Fala e Pensamento em Tempo Real:** Renderização flutuante de raciocínios e diálogos sincronizados com o streaming de tokens dos modelos de linguagem.

### 2. 🏗️ Modo Tycoon / Construtor de Escritório (Grid Builder)
- **Construção Interativa por Clique e Arraste:** Posicione pisos de madeira/carpete, paredes, mesas individuais e de diretoria, cadeiras ergonômicas, mesas de conferência, máquinas de café expresso e bebedouros.
- **Rotação & Personalização Espacial:** Gire itens com a tecla `R`, inspecione as propriedades de cada ladrilho e atribua mesas específicas para cada agente.
- **Persistência de Plantas Baixas:** Salve e carregue layouts customizados de escritórios no banco de dados SQLite local.

### 3. 🤖 Motor Multiagente Autônomo com Ciclo ReAct
- **Loop de Execução Event-Driven:** Agentes operam no ciclo autônomo `Pensamento -> Ação -> Observação -> Resposta Final`.
- **Delegação Hierárquica de Tarefas:** Agentes líderes (ex: Arquiteto de Software) podem quebrar metas complexas em subtarefas e delegá-las a especialistas (ex: Desenvolvedor Frontend, Engenheiro de QA, Redator).
- **Protocolo de Consenso em Salas de Reunião:** Inicie reuniões de emergência ou alinhamento onde múltiplos agentes debatem, compartilham memória de contexto e formulam planos de ação colaborativos.
- **Quadro Kanban Interativo:** Gerenciamento visual do ciclo de vida das tarefas em colunas (`Backlog`, `Em Progresso`, `Revisão` e `Concluído`).

### 4. 🧰 Caixa de Ferramentas (Tool Sandbox) Isolada
- 📁 **Operações no Sistema de Arquivos:** `read_file`, `write_file`, `list_directory`, `search_files` (com escopo restrito ao workspace de trabalho).
- 💻 **Execução de Terminal / Bash:** Execução segura de comandos de terminal com captura de stdout e stderr.
- 🌐 **Ferramentas Web:** Busca online e extração de conteúdo de páginas web em tempo real.
- 👥 **Ferramentas de Colaboração entre Agentes:** `delegate_task`, `call_meeting`, `request_agent_review` e `broadcast_office_message`.

---

## ⚡ Hub Multi-Provider de LLMs

O Type77 Pixel Office possui uma camada adaptadora desacoplada com **configuração e teste de conexão 100% pela interface gráfica**. Sem necessidade de reiniciar servidores ou editar arquivos de ambiente.

| Provedor / Motor | Descrição & Caso de Uso Principal | Configuração via UI |
| :--- | :--- | :---: |
| `openclaude-omni` | Raciocínio multimodal completo, janelas de contexto estendidas e planejamento profundo | Chave de API / Endpoint Personalizado |
| `openclaude` | Alta taxa de transferência, síntese ágil de código, execução bash e chamadas de ferramentas | Chave de API / Endpoint Personalizado |
| `hermes` | Especialista em chamadas de função (function calling), despacho de ferramentas e loops de raciocínio | Chave de API / URL Base |
| `openroute` | Gateway agregador de múltiplos modelos e roteamento de contingência | Chave OpenRouter |
| `codex` | Especialista em scripts, refatoração e análise sintática de código | Chave de API / URL Base |
| `claude` | Integração direta com Anthropic Claude (Sonnet / Opus) | Chave de API Anthropic |
| `antigravity` | Motor avançado de codificação agêntica do Google DeepMind | Token de Autenticação / URL |
| `custom` | Qualquer endpoint compatível com as APIs da OpenAI ou Anthropic | URL + Headers Personalizados |

---

## 🔌 Servidor MCP (Model Context Protocol)

O Hub Multi-Provider também é exposto como um **servidor MCP real** (via [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk)), para que outras IAs/agentes (Claude Desktop, Claude Code, etc.) possam ler e gerenciar as configurações de provedores do Type77 sem acessar a interface web.

- **Implementação:** `src/lib/mcp/server.ts` (`Type77MCPServer`) contém a lógica dos tools; `src/lib/mcp/stdio-server.ts` é o processo executável que conecta essa lógica a um `StdioServerTransport` real do MCP.
- **Ferramentas expostas:** `list_providers`, `get_provider_settings`, `update_provider`, e um `test_<provider>_connection` para cada um dos 8 provedores suportados — sempre gerados a partir do `SUPPORTED_PROVIDERS` do registry, então a lista de tools nunca fica desatualizada em relação ao Hub.
- **Executar localmente:**
  ```bash
  npm run mcp
  ```
- **Conectar em outro cliente MCP:** o repositório já inclui um `.mcp.json` na raiz:
  ```json
  {
    "mcpServers": {
      "type77-provider-hub": {
        "command": "npx",
        "args": ["tsx", "src/lib/mcp/stdio-server.ts"]
      }
    }
  }
  ```
  Clientes como o Claude Code detectam esse arquivo automaticamente na raiz do projeto. Para o Claude Desktop, copie o mesmo bloco (com `cwd` apontando para este repositório) para `claude_desktop_config.json`.
- **Testes:** `tests/providers/mcp-server.test.ts` cobre a lógica dos tools; `tests/mcp/stdio-server.test.ts` sobe o processo real e valida o handshake MCP (`initialize` → `tools/list`) ponta a ponta.

---

## 📐 Arquitetura do Sistema

```
+-------------------------------------------------------------------------------+
|                             CLIENTE NAVEGADOR (WEB)                           |
|                                                                               |
|  +-------------------------------------+  +--------------------------------+  |
|  |       Interface React 19 / Next.js  |  |         Canvas Phaser 3        |  |
|  | - Modal de Contratação & Config     |  | - Tilemap 2D & Grid Isométrico |  |
|  | - Painel de Configurações e Chaves  |  | - Pathfinding A* no Grid       |  |
|  | - Quadro Kanban & Logs de Execução  |  | - Animações de Sprites & Balões|  |
|  | - Catálogo de Móveis do Construtor  |  |                                |  |
|  +-------------------------------------+  +--------------------------------+  |
|                     ^                                    ^                    |
|                     |              Ponte Zustand         |                    |
|                     +-----------------+------------------+                    |
|                                       |                                       |
|                                       v                                       |
|                             Cliente Socket.io / REST                          |
+---------------------------------------+---------------------------------------+
                                        |  (WebSockets / HTTP)
                                        v
+-------------------------------------------------------------------------------+
|                            SERVIDOR NODE.JS / NEXT.JS                         |
|                                                                               |
|  +---------------------------+  +-------------------------------------------+ |
|  |     Gateway Socket.io     |  |          Motor de Execução ReAct          | |
|  | - Sincronização de Posição|  | - Loop de Eventos (Thought->Act->Observe) | |
|  | - Streaming de Pensamento |  | - Agendador & Árvore de Delegação         | |
|  | - Transições de Estado    |  | - Gerenciador de Reuniões e Consenso      | |
|  +---------------------------+  +-------------------------------------------+ |
|                                       |                                       |
|                                       v                                       |
|  +--------------------------------------------------------------------------+ |
|  |                         Hub de Adaptadores Multi-Provider                | |
|  |   [openclaude-omni]  [openclaude]  [hermes]  [openroute]  [codex]        | |
|  +--------------------------------------------------------------------------+ |
|                                       |                                       |
|                                       v                                       |
|  +---------------------------+  +-------------------------------------------+ |
|  |     Sandbox de Ferramentas|  |            Camada de Persistência         | |
|  | - I/O de Arquivos         |  | - Prisma Client                           | |
|  | - Execução de Terminal    |  | - Banco de Dados SQLite (agentes, tarefas,| |
|  | - Busca e Fetch Web       |  |   layouts, logs de execução e reuniões)   | |
|  +---------------------------+  +-------------------------------------------+ |
+-------------------------------------------------------------------------------+
```

---

## 🛠️ Stack Tecnológica

- **Frontend & Aplicação:** [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **Motor de Jogo & Renderização:** [Phaser 3](https://phaser.io/) (WebGL / Canvas) com spritesheets e mapas em pixel art
- **Gerenciamento de Estado & Ponte de UI:** [Zustand](https://github.com/pmndrs/zustand)
- **Comunicação em Tempo Real:** [Socket.io](https://socket.io/) (WebSockets)
- **ORM & Banco de Dados:** [Prisma ORM](https://www.prisma.io/) com [SQLite](https://www.sqlite.org/) (Persistência local sem complexidade de infraestrutura)
- **Linguagem & Tipagem:** [TypeScript 5](https://www.typescriptlang.org/), Node.js 20+

---

## 📦 Como Começar

### Pré-requisitos
- **Node.js**: `v20.x` ou superior
- **npm**, **pnpm** ou **yarn**
- **Git**

### 1. Clonar o Repositório
```bash
git clone https://github.com/Sys-Bernardo-Rodrigues/Office-type77.git
cd Office-type77
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Inicializar o Banco de Dados
```bash
npx prisma migrate dev --name init
```

### 4. Executar o Servidor de Desenvolvimento
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### 5. Configurar seus Provedores de IA
1. Clique no ícone de **⚙️ Configurações** no cabeçalho superior.
2. Selecione o motor desejado (`openclaude-omni`, `openclaude`, `hermes`, `openroute`, `codex`, `claude`, `antigravity`, etc.).
3. Insira sua chave de API ou URL personalizada e clique em **Testar Conexão**.
4. Salve as configurações e comece a contratar seus agentes de IA!

---

## 🎮 Simulação e Modo Tycoon de Escritório

| Ação | Controle / Tecla de Atalho |
| :--- | :--- |
| **Mover Câmera (Pan)** | Clicar + Arrastar no Canvas / Teclas de Direção / WASD |
| **Aproximar / Afastar (Zoom)** | Scroll do Mouse / Teclas `+` e `-` |
| **Alternar Modo Construtor (Tycoon)** | Clicar no botão **"🏗️ Construir Escritório"** no HUD |
| **Girar Móvel Selecionado** | Pressionar a tecla `R` |
| **Excluir Móvel Selecionado** | Selecionar o item e pressionar `Delete` ou `Backspace` |
| **Inspecionar Agente / Ver HUD** | Clique com botão esquerdo sobre o avatar do agente |
| **Convocar Reunião Geral** | Clicar no botão **"📢 Convocar Reunião"** na Sala de Reunião |

---

## 🗄️ Esquema do Banco de Dados

O banco de dados SQLite local gerenciado pelo Prisma inclui:
- `ProviderSetting`: Armazenamento local e seguro de chaves de API, URLs base, cabeçalhos customizados e mapeamentos de modelos.
- `Agent`: Perfil do agente, mesa designada, sprite de avatar, motor de IA selecionado, modelo, prompt de sistema e status.
- `OfficeLayout` & `FurnitureItem`: Dimensões do grid, matriz de ladrilhos, coordenadas de móveis, rotações e pontos de interação.
- `Task`: Tarefas do Kanban, prioridade, status, responsável e hierarquias de delegação (`parentId` / `subTasks`).
- `AgentLog`: Trilha detalhada de execução (`thought`, `action`, `observation`, `speech`, `error`).
- `Meeting` & `MeetingMember`: Salas de conferência, membros participantes e histórico de deliberações.

---

## 🗺️ Roadmap

- [x] Especificação Técnica Completa e Arquitetura Multiagente
- [x] Repositório GitHub e Documentação em Português do Brasil
- [x] Integração do Next.js 15 com Motor Phaser 3
- [x] Central de Autenticação e Configuração de Provedores de IA (persistência via Prisma; UI ainda pendente)
- [x] Servidor MCP real para o Hub Multi-Provider (stdio, `.mcp.json`)
- [x] Motor de Pathfinding A* e Detecção de Colisão em Tempo Real
- [x] Modo Tycoon / Construtor de Escritório com Catálogo de Mobília
- [x] Runtime Multiagente ReAct com Delegação Hierárquica e Subtarefas
- [x] Sala de Reuniões Interativa com Protocolo de Consenso
- [ ] HUD React, Kanban e Modais de Contratação/Configuração (Task 8)
- [ ] Integração Fim-a-Fim, Efeitos Sonoros Retrô e Build de Produção (Task 9)

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte `LICENSE` para mais informações.

---

<div align="center">
Desenvolvido com ❤️ pela comunidade Type77.
</div>
