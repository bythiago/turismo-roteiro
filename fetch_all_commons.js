const queries = [
  // SP
  { id: "sp-liberdade", q: "Bairro da Liberdade São Paulo" },
  { id: "sp-mercadão", q: "Mercado Municipal de São Paulo" },
  { id: "sp-pinacoteca", q: "Pinacoteca do Estado de São Paulo" },
  { id: "sp-beco", q: "Beco do Batman São Paulo" },
  { id: "sp-farol", q: "Edifício Altino Arantes Farol Santander" },
  { id: "sp-catedral", q: "Catedral da Sé São Paulo" },

  // Campos do Jordão
  { id: "cj-capivari", q: "Vila Capivari Campos do Jordão" },
  { id: "cj-amantikir", q: "Parque Amantikir Campos do Jordão" },
  { id: "cj-elefante", q: "Morro do Elefante Teleférico Campos do Jordão" },
  { id: "cj-palacio", q: "Palácio Boa Vista Campos do Jordão" },
  { id: "cj-ducha", q: "Ducha de Prata Campos do Jordão" },
  { id: "cj-horto", q: "Horto Florestal de Campos do Jordão" },
  { id: "cj-pico", q: "Pico do Itapeva" },
  { id: "cj-felicia", q: "Museu Felícia Leirner" },

  // Gramado
  { id: "gra-rua", q: "Rua Coberta Gramado" },
  { id: "gra-lago", q: "Lago Negro Gramado" },
  { id: "gra-mini", q: "Mini Mundo Gramado" },
  { id: "gra-snow", q: "Snowland Gramado" },

  // Foz
  { id: "foz-cataratas", q: "Cataratas do Iguaçu" },
  { id: "foz-aves", q: "Parque das Aves Foz" },
  { id: "foz-itaipu", q: "Usina Hidrelétrica de Itaipu" },
  { id: "foz-fronteiras", q: "Marco das Três Fronteiras" },

  // Salvador
  { id: "sal-pelo", q: "Pelourinho Salvador" },
  { id: "sal-farol", q: "Farol da Barra Salvador" },
  { id: "sal-elevador", q: "Elevador Lacerda" },
  { id: "sal-igreja", q: "Igreja de São Francisco Salvador" },

  // Curitiba
  { id: "cwb-botanico", q: "Jardim Botânico de Curitiba" },
  { id: "cwb-mon", q: "Museu Oscar Niemeyer" },
  { id: "cwb-opera", q: "Ópera de Arame Curitiba" },
  { id: "cwb-tangua", q: "Parque Tanguá Curitiba" },

  // Florianópolis
  { id: "fln-ponte", q: "Ponte Hercílio Luz" },
  { id: "fln-lagoa", q: "Lagoa da Conceição Florianópolis" },
  { id: "fln-dunas", q: "Dunas da Joaquina" },
  { id: "fln-santo", q: "Santo Antônio de Lisboa Florianópolis" },

  // Paris
  { id: "par-eiffel", q: "Tour Eiffel" },
  { id: "par-louvre", q: "Musée du Louvre" },
  { id: "par-notre", q: "Cathédrale Notre-Dame de Paris" },
  { id: "par-sacre", q: "Basilique du Sacré-Cœur de Montmartre" },

  // Roma
  { id: "rom-coliseu", q: "Colosseum Rome" },
  { id: "rom-trevi", q: "Trevi Fountain" },
  { id: "rom-pantheon", q: "Pantheon Rome" },
  { id: "rom-vatican", q: "St. Peter's Basilica" }
];

async function run() {
  const result = {};
  for (const item of queries) {
    try {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(item.q)}&gsrlimit=1&prop=pageimages&pithumbsize=1200&format=json&origin=*`;
      const res = await fetch(url, { headers: { 'User-Agent': 'RoteiroTur-App/1.0' } });
      const data = await res.json();
      const pages = data.query?.pages;
      if (pages) {
        const first = Object.values(pages)[0];
        result[item.id] = first?.thumbnail?.source || 'NOT_FOUND';
      } else {
        result[item.id] = 'NOT_FOUND';
      }
    } catch (e) {
      result[item.id] = 'ERROR: ' + e.message;
    }
  }
  console.log(JSON.stringify(result, null, 2));
}

run();
