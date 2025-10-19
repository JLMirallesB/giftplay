# Guía de Despliegue

Cómo desplegar GIFTPlay en diferentes plataformas.

## 🚀 Opciones de Despliegue

GIFTPlay es una aplicación **100% frontend** (sin backend), por lo que puede ser desplegada en cualquier servicio de hosting estático.

---

## 1. GitHub Pages (Recomendado)

**Ventajas:**
- ✅ Gratis
- ✅ Fácil integración con GitHub
- ✅ HTTPS automático
- ✅ Actualizaciones automáticas con cada push

### Pasos

1. **Crea un repositorio en GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/giftplay.git
   git push -u origin main
   ```

2. **Habilita GitHub Pages**:
   - Ve a **Settings** → **Pages**
   - En **Source**, selecciona `main` branch
   - Carpeta: `/ (root)`
   - Guarda

3. **Accede a tu app**:
   - URL: `https://tu-usuario.github.io/giftplay/`

### Dominio Personalizado (Opcional)

1. En **Settings** → **Pages** → **Custom domain**
2. Agrega tu dominio (ej: `giftplay.tudominio.com`)
3. Configura DNS:
   ```
   CNAME    giftplay    tu-usuario.github.io
   ```

---

## 2. Netlify

**Ventajas:**
- ✅ Gratis (plan básico)
- ✅ Deploy previews
- ✅ HTTPS automático
- ✅ CDN global

### Método 1: Drag & Drop

1. Ve a [Netlify Drop](https://app.netlify.com/drop)
2. Arrastra la carpeta `giftplay/`
3. ¡Listo! URL: `https://random-name.netlify.app`

### Método 2: Git Integration

1. Conecta tu repositorio GitHub en Netlify
2. Configuración:
   - **Build command**: (vacío)
   - **Publish directory**: `.`
3. Deploy automático con cada push

---

## 3. Vercel

**Ventajas:**
- ✅ Gratis
- ✅ Edge network
- ✅ Deploy automático

### Pasos

1. Instala Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   cd giftplay
   vercel
   ```

3. Sigue las instrucciones en pantalla

**O** conecta tu repositorio en [vercel.com](https://vercel.com)

---

## 4. Firebase Hosting

**Ventajas:**
- ✅ Gratis (hasta 10 GB de transferencia/mes)
- ✅ CDN global de Google
- ✅ HTTPS automático

### Pasos

1. Instala Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Inicializa:
   ```bash
   cd giftplay
   firebase login
   firebase init hosting
   ```

3. Configuración:
   - Public directory: `.`
   - Single-page app: **No**
   - GitHub deploys: (opcional)

4. Deploy:
   ```bash
   firebase deploy
   ```

---

## 5. Servidor Propio (Apache/Nginx)

### Apache

1. Copia archivos al servidor:
   ```bash
   scp -r giftplay/* user@server:/var/www/html/giftplay/
   ```

2. Configuración (`/etc/apache2/sites-available/giftplay.conf`):
   ```apache
   <VirtualHost *:80>
       ServerName giftplay.tudominio.com
       DocumentRoot /var/www/html/giftplay

       <Directory /var/www/html/giftplay>
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>

       ErrorLog ${APACHE_LOG_DIR}/giftplay_error.log
       CustomLog ${APACHE_LOG_DIR}/giftplay_access.log combined
   </VirtualHost>
   ```

3. Habilita y reinicia:
   ```bash
   sudo a2ensite giftplay
   sudo systemctl reload apache2
   ```

### Nginx

Configuración (`/etc/nginx/sites-available/giftplay`):
```nginx
server {
    listen 80;
    server_name giftplay.tudominio.com;
    root /var/www/html/giftplay;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.(js|css|png|jpg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Habilita y reinicia:
```bash
sudo ln -s /etc/nginx/sites-available/giftplay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Configuración HTTPS

### Con Certbot (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d giftplay.tudominio.com
```

Renovación automática:
```bash
sudo certbot renew --dry-run
```

---

## Optimizaciones

### 1. Minificación

Minimiza archivos JS y CSS:

```bash
# Instalar herramientas
npm install -g terser csso-cli

# Minificar JavaScript
terser src/presentador/app.js -o src/presentador/app.min.js -c -m
terser src/jugador/app.js -o src/jugador/app.min.js -c -m

# Minificar CSS
csso assets/css/common.css -o assets/css/common.min.css
csso assets/css/presentador.css -o assets/css/presentador.min.css
csso assets/css/jugador.css -o assets/css/jugador.min.css
```

Actualiza los HTML para usar archivos `.min.js` y `.min.css`.

### 2. Compresión Gzip

**Apache** (`.htaccess`):
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

**Nginx**:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### 3. Caché

**Apache**:
```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
</IfModule>
```

**Nginx**: Ver configuración arriba (sección `location ~ \.(js|css|...)`).

---

## Contenido CDN

GIFTPlay usa CDNs para dependencias externas:

| Librería | CDN |
|----------|-----|
| PeerJS | unpkg.com |
| QRCode.js | cdn.jsdelivr.net |
| Marked.js | cdn.jsdelivr.net |
| KaTeX | cdn.jsdelivr.net |

**Ventajas:**
- ✅ Sin instalación de npm
- ✅ Caché del navegador compartida
- ✅ CDN global

**Desventajas:**
- ❌ Dependencia de servicios externos

### Opción: Self-hosting

Para evitar dependencias de CDN:

1. Descarga las librerías:
   ```bash
   mkdir -p assets/lib
   cd assets/lib

   # PeerJS
   wget https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js

   # QRCode
   wget https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js

   # Marked
   wget https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js

   # KaTeX
   wget https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js
   wget https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css
   ```

2. Actualiza las rutas en `index.html` y `jugador.html`:
   ```html
   <script src="assets/lib/peerjs.min.js"></script>
   <script src="assets/lib/qrcode.min.js"></script>
   <!-- etc. -->
   ```

---

## Monitorización

### Google Analytics (Opcional)

Agrega en `<head>` de `index.html` y `jugador.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## Troubleshooting

### Problema: "Failed to load resource" (404)

**Causa**: Rutas incorrectas
**Solución**: Verifica que todas las rutas sean relativas

### Problema: PeerJS no conecta

**Causa**: Firewall o puerto bloqueado
**Solución**:
- Verifica que puertos 443 y 80 estén abiertos
- Prueba en otra red

### Problema: LaTeX no se renderiza

**Causa**: KaTeX no carga
**Solución**:
- Verifica que el CDN de KaTeX esté accesible
- Revisa la consola del navegador

---

## Checklist de Deploy

- [ ] Archivos subidos al servidor
- [ ] HTTPS configurado
- [ ] Dominio apuntando correctamente
- [ ] Prueba en móvil
- [ ] Prueba con múltiples jugadores
- [ ] Verifica que archivos GIFT se cargan
- [ ] Verifica que QR se genera
- [ ] Prueba LaTeX si usas fórmulas

---

## Recursos

- [GitHub Pages Docs](https://docs.github.com/pages)
- [Netlify Docs](https://docs.netlify.com/)
- [Vercel Docs](https://vercel.com/docs)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)

---

**¡Tu aplicación está lista para el mundo!** 🌍
