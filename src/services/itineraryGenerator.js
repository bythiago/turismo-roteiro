/**
 * Calcula a distância em km entre duas coordenadas (Fórmula de Haversine)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const PERIODS = ["Manhã", "Tarde", "Fim de Tarde", "Noite"];

/**
 * Agrupa atrações por proximidade geográfica para otimizar o deslocamento
 * e distribui ao longo dos dias especificados.
 */
export function generateAutoItinerary({
  allSpots = [],
  days = 2,
  attractionsPerDay = 3,
  category = "all",
}) {
  if (!allSpots || allSpots.length === 0) return [];

  const targetTotal = Math.min(days * attractionsPerDay, allSpots.length);

  // 1. Filtra por categoria se selecionada
  let candidates = [...allSpots];
  if (category !== "all") {
    const filtered = candidates.filter((s) => {
      const cat = (s.category || "").toLowerCase();
      const tags = (s.tags || []).join(" ").toLowerCase();
      return cat.includes(category) || tags.includes(category);
    });
    if (filtered.length >= targetTotal) {
      candidates = filtered;
    }
  }

  // 2. Ordena candidatos por pontuação / popularidade para pegar os melhores
  candidates.sort((a, b) => {
    const scoreA = (a.rating || 4.5) * 10000 + (a.reviewsCount || 0);
    const scoreB = (b.rating || 4.5) * 10000 + (b.reviewsCount || 0);
    return scoreB - scoreA;
  });

  const selectedSpots = candidates.slice(0, targetTotal);
  if (selectedSpots.length === 0) return [];

  // 3. Algoritmo de Otimização de Rotas por Proximidade (Nearest Neighbor Clustering)
  // Agrupa pontos próximos no mesmo dia para evitar viagens longas pela cidade
  const unassigned = [...selectedSpots];
  const itinerary = [];
  let globalOrder = 1;

  for (let day = 1; day <= days; day++) {
    if (unassigned.length === 0) break;

    // Pega o ponto âncora do dia (o mais bem avaliado restante)
    let currentSpot = unassigned.shift();
    const daySpots = [currentSpot];

    // Quantas atrações cabem nesse dia
    const spotsForThisDay = Math.min(attractionsPerDay, unassigned.length + 1);

    while (daySpots.length < spotsForThisDay && unassigned.length > 0) {
      // Encontra a atração mais próxima do ponto atual
      let nearestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unassigned.length; i++) {
        const dist = calculateDistance(
          currentSpot.lat,
          currentSpot.lon,
          unassigned[i].lat,
          unassigned[i].lon
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = i;
        }
      }

      currentSpot = unassigned.splice(nearestIndex, 1)[0];
      daySpots.push(currentSpot);
    }

    // Atribui horários e dias para as atrações deste dia
    daySpots.forEach((spot, idx) => {
      const period = PERIODS[Math.min(idx, PERIODS.length - 1)];
      itinerary.push({
        ...spot,
        day: day,
        period: period,
        order: globalOrder++,
        autoAssigned: true,
      });
    });
  }

  return itinerary;
}
