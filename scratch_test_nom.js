async function testNominatimPOIs() {
  const query = "pontos turisticos Barra Mansa";
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'RoteiroTur-MVP/1.0' }
  });
  const data = await res.json();
  console.log('Nominatim tourist spots:', JSON.stringify(data, null, 2));
}
testNominatimPOIs();
