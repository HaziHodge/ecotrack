import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './RutaVerde.jsx'
import './index.css'
import { reportWebVitals } from './utils/vitals'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

// Fix for broken Leaflet icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

if (import.meta.env.DEV) {
  reportWebVitals(console.log);
}
