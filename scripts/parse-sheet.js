import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawCsvUrl = 'https://docs.google.com/spreadsheets/d/1xtegmO-6y8jm9N8sin17lHCcxEHnWJH9I2rnDm7IOew/export?format=csv';

async function parseSheet() {
  console.log('Fetching CSV from Google Sheet...');
  const res = await fetch(rawCsvUrl);
  const text = await res.text();

  const lines = text.split(/\r?\n/);
  console.log(`Total lines: ${lines.length}`);

  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('編號') && lines[i].includes('二級行政區') && lines[i].includes('三級行政區')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.error('Could not find header line');
    return;
  }

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const districts = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    const id = parseInt(cols[0], 10);
    if (isNaN(id) || id < 1 || id > 368) continue;

    const county = cols[1] ? cols[1].replace(/"/g, '').trim() : '';
    const township = cols[2] ? cols[2].replace(/"/g, '').trim() : '';
    const region = cols[3] ? cols[3].replace(/"/g, '').trim() : '';
    let rawAttractions = cols[4] ? cols[4].replace(/"/g, '').trim() : '';
    const rawFoods = cols[5] ? cols[5].replace(/"/g, '').trim() : '';
    const districtType = cols[8] ? cols[8].replace(/"/g, '').trim() : '';
    const postalCode = cols[9] ? cols[9].replace(/"/g, '').trim() : '';
    const villagesCount = cols[10] ? parseInt(cols[10], 10) || 0 : 0;
    const neighborhoodsCount = cols[11] ? parseInt(cols[11], 10) || 0 : 0;
    const code = cols[12] ? cols[12].replace(/"/g, '').trim() : '';

    if (id === 133 && county === '高雄市' && township === '大社區' && !rawAttractions.includes('大社保元宮')) {
      rawAttractions = '觀音山風景區、大社青雲宮、大社保元宮';
    }

    const attractions = rawAttractions
      .split(/[、,，/]/)
      .map(s => s.trim())
      .filter(Boolean)
      .map((name, idx) => ({
        id: `A${idx + 1}`,
        name
      }));

    const foods = rawFoods
      .split(/[、,，/]/)
      .map(s => s.trim())
      .filter(Boolean)
      .map((name, idx) => ({
        id: `F${idx + 1}`,
        name
      }));

    districts.push({
      id,
      county,
      township,
      fullName: `${county}${township}`,
      region,
      districtType,
      postalCode,
      villagesCount,
      neighborhoodsCount,
      code,
      attractions,
      foods
    });
  }

  console.log(`Successfully parsed ${districts.length} districts.`);

  const outPath = path.resolve(__dirname, '../public/data/taiwan368.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(districts, null, 2), 'utf-8');
  console.log(`Saved to ${outPath}`);

  let totalAttractions = 0;
  let totalFoods = 0;
  districts.forEach(d => {
    totalAttractions += d.attractions.length;
    totalFoods += d.foods.length;
  });
  console.log(`Total Attractions: ${totalAttractions}, Total Foods: ${totalFoods}`);
}

parseSheet().catch(console.error);
