mapboxgl.accessToken = mapToken;

const coords = listing.geometry.coordinates; // [lng, lat]
const lat = coords[1];
const lng = coords[0];

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: coords,
  zoom: 7,
});

map.addControl(new mapboxgl.NavigationControl());

const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

const marker = new mapboxgl.Marker()
  .setLngLat(coords)
  .setPopup(
    new mapboxgl.Popup({ offset: 25 }).setHTML(`
      <h6>${listing.title}</h6>
      <p>${listing.location}</p>
      <a href="${googleMapsUrl}" target="_blank" class="btn btn-sm btn-primary mt-2">
        Open in Google Maps
      </a>
    `)
  )
  .addTo(map);
