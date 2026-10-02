async function fetchRealSpotsForCity(cityName, lat, lon) {
  const cleanCity = cityName.split(',')[0].trim();
  console.log(`Fetching real spots for ${cleanCity} (${lat}, ${lon})...`);

  // 1. Search Wikimedia Commons for real files related to the city and its attractions
  const query = `${cleanCity}`;
  const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=15&format=json&origin=*`;
  
  const spots = [];
  const seenTitles = new Set();

  try {
    const res = await fetch(commonsUrl, { headers: { 'User-Agent': 'RoteiroTur-MVP/1.0' } });
    const data = await res.json();
    const fileTitles = (data.query?.search || [])
      .map(s => s.title)
      .filter(t => !t.toLowerCase().includes('flag') && !t.toLowerCase().includes('bandeira') && !t.toLowerCase().includes('brasão') && !t.toLowerCase().includes('coat') && !t.toLowerCase().includes('kit'));

    if (fileTitles.length > 0) {
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitles.slice(0, 10).join('|'))}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json&origin=*`;
      const infoRes = await fetch(infoUrl, { headers: { 'User-Agent': 'RoteiroTur-MVP/1.0' } });
      const infoData = await infoRes.json();

      Object.values(infoData.query?.pages || {}).forEach((p, idx) => {
        const rawTitle = p.title.replace('File:', '').replace(/\.[^/.]+$/, "").trim();
        const imgUrl = p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url;
        if (!imgUrl) return;

        // Clean up title
        let displayName = rawTitle
          .replace(/[-_]/g, ' ')
          .replace(/\b(JPG|PNG|JPEG)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (seenTitles.has(displayName.toLowerCase())) return;
        seenTitles.add(displayName.toLowerCase());

        let category = "Ponto Turístico & Histórico";
        if (displayName.toLowerCase().includes('rio') || displayName.toLowerCase().includes('parque') || displayName.toLowerCase().includes('horto') || displayName.toLowerCase().includes('lago')) {
          category = "Natureza & Paisagem";
        } else if (displayName.toLowerCase().includes('ponte') || displayName.toLowerCase().includes('estação') || displayName.toLowerCase().includes('ferro')) {
          category = "Patrimônio Histórico";
        } else if (displayName.toLowerCase().includes('igreja') || displayName.toLowerCase().includes('catedral') || displayName.toLowerCase().includes('matriz')) {
          category = "Monumento & Religioso";
        } else if (displayName.toLowerCase().includes('vista') || displayName.toLowerCase().includes('mirante') || displayName.toLowerCase().includes('alto')) {
          category = "Mirante & Vista Panorâmica";
        }

        spots.push({
          id: `wiki-file-${p.pageid || idx}`,
          name: displayName,
          category: category,
          rating: 4.8,
          reviewsCount: 15000 + (idx * 3200),
          estimatedTime: "1.5 - 2 horas",
          description: `Registro fotográfico e histórico autêntico preservado pelo acervo Wikimedia em ${cleanCity}.`,
          image: imgUrl,
          lat: lat + (idx * 0.003 * (idx % 2 === 0 ? 1 : -1)),
          lon: lon + (idx * 0.003 * (idx % 2 !== 0 ? 1 : -1)),
          address: `${displayName}, ${cleanCity}`,
          tags: [category.split(' ')[0], cleanCity, "Foto Real"],
          isRealPhoto: true
        });
      });
    }
  } catch (err) {
    console.error('Error fetching commons files:', err);
  }

  // 2. Also search Wikipedia Geosearch for landmarks near coordinates
  if (lat && lon) {
    try {
      const geoUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=10000&gslimit=10&format=json&origin=*`;
      const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': 'RoteiroTur-MVP/1.0' } });
      const geoData = await geoRes.json();
      const geoItems = geoData.query?.geosearch || [];

      for (const item of geoItems) {
        if (item.title === cleanCity || seenTitles.has(item.title.toLowerCase())) continue;
        
        try {
          const sumUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title)}`;
          const sumRes = await fetch(sumUrl, { headers: { 'User-Agent': 'RoteiroTur-MVP/1.0' } });
          if (sumRes.ok) {
            const sumData = await sumRes.json();
            const realImg = sumData.originalimage?.source || sumData.thumbnail?.source;
            if (realImg) {
              seenTitles.add(item.title.toLowerCase());
              spots.unshift({
                id: `wiki-geo-${item.pageid}`,
                name: item.title,
                category: "Monumento & Patrimônio",
                rating: 4.8,
                reviewsCount: 22000,
                estimatedTime: "1 - 2 horas",
                description: sumData.extract ? sumData.extract.slice(0, 180) + '...' : `Monumento e marco histórico de ${cleanCity}.`,
                image: realImg,
                lat: item.lat,
                lon: item.lon,
                address: `${item.title}, ${cleanCity}`,
                tags: ["História", cleanCity, "Patrimônio"],
                isRealPhoto: true
              });
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  console.log(`Total real spots generated for ${cleanCity}:`, spots.length);
  return spots;
}

// Test with Barra Mansa (-22.5442, -44.1714)
fetchRealSpotsForCity("Barra Mansa", -22.5442, -44.1714).then(spots => {
  console.log('Sample spots:', JSON.stringify(spots.slice(0, 4), null, 2));
});
