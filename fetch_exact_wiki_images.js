const spotsToFetch = [
  // Rio
  { key: "Cristo Redentor", title: "Cristo Redentor" },
  { key: "Pão de Açúcar", title: "Pão de Açúcar (Rio de Janeiro)" },
  { key: "Jardim Botânico do Rio", title: "Jardim Botânico do Rio de Janeiro" },
  { key: "Escadaria Selarón", title: "Escadaria Selarón" },
  { key: "Museu do Amanhã", title: "Museu do Amanhã" },
  { key: "Forte de Copacabana", title: "Forte de Copacabana" },
  { key: "Parque Lage", title: "Parque Henrique Lage" },
  { key: "Arcos da Lapa", title: "Aqueduto da Carioca" },

  // SP
  { key: "MASP", title: "Museu de Arte de São Paulo" },
  { key: "Parque Ibirapuera", title: "Parque Ibirapuera" },
  { key: "Bairro da Liberdade", title: "Liberdade (bairro de São Paulo)" },
  { key: "Mercado Municipal SP", title: "Mercado Municipal de São Paulo" },
  { key: "Pinacoteca SP", title: "Pinacoteca do Estado de São Paulo" },
  { key: "Beco do Batman", title: "Beco do Batman" },
  { key: "Farol Santander", title: "Edifício Altino Arantes" },
  { key: "Catedral da Sé", title: "Catedral Metropolitana de São Paulo" },

  // Campos do Jordão
  { key: "Vila Capivari", title: "Campos do Jordão" },
  { key: "Parque Amantikir", title: "Amantikir" },
  { key: "Morro do Elefante", title: "Morro do Elefante" },
  { key: "Palácio Boa Vista", title: "Palácio Boa Vista" },
  { key: "Ducha de Prata", title: "Ducha de Prata" },
  { key: "Horto Florestal CJ", title: "Parque Estadual de Campos do Jordão" },
  { key: "Pico do Itapeva", title: "Pico do Itapeva (Pindamonhangaba)" },
  { key: "Museu Felícia Leirner", title: "Museu Felícia Leirner" },

  // Gramado
  { key: "Rua Coberta", title: "Gramado" },
  { key: "Lago Negro", title: "Lago Negro (Gramado)" },
  { key: "Mini Mundo", title: "Mini Mundo" },
  { key: "Snowland", title: "Snowland" },

  // Foz
  { key: "Cataratas do Iguaçu", title: "Cataratas do Iguaçu" },
  { key: "Parque das Aves", title: "Parque das Aves" },
  { key: "Itaipu", title: "Usina Hidrelétrica de Itaipu" },
  { key: "Marco 3 Fronteiras", title: "Marco das Três Fronteiras" },

  // Salvador
  { key: "Pelourinho", title: "Pelourinho (Salvador)" },
  { key: "Farol da Barra", title: "Farol da Barra (Salvador)" },
  { key: "Elevador Lacerda", title: "Elevador Lacerda" },
  { key: "Igreja de São Francisco", title: "Igreja e Convento de São Francisco (Salvador)" },

  // Curitiba
  { key: "Jardim Botânico Curitiba", title: "Jardim Botânico de Curitiba" },
  { key: "Museu Oscar Niemeyer", title: "Museu Oscar Niemeyer" },
  { key: "Ópera de Arame", title: "Ópera de Arame" },
  { key: "Parque Tanguá", title: "Parque Tanguá" },

  // Paris
  { key: "Torre Eiffel", title: "Torre Eiffel" },
  { key: "Museu do Louvre", title: "Museu do Louvre" },
  { key: "Notre Dame", title: "Catedral de Notre-Dame de Paris" },
  { key: "Sacre Coeur", title: "Basílica de Sacré-Cœur" },

  // Roma
  { key: "Coliseu", title: "Coliseu" },
  { key: "Fontana di Trevi", title: "Fontana di Trevi" },
  { key: "Panteão", title: "Panteão (Roma)" },
  { key: "Basílica de São Pedro", title: "Basílica de São Pedro" },
];

async function getImages() {
  const results = {};
  for (const item of spotsToFetch) {
    try {
      const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'RoteiroTur-App/1.0' } });
      if (res.ok) {
        const data = await res.json();
        const img = data.originalimage?.source || data.thumbnail?.source;
        results[item.key] = img || 'NOT_FOUND';
      } else {
        // Try direct search on Commons
        results[item.key] = 'FETCH_FAILED';
      }
    } catch (e) {
      results[item.key] = 'ERROR: ' + e.message;
    }
  }
  console.log('FETCHED REAL WIKIPEDIA IMAGES:');
  console.log(JSON.stringify(results, null, 2));
}

getImages();
