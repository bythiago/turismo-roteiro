async function testWikiFiles() {
  const cityName = "Barra Mansa";
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cityName)}&srnamespace=6&srlimit=8&format=json&origin=*`;
  const res = await fetch(url, { headers: { 'User-Agent': 'RoteiroTur-MVP/1.0' } });
  const data = await res.json();
  const fileTitles = (data.query?.search || []).map(s => s.title);
  console.log('Found Wikimedia Files for', cityName, ':', fileTitles);

  // Get image URLs for these files
  if (fileTitles.length > 0) {
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitles.join('|'))}&prop=imageinfo&iiprop=url&iiurlwidth=1000&format=json&origin=*`;
    const infoRes = await fetch(infoUrl, { headers: { 'User-Agent': 'RoteiroTur-MVP/1.0' } });
    const infoData = await infoRes.json();
    const images = Object.values(infoData.query?.pages || {}).map(p => ({
      title: p.title.replace('File:', '').replace(/\.[^/.]+$/, ""),
      url: p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url
    }));
    console.log('Real Wikimedia Photos for', cityName, ':', JSON.stringify(images, null, 2));
  }
}
testWikiFiles();
