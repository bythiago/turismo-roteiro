async function testWikiTextSearch() {
  const cityName = "Barra Mansa";
  const url = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cityName + " atrações turismo monumentos história")}&srlimit=10&format=json&origin=*`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'RoteiroTur-MVP/1.0' }
  });
  const data = await res.json();
  console.log('Search results for', cityName, ':', JSON.stringify(data.query?.search, null, 2));
}
testWikiTextSearch();
