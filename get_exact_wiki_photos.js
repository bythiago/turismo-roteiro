const wikiArticles = {
  // Rio
  "rio-1": "Cristo Redentor",
  "rio-2": "Pão de Açúcar (Rio de Janeiro)",
  "rio-3": "Jardim Botânico do Rio de Janeiro",
  "rio-4": "Escadaria Selarón",
  "rio-5": "Museu do Amanhã",
  "rio-6": "Forte de Copacabana",
  "rio-7": "Parque Henrique Lage",
  "rio-8": "Aqueduto da Carioca",

  // SP
  "sp-1": "Museu de Arte de São Paulo",
  "sp-2": "Parque Ibirapuera",
  "sp-3": "Liberdade (bairro de São Paulo)",
  "sp-4": "Mercado Municipal de São Paulo",
  "sp-5": "Pinacoteca do Estado de São Paulo",
  "sp-6": "Beco do Batman",
  "sp-7": "Edifício Altino Arantes",
  "sp-8": "Catedral Metropolitana de São Paulo",

  // Salvador
  "sal-1": "Pelourinho (Salvador)",
  "sal-2": "Farol da Barra (Salvador)",
  "sal-3": "Elevador Lacerda",
  "sal-4": "Igreja e Convento de São Francisco (Salvador)",

  // Curitiba
  "cwb-1": "Jardim Botânico de Curitiba",
  "cwb-2": "Museu Oscar Niemeyer",
  "cwb-3": "Ópera de Arame",
  "cwb-4": "Parque Tanguá",

  // Paris
  "par-1": "Torre Eiffel",
  "par-2": "Museu do Louvre",
  "par-3": "Catedral de Notre-Dame de Paris",
  "par-4": "Basílica de Sacré-Cœur",

  // Roma
  "rom-1": "Coliseu",
  "rom-2": "Fontana di Trevi",
  "rom-3": "Panteão (Roma)",
  "rom-4": "Basílica de São Pedro",

  // Campos do Jordão
  "cj-1": "Campos do Jordão",
  "cj-2": "Horto Florestal de Campos do Jordão",
  "cj-3": "Morro do Elefante",
  "cj-4": "Palácio Boa Vista",
  "cj-5": "Ducha de Prata",
  "cj-6": "Parque Estadual de Campos do Jordão",
  "cj-7": "Pico do Itapeva (Pindamonhangaba)",
  "cj-8": "Museu Felícia Leirner",

  // Gramado
  "gra-1": "Gramado",
  "gra-2": "Lago Negro (Gramado)",
  "gra-3": "Mini Mundo",
  "gra-4": "Snowland",

  // Foz
  "foz-1": "Cataratas do Iguaçu",
  "foz-2": "Parque das Aves",
  "foz-3": "Usina Hidrelétrica de Itaipu",
  "foz-4": "Marco das Três Fronteiras",

  // Floripa
  "fln-1": "Ponte Hercílio Luz",
  "fln-2": "Lagoa da Conceição",
  "fln-3": "Praia da Joaquina",
  "fln-4": "Santo Antônio de Lisboa (Florianópolis)"
};

async function fetchWiki() {
  const result = {};
  for (const [key, article] of Object.entries(wikiArticles)) {
    try {
      const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'RoteiroTur-App/1.0' } });
      if (res.ok) {
        const data = await res.json();
        result[key] = data.originalimage?.source || data.thumbnail?.source || 'NO_IMG';
      } else {
        result[key] = 'FAIL_' + res.status;
      }
    } catch (e) {
      result[key] = 'ERR';
    }
  }
  console.log('REAL_WIKI_URLS:');
  console.log(JSON.stringify(result, null, 2));
}

fetchWiki();
