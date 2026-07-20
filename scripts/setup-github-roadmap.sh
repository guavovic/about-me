#!/usr/bin/env bash
#
# setup-github-roadmap.sh
# -----------------------------------------------------------------------------
# Cria um GitHub Project + issues (com labels e milestones) a partir do roadmap
# do guavovic-website. Roda UMA vez. É seguro rodar de novo: labels usam --force
# e milestones/issues duplicadas são ignoradas com aviso.
#
# Pré-requisitos:
#   1. GitHub CLI instalado:            https://cli.github.com
#   2. Autenticado:                     gh auth login
#   3. Escopo de Projects habilitado:   gh auth refresh -s project,read:project
#
# Uso:
#   chmod +x scripts/setup-github-roadmap.sh
#   ./scripts/setup-github-roadmap.sh
# -----------------------------------------------------------------------------

set -euo pipefail

REPO="guavovic/guavovic-website"
OWNER="guavovic"
PROJECT_TITLE="guavovic-website roadmap"

# ----------------------------------------------------------------------------
# Preflight
# ----------------------------------------------------------------------------
if ! command -v gh >/dev/null 2>&1; then
  echo "❌ GitHub CLI (gh) não encontrado. Instale: https://cli.github.com"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "❌ Você não está autenticado. Rode: gh auth login"
  exit 1
fi

echo "✔ gh autenticado. Repo alvo: $REPO"
echo

# ----------------------------------------------------------------------------
# Labels (idempotente com --force)
# ----------------------------------------------------------------------------
echo "📛 Criando labels..."
mklabel() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null; }

mklabel "area:osu"       "e34ba9" "osu!mania 4K"
mklabel "area:flappy"    "fbca04" "Flappy Bird"
mklabel "area:dino"      "0e8a16" "Dino runner"
mklabel "area:site"      "1d76db" "Site em geral"
mklabel "type:feature"   "a2eeef" "Nova funcionalidade"
mklabel "type:perf"      "d4c5f9" "Performance"
mklabel "type:a11y"      "bfd4f2" "Acessibilidade"
mklabel "type:security"  "b60205" "Segurança"
mklabel "type:seo"       "c2e0c6" "SEO / meta"
mklabel "type:infra"     "5319e7" "Infra / CI / tooling"
mklabel "type:portfolio" "ff66aa" "Portfólio / multi-repo"
mklabel "priority:next"  "e11d21" "Próximo passo"
echo "   ok"
echo

# ----------------------------------------------------------------------------
# Milestones (ignora se já existir)
# ----------------------------------------------------------------------------
echo "🎯 Criando milestones..."
mkmilestone() {
  gh api "repos/$REPO/milestones" -f title="$1" -f description="$2" >/dev/null 2>&1 \
    && echo "   + $1" || echo "   = $1 (já existe)"
}
mkmilestone "Games — faithful remakes" "Deixar cada jogo fiel ao original"
mkmilestone "Website polish"           "Features, UX, performance, a11y, SEO"
mkmilestone "Multi-repo & auto-update" "Separar jogos em repos e auto-atualizar o site"
echo

# ----------------------------------------------------------------------------
# Project v2
# ----------------------------------------------------------------------------
echo "🗂  Criando Project '$PROJECT_TITLE'..."
PROJECT_NUMBER=""
if PROJECT_JSON=$(gh project create --owner "$OWNER" --title "$PROJECT_TITLE" --format json 2>/dev/null); then
  PROJECT_NUMBER=$(echo "$PROJECT_JSON" | grep -o '"number":[0-9]*' | head -1 | grep -o '[0-9]*')
  echo "   Project #$PROJECT_NUMBER criado"
else
  echo "   ⚠ Não consegui criar o Project (falta escopo?)."
  echo "     Rode: gh auth refresh -s project,read:project"
  echo "     As issues serão criadas mesmo assim, só não entram no board automaticamente."
fi
echo

# ----------------------------------------------------------------------------
# Helper: cria issue e adiciona ao Project
#   create_issue "titulo" "labels,csv" "milestone" "corpo"
# ----------------------------------------------------------------------------
create_issue() {
  local title="$1" labels="$2" milestone="$3" body="$4"
  local url
  url=$(gh issue create --repo "$REPO" --title "$title" --label "$labels" --milestone "$milestone" --body "$body" 2>/dev/null | tail -n1) || {
    echo "   ⚠ Falha ao criar: $title"; return 0;
  }
  echo "   + $title"
  if [ -n "$PROJECT_NUMBER" ] && [[ "$url" == http* ]]; then
    gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$url" >/dev/null 2>&1 || true
  fi
}

