// Utility for reverse geocoding coordinates into human-readable physical addresses

export async function reverseGeocode(lat, lng) {
  if (!lat || !lng) return 'Unknown Location';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en'
        }
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        const mainPoint = a.amenity || a.building || a.shop || a.road || a.pedestrian || a.suburb || a.neighbourhood || '';
        const area = a.suburb || a.neighbourhood || a.city_district || a.village || a.town || '';
        const city = a.city || a.town || a.county || a.state_district || '';
        const state = a.state || '';
        const postcode = a.postcode || '';

        const parts = [mainPoint, area, city, postcode].filter(Boolean);
        // Remove duplicate adjacent parts
        const uniqueParts = parts.filter((item, index) => parts.indexOf(item) === index);
        
        if (uniqueParts.length >= 2) {
          return uniqueParts.join(', ');
        }
        if (data.display_name) {
          return data.display_name.split(',').slice(0, 4).join(', ').trim();
        }
      }
    }
  } catch (err) {
    console.warn('Reverse geocoding error:', err.message);
  }

  // Clean fallback with readable coordinates
  return `Near Coordinates (${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)})`;
}
