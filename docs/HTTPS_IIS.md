# HTTPS para Crystal SCADA en IIS

## Resultado esperado

La terminacion TLS queda en IIS:

```text
Navegador
  -> https://crystalscada
  -> IIS :443
       -> /api/* -> http://127.0.0.1:8090/*
       -> /ws/*  -> http://127.0.0.1:8090/ws/*
       -> archivos React/Vite
```

El navegador usa `https://` y `wss://`. El backend y el collector pueden seguir
comunicandose por HTTP local; no es necesario instalar el certificado en Uvicorn.

## Estado detectado el 23-07-2026

- Equipo: `Crystal-Lagoons`.
- IP de la interfaz Internet: `192.168.1.22`.
- IP de Router VPN: `192.168.2.100`.
- Sitio IIS: `CrystalScada`.
- Ruta fisica publicada: `C:\inetpub\wwwroot\CrystalScada`.
- IIS responde por HTTP en el puerto 80.
- El puerto 443 no esta escuchando porque el sitio no tiene binding HTTPS.
- Existe un certificado anterior para `Crystal-Lagoons`, pero no corresponde a
  la URL nueva `crystalscada`. Se debe crear un certificado nuevo que incluya
  exactamente ese nombre en CN/SAN.
- HTTP.sys tiene un certificado Siemens para `localhost` en `0.0.0.0:443`.
  El script crea un binding SNI para `crystalscada`, sin reemplazar ese
  certificado.

## Elegir el certificado

### Opcion recomendada para una red corporativa

Solicitar a TI un certificado emitido por la CA corporativa para un FQDN, por
ejemplo `scada.empresa.internal`, y crear el registro DNS A correspondiente.
Entregar el certificado a IIS como PFX con clave privada.

Si se usa un dominio publico propio, tambien se puede usar una CA publica. Las CA
publicas no emiten certificados para nombres de una sola etiqueta como
`Crystal-Lagoons` ni para IP privadas.

### Opcion rapida para la instalacion actual

Crear un certificado autofirmado para `crystalscada`. Cada equipo
cliente debe:

1. Resolver `crystalscada` hacia la IP alcanzable del servidor.
2. Confiar en el archivo publico `.cer`.
3. Abrir exactamente `https://crystalscada`, no la IP.

El archivo `.cer` no contiene la clave privada y se puede distribuir. Nunca
distribuir el `.pfx`.

## Paso a paso en este servidor

### 1. Preparar DNS

Desde cada cliente:

```powershell
Resolve-DnsName crystalscada
Test-NetConnection crystalscada -Port 443
```

TI debe crear un registro DNS. Como prueba temporal se puede agregar al archivo
`C:\Windows\System32\drivers\etc\hosts` del cliente:

```text
192.168.1.22 crystalscada
```

Para clientes que entran por VPN, usar la IP que sea enrutable desde esa red.
El nombre debe seguir siendo `crystalscada` para coincidir con el certificado.

### 2. Crear el binding HTTPS

Abrir PowerShell **como Administrador**:

```powershell
cd C:\WebCrystalScada\crystal-frontend

Set-ExecutionPolicy -Scope Process Bypass

.\scripts\Configure-IisHttps.ps1 `
  -HostName crystalscada `
  -CreateSelfSignedCertificate `
  -OpenFirewall `
  -ExportCerPath C:\WebCrystalScada\certificates\CrystalScada.cer `
  -DeployWebConfig
```

El script identifica el sitio que apunta a
`C:\inetpub\wwwroot\CrystalScada`. Si existe mas de uno, consultar:

```powershell
Import-Module WebAdministration
Get-Website | Format-Table Name, State, PhysicalPath
```

Y repetir agregando:

```powershell
-SiteName "NOMBRE EXACTO DEL SITIO"
```

Para un certificado PFX emitido por TI:

```powershell
$pfxPassword = Read-Host "Contrasena del PFX" -AsSecureString

.\scripts\Configure-IisHttps.ps1 `
  -HostName scada.empresa.internal `
  -PfxPath C:\RutaSegura\scada.empresa.internal.pfx `
  -PfxPassword $pfxPassword `
  -OpenFirewall `
  -DeployWebConfig
```

Si el nombre definitivo no es `crystal-lagoons`, actualizar tambien el destino
de la regla `RedirectHttpToHttps` en `public\web.config` antes de compilar.

