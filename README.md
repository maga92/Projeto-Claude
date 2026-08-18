**Observação Principal: Este projeto foi feito com suporte da Claude AI, como estudo e entendimento de certos conteúdos em Javascript. (Não é um projeto 100% feito por mim)**

# Major League Live 🏆

Sistema offline-first de gestão esportiva amadora.

## Como usar

1. Abra `index.html` em qualquer navegador moderno
2. **Não é necessário servidor** — funciona 100% localmente

> ⚠️ **Atenção:** Use `File > Open` no navegador **ou** sirva via HTTP local.
> Para evitar restrições de CORS com ES Modules, use um servidor local simples:
>
> ```bash
> # Python 3
> python -m http.server 8080
> # Node.js (npx)
> npx serve .
> # VS Code: Live Server extension
> ```
>
> Depois acesse: `http://localhost:8080`

---

## Funcionalidades

### 🏆 Campeonatos
- Criar campeonatos com status (Ativo / Futuro / Finalizado)
- Upload de logo e banner personalizados
- **Fases** livres e ilimitadas por campeonato
- **Grupos** dentro de fases com drag & drop
- **Partidas** diretas ou dentro de grupos
- Registro de desempenho pessoal por partida

### 👤 Perfil do Atleta
- Foto, nome, apelido, posição, time atual
- Estatísticas automáticas (apenas partidas com toggle ativo)
- Gráfico de evolução temporal (gols, assistências, nota)
- Conquistas: Títulos e Awards
- Histórico dos últimos jogos com desempenho

### 📊 Rankings
- **Global**: lista manual de times/jogadores
- **Regional**: filtrável por regiões personalizadas
- **Players**: lista manual de jogadores
- Drag & drop para reordenar
- Regiões criáveis livremente

### 🔍 Busca Global (estilo HLTV)
- Busca unificada por campeonatos, times, partidas, conquistas e rankings
- Resultados em tempo real sem seleção de categoria

### 💾 Export / Import
- Exporta TODO o estado do sistema para JSON
- Importa com opção de substituir ou mesclar
- Sistema 100% portátil entre dispositivos e navegadores
- Inclui mídias (logos, banners, fotos)

---

## Arquitetura

```
major-league-live/
├── index.html              # Entrada única
├── styles/
│   └── main.css            # Estilos completos (tema escuro)
├── js/
│   ├── app.js              # Orquestrador principal
│   ├── core/
│   │   ├── events.js       # Sistema de eventos interno
│   │   ├── router.js       # Roteador SPA
│   │   └── autosave.js     # Autosave com debounce
│   ├── services/
│   │   ├── championshipService.js
│   │   ├── matchService.js
│   │   ├── profileService.js
│   │   ├── rankingService.js
│   │   ├── mediaService.js
│   │   ├── searchService.js
│   │   └── exportService.js
│   └── ui/
│       ├── modal.js
│       ├── toast.js
│       └── dragdrop.js
├── pages/
│   ├── home.js
│   ├── championships.js
│   ├── championship-detail.js
│   ├── rankings.js
│   └── profile.js
└── db/
    ├── database.js         # IndexedDB wrapper
    └── schema.js           # Schema completo
```

---

## Stack
- HTML5 + CSS3 + JavaScript ES Modules (Vanilla)
- IndexedDB (banco principal)
- LocalStorage (apenas configurações leves)
- Sem backend, sem dependências externas
