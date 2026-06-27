# Seguimiento de pagos Andre

Dashboard estatico para controlar 12 cuotas de S/ 451.72, total S/ 5,420.64.

## Archivos

- `index.html`: pantalla principal.
- `styles.css`: diseno responsive tipo dashboard.
- `app.js`: conexion con Supabase REST/Auth/Storage.
- `supabase-schema.sql`: tabla, datos iniciales, RLS y bucket de imagenes.
- `supabase-actualizar-fechas.sql`: actualiza las fechas programadas si la tabla ya existe.

## Configuracion en Supabase

1. Abre Supabase SQL Editor y ejecuta `supabase-schema.sql`.
   Si ya habias creado la tabla antes, ejecuta tambien `supabase-actualizar-fechas.sql`.
2. En Authentication crea o corrige el usuario administrador con el correo `andrezarate1234@gmail.com`.
3. Abre `iniciar-plataforma.bat` para iniciar el servidor local.
4. Entra por `Panel admin`, registra el monto, fecha e imagen de cada mes.

## Abrir desde el celular

1. Conecta la PC y el celular a la misma red WiFi.
2. Ejecuta `iniciar-plataforma.bat`.
3. En la ventana veras la direccion IPv4 de tu PC.
4. En el navegador del celular abre `http://IP-DE-TU-PC:8080`.
5. Si no carga, permite Python o el puerto 8080 en el Firewall de Windows.

## Crear el usuario administrador en Supabase

1. Entra a tu proyecto de Supabase.
2. Ve a `Authentication`.
3. Abre `Users`.
4. Presiona `Add user` o `Add new user`.
5. Elige crear usuario con correo y contrasena.
6. Escribe el correo `andrezarate1234@gmail.com`.
7. Escribe la contrasena acordada.
8. Activa `Auto Confirm User` si aparece esa opcion.
9. Guarda el usuario.
10. Verifica que el usuario aparezca como confirmado. Si aparece sin confirmar, entra al usuario y confirmalo o vuelve a crearlo con `Auto Confirm User` activo.

## Si el usuario ya existe y no ingresa

1. En `Authentication > Users`, busca `andrezarate1234@gmail.com`.
2. Abre el usuario.
3. Confirma que el correo este verificado o confirmado.
4. Cambia o restablece la contrasena desde las acciones del usuario.
5. Cierra la plataforma, vuelve a abrir `index.html` e intenta ingresar otra vez desde `Panel admin`.

Si aparece `Failed to fetch`, abre la plataforma con `iniciar-plataforma.bat` en vez de doble clic al archivo HTML.

La secret key no esta en el frontend. Si una secret key se comparte fuera de Supabase, conviene rotarla desde el panel del proyecto.
