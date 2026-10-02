const queries = [
  // Rio
  { id: "rio-cristo", q: "Christ the Redeemer statue Rio de Janeiro" },
  { id: "rio-pao", q: "Sugarloaf Mountain Rio de Janeiro cable car" },
  { id: "rio-botanico", q: "Jardim Botânico do Rio de Janeiro palmeiras" },
  { id: "rio-selaron", q: "Escadaria Selaron Rio de Janeiro" },
  { id: "rio-amanha", q: "Museu do Amanha Rio de Janeiro" },
  { id: "rio-forte", q: "Forte de Copacabana" },
  { id: "rio-lage", q: "Parque Henrique Lage" },
  { id: "rio-lapa", q: "Aqueduto da Carioca Arcos da Lapa" },

  // SP
  { id: "sp-masp", q: "Museu de Arte de São Paulo MASP" },
  { id: "sp-ibirapuera", q: "Parque Ibirapuera Sao Paulo" },
  { id: "sp-liberdade", q: "Bairro Liberdade Sao Paulo lanternas" },
  { id: "sp-mercadao", q: "Mercado Municipal de Sao Paulo vitrais" },
  { id: "sp-pinacoteca", q: "Pinacoteca do Estado de Sao Paulo edificio" },
  { id: "sp-beco", q: "Beco do Batman Vila Madalena" },
  { id: "sp-farol", q: "Edificio Altino Arantes Banespa" },
  { id: "sp-se", q: "Catedral da Se de Sao Paulo fachada" },

  // Campos do Jordão
  { id: "cj-capivari", q: "Vila Capivari Campos do Jordao" },
  { id: "cj-amantikir", q: "Amantikir labirinto" },
  { id: "cj-elefante", q: "Morro do Elefante teleferico" },
  { id: "cj-palacio", q: "Palacio Boa Vista Campos do Jordao" },
  { id: "cj-ducha", q: "Ducha de Prata Campos do Jordao" },
  { id: "cj-horto", q: "Horto Florestal de Campos do Jordao araucarias" },
  { id: "cj-pico", q: "Pico do Itapeva" },
  { id: "cj-felicia", q: "Museu Felicia Leirner" },

  // Gramado
  { id: "gra-rua", q: "Rua Coberta Gramado" },
  { id: "gra-lago", q: "Lago Negro Gramado pedalinho" },
  { id: "gra-mini", q: "Mini Mundo Gramado" },
  { id: "gra-snow", q: "Snowland Gramado" },

  // Foz
  { id: "foz-cataratas", q: "Cataratas do Iguacu Garganta do Diabo" },
  { id: "foz-aves", q: "Parque das Aves Foz do Iguacu" },
  { id: "foz-itaipu", q: "Usina Hidreletrica de Itaipu barragem" },
  { id: "foz-marcat", q: "Marco das Tres Fronteiras Foz" },

  // Salvador
  { id: "sal-pelo", q: "Pelourinho Salvador casario" },
  { id: "sal-farol", q: "Farol da Barra Salvador Bahia" },
  { id: "sal-elevador", q: "Elevador Lacerda Salvador" },
  { id: "sal-igreja", q: "Igreja e Convento de Sao Francisco Salvador ouro" },

  // Curitiba
  { id: "cwb-botanico", q: "Jardim Botanico de Curitiba estufa" },
  { id: "cwb-mon", q: "Museu Oscar Niemeyer olho" },
  { id: "cwb-opera", q: "Opera de Arame Curitiba" },
  { id: "cwb-tangua", q: "Parque Tangua Curitiba mirante" },

  // Florianópolis
  { id: "fln-ponte", q: "Ponte Hercilio Luz Florianopolis" },
  { id: "fln-lagoa", q: "Lagoa da Conceicao Florianopolis" },
  { id: "fln-dunas", q: "Dunas da Joaquina Florianopolis" },
  { id: "fln-santo", q: "Santo Antonio de Lisboa Florianopolis" },

  // Paris
  { id: "par-eiffel", q: "Eiffel Tower Paris Champ de Mars" },
  { id: "par-louvre", q: "Louvre Museum pyramid Paris" },
  { id: "par-notre", q: "Notre-Dame de Paris cathedral" },
  { id: "par-sacre", q: "Sacre-Coeur Montmartre Paris" },

  // Roma
  { id: "rom-coliseu", q: "Colosseum Rome exterior" },
  { id: "rom-trevi", q: "Trevi Fountain Rome" },
  { id: "rom-pantheon", q: "Pantheon Rome facade" },
  { id: "rom-vatican", q: "St. Peter's Basilica Rome square" }
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  const result = {};
  for (const item of queries) {
    await sleep(250); // 250ms delay to respect rate limit
    try {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(item.q)}&gsrlimit=1&prop=pageimages&pithumbsize=1200&format=json&origin=*`;
      const res = await fetch(url, { headers: { 'User-Agent': 'RoteiroTurApp/1.0 (https://roteirotur.app; contact@roteirotur.app)' } });
      if (res.ok) {
        const data = await res.json();
        const pages = data.query?.pages;
        if (pages) {
          const first = Object.values(pages)[0];
          result[item.id] = first?.thumbnail?.source || 'NOT_FOUND';
        } else {
          result[item.id] = 'NOT_FOUND';
        }
      } else {
        result[item.id] = 'HTTP_' + res.status;
      }
    } catch (e) {
      result[item.id] = 'ERROR: ' + e.message;
    }
  }
  console.log('FINAL_RESULTS:');
  console.log(JSON.stringify(result, null, 2));
}

run();
