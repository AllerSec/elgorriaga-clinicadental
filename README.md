# Clínica Dental Elgorriaga — Sitio web

Sitio web de la **Clínica Dental Elgorriaga**, dentistas en Irún (Gipuzkoa) con más de 25 años de experiencia.

🌐 **Producción:** https://www.clinicadentalelgorriaga.net/

## Stack

- HTML estático multipágina (sin framework, sin build) servido desde la raíz para **GitHub Pages**.
- [GSAP](https://gsap.com/) + ScrollTrigger para animaciones (alojado localmente).
- [Leaflet](https://leafletjs.com/) + OpenStreetMap para el mapa (alojado localmente, sin API key).
- Fuentes self-hosted: Bricolage Grotesque + Hanken Grotesk (WOFF2).

## Estructura

```
.
├── index.html                  Inicio
├── tratamientos.html           Tratamientos (odontología, estética, implantes, ortodoncia, infantil, prótesis)
├── clinica.html                La Clínica: ubicación, mapa, horario, equipo
├── blog.html                   Blog de salud dental
├── aviso-legal.html
├── politica-de-privacidad.html
├── politica-de-cookies.html
├── 404.html                    Página de error con redirección
├── assets/
│   ├── css/                    base · components · pages · icons
│   ├── js/                     app.js · lang-detect.js · vendor (gsap, scrolltrigger)
│   ├── fonts/                  WOFF2 self-hosted
│   ├── img/                    marca · clinica · tratamientos · equipo · galeria · og
│   └── vendor/leaflet/         mapa
├── robots.txt · sitemap.xml · llms.txt · llms-full.txt
├── CNAME · .nojekyll
```

## Desarrollo local

```bash
python -m http.server 8000
# http://localhost:8000
```

## Despliegue

GitHub Pages sirve la rama `main` desde la raíz. El dominio personalizado está en `CNAME`.

---

Diseñado y desarrollado por [unaxaller.com](https://unaxaller.com).