echo "📝 Criando issues..."

# ---------- osu!mania — faithful remake ----------
create_issue "osu: ler TimingPoints reais (BPM/offset/SV) para sincronizar o scroll" \
  "area:osu,type:feature" "Games — faithful remakes" \
  "Hoje o scroll usa tempo fixo. Parsear [TimingPoints] do .osu para respeitar BPM, offset e mudanças de slider velocity."

create_issue "osu: janelas de julgamento baseadas no OD (MAX/300/200/100/50/miss)" \
  "area:osu,type:feature" "Games — faithful remakes" \
  "Calcular as janelas em ms a partir do Overall Difficulty do mapa, com os seis níveis de julgamento reais."

create_issue "osu: long notes com julgamento separado de cabeça e cauda" \
  "area:osu,type:feature" "Games — faithful remakes" \
  "Avaliar início e fim da hold note de forma independente, como no osu!mania original."

create_issue "osu: hitsounds do beatmap (samples do .osz)" \
  "area:osu,type:feature" "Games — faithful remakes" \
  "Tocar os samples de hitsound embutidos no .osz em cada acerto."

create_issue "osu: HP/health drain + estado de fail" \
  "area:osu,type:feature" "Games — faithful remakes" \
  "Barra de vida que drena com misses e enche com acertos; falhar quando zerar."

create_issue "osu: score real (ScoreV1/V2) + grade final (SS/S/A/B/C/D)" \
  "area:osu,type:feature" "Games — faithful remakes" \
  "Implementar a fórmula de pontuação e exibir a nota final na tela de resultados."

create_issue "osu: config de scroll speed + offset/latência de áudio" \
  "area:osu,type:feature" "Games — faithful remakes" \
  "Permitir ajustar a velocidade de rolagem e calibrar o offset para compensar latência."

create_issue "osu: mods (mirror, random, double/half time)" \
  "area:osu,type:feature" "Games — faithful remakes" \
  "Modificadores que alteram layout das colunas e a velocidade da música."

create_issue "osu: song select com busca, ordenação, star rating e preview de áudio" \
  "area:osu,type:feature" "Games — faithful remakes" \
  "Menu de seleção mais próximo do osu!: busca, sort, cálculo de dificuldade e prévia da música no hover."

create_issue "osu: leaderboard local + replay por mapa (IndexedDB)" \
  "area:osu,type:feature" "Games — faithful remakes" \
  "Guardar melhores scores e replays localmente para cada beatmap."

# ---------- Flappy ----------
create_issue "flappy: física fiel ao original (gravidade, impulso, gap, espaçamento)" \
  "area:flappy,type:feature" "Games — faithful remakes" \
  "Ajustar as constantes para reproduzir a sensação do Flappy Bird original."

create_issue "flappy: chão rolando, dia/noite, medalhas e best score" \
  "area:flappy,type:feature" "Games — faithful remakes" \
  "Elementos visuais e de progressão do jogo original, com recorde persistente."

# ---------- Dino ----------
create_issue "dino: curva de aceleração real + inversão dia/noite" \
  "area:dino,type:feature" "Games — faithful remakes" \
  "Reproduzir a rampa de velocidade e a troca de tema do T-Rex runner do Chrome."

create_issue "dino: pássaros em alturas variadas, agachar/pular, high score piscando" \
  "area:dino,type:feature" "Games — faithful remakes" \
  "Obstáculos aéreos em múltiplas alturas e feedback de recorde como no original."

# ---------- Multi-repo & auto-update ----------
create_issue "arquitetura: extrair osu!mania num módulo independente (contrato mount())" \
  "area:osu,type:portfolio,priority:next" "Multi-repo & auto-update" \
  "Refatorar o osu para um módulo autossuficiente, sem depender de globais/CSS do site (ex.: Games.osuMania.mount(container, opts)). Primeiro passo para separar em repo próprio."

create_issue "arquitetura: separar cada jogo em repo próprio (README + demo + MIT)" \
  "type:portfolio,type:infra" "Multi-repo & auto-update" \
  "Um repositório por jogo, com README forte, demo ao vivo e licença. Mostra engenharia real no portfólio."

