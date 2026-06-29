# Cannes Lions 2026 — Arquivo de Vencedores

Site estático (HTML/CSS/JS puro) que cataloga as 634 peças premiadas no Cannes Lions 2026 — Grand Prix, Ouro, Prata, Bronze e Titanium — organizadas em 10 grupos e 33 categorias.

## Estrutura

```
index.html          — página principal (HTML semântico)
css/styles.css      — estilos (IBM Plex Mono, layout grid, sidebar, modal)
js/data.js          — array DATA com os 634 registros de peças premiadas
js/app.js           — lógica de navegação, filtros, busca e renderização
```

## Como rodar

Abrir `index.html` no navegador ou servir com qualquer servidor estático:

```bash
npx serve .
# ou
python3 -m http.server 8000
```

## Dados

Cada entrada em `js/data.js` segue o schema:

```json
{
  "grupo": "Classic",
  "categoria": "Film",
  "premio": "Grand Prix",
  "peca": "Nome da Peça",
  "marca": "Marca",
  "agencia": "Agência, Cidade",
  "pais": "País",
  "link": "https://...",
  "embed": "youtube | vimeo | external",
  "vid": "videoId"
}
```

## Grupos (10)

Brand, Classic, Craft, Engagement, Entertainment, Experience, Good, Health, Strategy, Titanium

## Google Analytics

O ID `G-XXXXXXXXXX` em `index.html` é placeholder — substituir pelo ID real do GA4.