### 3. Confiar en el certificado autofirmado

Omitir este paso si el certificado viene de una CA que los clientes ya confian.

Copiar solamente `CrystalScada.cer` al cliente y, en PowerShell como
Administrador, ejecutar:

```powershell
Import-Certificate `
  -FilePath C:\Ruta\CrystalScada.cer `
  -CertStoreLocation Cert:\LocalMachine\Root
```

En un dominio de Active Directory, TI puede distribuir la confianza mediante una
GPO en lugar de hacerlo equipo por equipo.

### 4. Permitir el origen en FastAPI/WebSocket

En `C:\WebCrystalScada\crystal-backend\.env`, el origen debe aparecer en ambas
variables, en minusculas y sin `/` final:

```dotenv
CORS_ALLOWED_ORIGINS=...,https://crystalscada
WS_ALLOWED_ORIGINS=...,https://crystalscada
```

Si se elige otro FQDN, reemplazar el nombre. Aplicar el cambio:

```powershell
Restart-Service CrystalBackendService
```

### 5. Compilar y publicar la configuracion HTTPS

Hacerlo despues de que el binding 443 exista:

```powershell
cd C:\WebCrystalScada\crystal-frontend
npm ci
npm run build
```

Vite copia `public\web.config` a `dist\web.config`. El sitio IIS de este servidor
se publica desde otra ruta:

```text
C:\inetpub\wwwroot\CrystalScada
```

El parametro `-DeployWebConfig` copia la configuracion compilada a esa ruta una
vez que el binding HTTPS ha sido creado correctamente. La configuracion:

- redirige HTTP a HTTPS con codigo 301;
- expone `/api` y `/ws` por el mismo host seguro;
- envia HSTS, `nosniff`, `SAMEORIGIN` y una politica de referer;
- conserva el fallback de la SPA.

La opcion WebSocket esta habilitada y bloqueada a nivel global en este servidor.
Por eso `web.config` no declara `<webSocket enabled="true" />`; agregarla a nivel
del sitio produce el error IIS `500.19 / 0x80070021`.

No hay que configurar `VITE_API_HTTP` ni `VITE_API_WS`: deben seguir vacias para
usar el mismo origen.

### 6. Validar

Desde el servidor y luego desde un cliente:

```powershell
curl.exe -I http://crystalscada
curl.exe -I https://crystalscada
curl.exe https://crystalscada/api/health
```

Resultados:

- HTTP responde `301` hacia `https://crystalscada/...`.
- HTTPS responde sin advertencia de certificado y contiene
  `Strict-Transport-Security`.
- `/api/health` responde `200`.
- En DevTools del navegador, la conexion SCADA aparece como
  `wss://crystalscada/ws/...` y responde `101 Switching Protocols`.

No aceptar como validacion `curl -k` ni ignorar la advertencia del navegador:
eso cifra la conexion, pero no valida la identidad del servidor.

## Renovacion

El certificado autofirmado actual vence el `04-02-2027`. Renovarlo al menos 30
dias antes. Tras importar el nuevo PFX, repetir el script con el thumbprint nuevo;
no es necesario cambiar la aplicacion si se conserva el mismo nombre DNS.

Comprobar periodicamente:

```powershell
Get-ChildItem Cert:\LocalMachine\My |
  Where-Object Subject -Like "*crystal-lagoons*" |
  Format-Table Subject, Thumbprint, NotAfter
```

## Reversion de emergencia

Si el binding falla antes de compilar, HTTP sigue funcionando. Si ya se publico
la redireccion y es necesario recuperar HTTP temporalmente, comentar o quitar la
regla `RedirectHttpToHttps` de `public\web.config`, volver a ejecutar
`npm run build` y corregir el certificado antes de reactivar HTTPS.

## Referencias oficiales

- [Bindings HTTPS y SNI en IIS](https://learn.microsoft.com/en-us/iis/configuration/system.applicationHost/sites/site/bindings/binding)
- [Configurar un binding SSL con PowerShell](https://learn.microsoft.com/en-us/iis/manage/powershell/powershell-snap-in-configuring-ssl-with-the-iis-powershell-snap-in)
- [HSTS en IIS](https://learn.microsoft.com/en-us/iis/configuration/system.applicationHost/sites/sitedefaults/hsts)