create_issue "arquitetura: auto-update via jsDelivr + manifesto games.json (network-first)" \
  "type:portfolio,type:infra" "Multi-repo & auto-update" \
  "Carregar o bundle de cada jogo do CDN (jsDelivr @main/tag). Manifesto games.json no site (network-first) aponta versão/URL. Commit no repo do jogo atualiza o site sozinho."

create_issue "infra: testes unitários (parser .osu) + CI no GitHub Actions" \
  "type:infra" "Multi-repo & auto-update" \
  "Cobrir a lógica com testes (o parser de .osu é ótimo candidato) e rodar lint/test/build no CI."

create_issue "infra: migrar a lógica dos jogos para TypeScript" \
  "type:infra,type:portfolio" "Multi-repo & auto-update" \
  "Tipar beatmap, notas e estado de jogo. Bom sinal de qualidade num portfólio."

# ---------- Website features ----------
create_issue "site: command palette (Ctrl+K) com links e easter eggs" \
  "area:site,type:feature" "Website polish" \
  "Paleta de comandos para navegar links e descobrir os easter eggs escondidos."

create_issue "site: grid de projetos via API do GitHub (auto-atualiza)" \
  "area:site,type:feature" "Website polish" \
  "Listar repositórios (stars, linguagem) puxando da API do GitHub, sem manutenção manual."

create_issue "site: toggle de idioma PT/EN + tema claro/escuro/sistema" \
  "area:site,type:feature" "Website polish" \
  "Internacionalização e seletor de tema respeitando a preferência do sistema."

create_issue "site: Konami code easter egg" \
  "area:site,type:feature" "Website polish" \
  "Mais um segredo escondido, ativado pela sequência clássica."

create_issue "site: guestbook serverless (edge function)" \
  "area:site,type:feature" "Website polish" \
  "Livro de visitas simples usando função serverless da Vercel."

create_issue "site: sparkline do histórico de scrobbles (Last.fm)" \
  "area:site,type:feature" "Website polish" \
  "Mini gráfico do histórico de músicas, complementando o card de now-playing."

# ---------- Performance ----------
create_issue "perf: imagens em WebP/AVIF + srcset responsivo" \
  "area:site,type:perf" "Website polish" \
  "Converter imagens e servir tamanhos responsivos para melhorar o carregamento."

create_issue "perf: self-host da fonte + dynamic import dos jogos" \
  "area:site,type:perf" "Website polish" \
  "Hospedar a fonte localmente (corta dependência do Google Fonts) e só carregar o código dos jogos quando o easter egg dispara."

create_issue "perf: rodar Lighthouse e mirar LCP/CLS" \
  "area:site,type:perf" "Website polish" \
  "Auditoria de performance e correção dos principais gargalos."

# ---------- Acessibilidade ----------
create_issue "a11y: focus trap + aria nos overlays + navegação por teclado" \
  "area:site,type:a11y" "Website polish" \
  "Prender o foco dentro dos overlays de jogo/painel e melhorar a navegação por teclado no site todo."

create_issue "a11y: prefers-reduced-motion nos jogos + checagem de contraste" \
  "area:site,type:a11y" "Website polish" \
  "Respeitar redução de movimento também nos jogos e validar contraste de cores."

# ---------- SEO ----------
create_issue "seo: sitemap.xml, robots.txt, JSON-LD Person e OG image" \
  "area:site,type:seo" "Website polish" \
  "Metadados estruturados, canonical e imagem de preview para compartilhamento."

# ---------- Segurança / infra ----------
create_issue "security: headers no Vercel (CSP, Referrer-Policy, X-Content-Type-Options, Permissions-Policy)" \
  "area:site,type:security" "Website polish" \
  "Configurar cabeçalhos de segurança; a CSP também controla de quais origens os jogos podem ser carregados."

create_issue "infra: ESLint + Prettier + Husky (pre-commit)" \
  "area:site,type:infra" "Website polish" \
  "Padronização automática de código e checagem antes de cada commit."

create_issue "infra: analytics privacy-first (Plausible/Umami self-host)" \
  "area:site,type:infra" "Website polish" \
  "Métricas de visita respeitando privacidade, sem Google Analytics."

echo
echo "✅ Pronto!"
if [ -n "$PROJECT_NUMBER" ]; then
  echo "   Project: https://github.com/users/$OWNER/projects/$PROJECT_NUMBER"
fi
echo "   Issues:  https://github.com/$REPO/issues"
