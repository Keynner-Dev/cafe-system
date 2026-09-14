"""
generar_datos_prueba.py
------------------------------------------------------------------
Genera un volumen grande de datos de prueba REALISTAS llamando a la
API real del sistema (no toca la base de datos directamente). Así,
toda la lógica de negocio -- caja, WAC, cuentas por pagar, stock,
flete -- se ejecuta exactamente igual que si lo hiciera un usuario
desde el navegador. Sirve tanto para probar que todo funcione bien
como para ver cómo responde el frontend con hartos datos.

REQUISITOS ANTES DE CORRERLO:
  1. Tu .env debe apuntar a la base de PRUEBAS (nunca a producción).
  2. El servidor debe estar corriendo local: python manage.py runserver
  3. Necesitas el usuario/contraseña de un usuario con rol 'jefe' y
     de uno con rol 'administrador' (los mismos que ya tienes).
  4. Debe haber al menos Bodegas, Tipos de Café y Terceros cargados
     (ya los tienes, migrados desde producción).

USO:
    python generar_datos_prueba.py

No necesita ninguna librería nueva -- solo usa la librería estándar
de Python (urllib), para no tener que instalar nada.
------------------------------------------------------------------
"""

import urllib.request
import urllib.error
import json
import random
import getpass
from datetime import date, timedelta

BASE_URL = "http://127.0.0.1:8000/api"

# ── Volumen a generar -- ajusta estos números si quieres más o menos ──
N_COMPRAS = 80
N_VENTAS = 30
N_LETRAS = 15
N_GASTOS = 25
DIAS_PRECIOS = 20

CATEGORIAS_GASTO = [
    'Transporte', 'Mantenimiento', 'Insumos', 'Servicios públicos',
    'Papelería', 'Alimentación', 'Combustible', 'Varios',
]


def pedir(prompt, password=False):
    return (getpass.getpass(prompt) if password else input(prompt)).strip()


def api(method, path, token=None, data=None):
    """Llama a la API real. Devuelve (status_code, json_o_texto)."""
    url = f"{BASE_URL}{path}" if not path.startswith("http") else path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Token {token}"
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            texto = resp.read().decode() or "{}"
            return resp.status, json.loads(texto)
    except urllib.error.HTTPError as e:
        texto = e.read().decode()
        try:
            return e.code, json.loads(texto)
        except json.JSONDecodeError:
            return e.code, texto
    except urllib.error.URLError as e:
        print(f"\nNo se pudo conectar a {url}")
        print("¿Está corriendo 'python manage.py runserver' en otra terminal?")
        raise SystemExit(1) from e


def login(username, password):
    status, data = api("POST", "/auth/login/", data={"username": username, "password": password})
    if status != 200:
        print(f"No se pudo iniciar sesión con '{username}': {data}")
        raise SystemExit(1)
    return data["token"], data["usuario"]


def get_all(path, token):
    """Trae todas las páginas de un endpoint (si está paginado)."""
    resultados = []
    siguiente = path
    while siguiente:
        status, data = api("GET", siguiente, token=token)
        if status != 200:
            print(f"Error trayendo {siguiente}: {data}")
            break
        if isinstance(data, dict) and "results" in data:
            resultados.extend(data["results"])
            siguiente = data.get("next")
            if siguiente and siguiente.startswith(BASE_URL):
                siguiente = siguiente[len(BASE_URL):]
        else:
            resultados.extend(data)
            siguiente = None
    return resultados


def placa_aleatoria():
    letras = "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ", k=3))
    numeros = "".join(random.choices("0123456789", k=3))
    return f"{letras}{numeros}"


def cedula_aleatoria():
    return str(random.randint(10_000_000, 1_200_000_000))


def main():
    print("=== Generador de datos de prueba -- Cafe San ===\n")
    print(f"Servidor esperado en: {BASE_URL}")
    print("¡¡Confirma que tu .env apunta a la base de PRUEBAS antes de seguir!!\n")
    if pedir("Escribe 'si' para confirmar que es la base de pruebas: ").lower() != "si":
        print("Cancelado.")
        return

    admin_user = pedir("\nUsuario (rol administrador): ")
    admin_pass = pedir("Contraseña: ", password=True)
    jefe_user = pedir("\nUsuario (rol jefe -- para precios y precio_kilo_jefe): ")
    jefe_pass = pedir("Contraseña: ", password=True)

    token_admin, datos_admin = login(admin_user, admin_pass)
    token_jefe, datos_jefe = login(jefe_user, jefe_pass)
    print(f"\nConectado como administrador: {datos_admin['nombre']} (bodega: {datos_admin['bodega_nombre']})")
    print(f"Conectado como jefe: {datos_jefe['nombre']}\n")

    # ── Datos de referencia ya existentes (Bodegas, Tipos, Terceros) ──
    bodegas = get_all("/inventario/bodegas/", token_admin)
    tipos = get_all("/inventario/tipos-cafe/", token_admin)
    terceros = get_all("/terceros/terceros/?todos=1", token_admin)
    caficultores = [t for t in terceros if t["tipo"] in ("caficultor", "ambos")]
    empresas = [t for t in terceros if t["tipo"] in ("empresa", "ambos")]

    print(f"Bodegas: {len(bodegas)} | Tipos de café: {len(tipos)}")
    print(f"Caficultores: {len(caficultores)} | Empresas: {len(empresas)}\n")

    if not bodegas or not tipos or not caficultores:
        print("Faltan datos base (bodegas / tipos de café / caficultores). Abortando.")
        return

    hoy = date.today()

    # ── 1. Precios diarios (histórico, para que Precios y el dashboard tengan datos) ──
    print(f"Generando precios diarios ({DIAS_PRECIOS} días x {len(tipos)} tipos)...")
    precio_base = {t["id"]: random.randint(16000, 20000) for t in tipos}
    ok = 0
    total_precios = DIAS_PRECIOS * len(tipos)
    hecho = 0
    for i in range(DIAS_PRECIOS, 0, -1):
        fecha = hoy - timedelta(days=i)
        for t in tipos:
            precio_base[t["id"]] = max(precio_base[t["id"]] + random.randint(-300, 300), 10000)
            status, resp = api("POST", "/precios/precio-diario/", token=token_jefe, data={
                "tipo_cafe": t["id"],
                "precio": precio_base[t["id"]],
                "fecha": fecha.isoformat(),
            })
            if status in (200, 201):
                ok += 1
            hecho += 1
            if hecho % 10 == 0 or hecho == total_precios:
                print(f"  ... {hecho}/{total_precios}", flush=True)
    print(f"  {ok} precios creados.\n")

    # ── 2. Compras (mezcla de efectivo, depósito y vale) ──
    print(f"Generando {N_COMPRAS} compras...")
    depositos_pendientes = []  # (detalle_id, kilos, tipo_cafe_id, bodega_id)
    ok = 0
    for i in range(N_COMPRAS):
        caficultor = random.choice(caficultores)
        fecha = hoy - timedelta(days=random.randint(0, 90))
        bodega = random.choice(bodegas)
        n_lineas = random.choice([1, 1, 1, 2])
        detalles = []
        renglones_deposito = []
        for _ in range(n_lineas):
            tipo = random.choice(tipos)
            kilos = round(random.uniform(20, 500), 1)
            roll = random.random()
            if roll < 0.15:
                detalles.append({
                    "tipo_cafe": tipo["id"], "bodega": bodega["id"],
                    "kilos": kilos, "precio_kilo": None, "es_deposito": True,
                })
                renglones_deposito.append((tipo["id"], bodega["id"], kilos))
            else:
                precio = precio_base.get(tipo["id"], 18000) + random.randint(-500, 500)
                es_vale = roll > 0.75  # ~25% de las que sí tienen precio quedan como vale
                detalles.append({
                    "tipo_cafe": tipo["id"], "bodega": bodega["id"],
                    "kilos": kilos, "precio_kilo": precio,
                    "es_deposito": False, "es_vale": es_vale,
                })
        status, data = api("POST", "/compras/compras/", token=token_jefe, data={
            "caficultor": caficultor["id"], "fecha": fecha.isoformat(),
            "nota": "Compra de prueba (script)", "detalles": detalles,
        })
        if status == 201:
            ok += 1
            for d in data["detalles"]:
                if d["es_deposito"]:
                    depositos_pendientes.append((d["id"], float(d["kilos"])))
        elif i < 5:
            # Solo muestra el detalle del error en las primeras, para no
            # inundar la consola si algo está mal desde el principio.
            print(f"  Error en compra {i}: {data}")
        if (i + 1) % 10 == 0 or (i + 1) == N_COMPRAS:
            print(f"  ... {i + 1}/{N_COMPRAS}", flush=True)
    print(f"  {ok}/{N_COMPRAS} compras creadas. {len(depositos_pendientes)} depósitos quedaron pendientes.\n")

    # ── 3. Liquidar una parte de los depósitos (mezcla efectivo / vale) ──
    print("Liquidando depósitos pendientes...")
    random.shuffle(depositos_pendientes)
    a_liquidar = depositos_pendientes[: int(len(depositos_pendientes) * 0.6)]
    ok = 0
    for idx, (detalle_id, kilos) in enumerate(a_liquidar):
        precio = random.randint(16000, 20000)
        es_vale = random.random() < 0.3
        status, data = api("POST", "/compras/liquidaciones/", token=token_jefe, data={
            "detalle_compra": detalle_id,
            "kilos": kilos,
            "precio_kilo": precio,
            "fecha": hoy.isoformat(),
            "es_vale": es_vale,
        })
        if status == 201:
            ok += 1
        if (idx + 1) % 10 == 0 or (idx + 1) == len(a_liquidar):
            print(f"  ... {idx + 1}/{len(a_liquidar)}", flush=True)
    print(f"  {ok}/{len(a_liquidar)} depósitos liquidados "
          f"({len(depositos_pendientes) - len(a_liquidar)} quedan pendientes a propósito, "
          "para probar esa vista también).\n")

    # ── 4. Abonar algunas de las cuentas por pagar (vales) que se crearon solas ──
    print("Abonando algunas cuentas por pagar...")
    cuentas = get_all("/cuentas-pagar/", token_jefe)
    pendientes = [c for c in cuentas if float(c.get("saldo", 0)) > 0]
    random.shuffle(pendientes)
    a_abonar = pendientes[: int(len(pendientes) * 0.5)]
    ok = 0
    for c in a_abonar:
        saldo = float(c["saldo"])
        # A veces abono parcial, a veces se paga completo
        valor = round(saldo, 2) if random.random() < 0.4 else round(saldo * random.uniform(0.2, 0.8), 2)
        status, data = api("POST", f"/cuentas-pagar/{c['id']}/abonos/", token=token_jefe, data={
            "valor": valor,
            "medio_pago": random.choice(["efectivo", "transferencia"]),
            "nota": "Abono de prueba (script)",
            "fecha": (hoy - timedelta(days=random.randint(0, 15))).isoformat(),
        })
        if status in (200, 201):
            ok += 1
        elif ok == 0 and a_abonar.index(c) < 3:
            print(f"  Error abonando cuenta #{c['id']}: {data}")
    print(f"  {ok}/{len(a_abonar)} abonos a cuentas por pagar creados "
          f"({len(cuentas) - len(a_abonar)} cuentas quedan sin tocar, algunas pendientes a propósito).\n")

    # ── 5. Letras de cambio (préstamos) + abonos ──
    print(f"Generando {N_LETRAS} letras de cambio...")
    ok = 0
    letras_creadas = []
    for i in range(N_LETRAS):
        caficultor = random.choice(caficultores)
        bodega = random.choice(bodegas)
        valor = round(random.uniform(200_000, 3_000_000), -3)
        status, data = api("POST", "/letras/", token=token_jefe, data={
            "caficultor": caficultor["id"], "bodega": bodega["id"],
            "valor_total": valor, "notas": "Letra de prueba (script)",
        })
        if status == 201:
            ok += 1
            letras_creadas.append(data)
    print(f"  {ok}/{N_LETRAS} letras creadas.")

    ok_abonos = 0
    for letra in letras_creadas:
        # ~60% de las letras reciben al menos un abono parcial
        if random.random() > 0.6:
            continue
        saldo = float(letra["valor_total"])
        valor = round(saldo * random.uniform(0.2, 0.7), 2)
        status, data = api("POST", f"/letras/{letra['id']}/abonos/", token=token_jefe, data={
            "valor": valor, "notas": "Abono de prueba (script)",
        })
        if status == 201:
            ok_abonos += 1
    print(f"  {ok_abonos} abonos a letras creados.\n")

    # ── 6. Gastos ──
    print(f"Generando {N_GASTOS} gastos...")
    ok = 0
    for i in range(N_GASTOS):
        bodega = random.choice(bodegas)
        fecha = hoy - timedelta(days=random.randint(0, 90))
        status, data = api("POST", "/gastos/", token=token_jefe, data={
            "bodega": bodega["id"],
            "categoria": random.choice(CATEGORIAS_GASTO),
            "descripcion": "Gasto de prueba (script)",
            "valor": round(random.uniform(15_000, 400_000), -2),
            "medio_pago": random.choice(["efectivo", "transferencia"]),
            "fecha": fecha.isoformat(),
        })
        if status == 201:
            ok += 1
    print(f"  {ok}/{N_GASTOS} gastos creados.\n")

    # ── 7. Ventas (requieren stock -- algunas pueden fallar si no alcanza, es normal) ──
    if not empresas:
        print("No hay Terceros tipo 'empresa' -- se omiten las ventas.\n")
    else:
        print(f"Generando hasta {N_VENTAS} ventas (algunas pueden fallar por falta de stock, es normal)...")
        ok = 0
        for i in range(N_VENTAS):
            empresa = random.choice(empresas)
            bodega = random.choice(bodegas)
            tipo = random.choice(tipos)
            fecha = hoy - timedelta(days=random.randint(0, 60))
            kilos = round(random.uniform(50, 300), 1)
            bultos = max(int(kilos / 70), 1)
            status, data = api("POST", "/ventas/ventas/", token=token_jefe, data={
                "fecha": fecha.isoformat(),
                "empresa": empresa["id"],
                "conductor_nombre": "Conductor de prueba",
                "conductor_cedula": cedula_aleatoria(),
                "vehiculo_placas": placa_aleatoria(),
                "flete_valor": round(random.uniform(50_000, 300_000), -3),
                "detalles": [{
                    "tipo_cafe": tipo["id"], "bodega": bodega["id"],
                    "bultos": bultos, "kilos": kilos,
                }],
            })
            if status == 201:
                ok += 1
            if (i + 1) % 10 == 0 or (i + 1) == N_VENTAS:
                print(f"  ... {i + 1}/{N_VENTAS}", flush=True)
        print(f"  {ok}/{N_VENTAS} ventas creadas (las que fallaron fue por falta de stock disponible).\n")

        # El jefe le pone precio a algunas ventas ya creadas
        ventas = get_all("/ventas/ventas/", token_jefe)
        sin_precio = [v for v in ventas if v.get("precio_kilo_jefe") is None]
        random.shuffle(sin_precio)
        a_asignar = sin_precio[: int(len(sin_precio) * 0.7)]
        ok_precio = 0
        for v in a_asignar:
            status, data = api("PATCH", f"/ventas/ventas/{v['id']}/", token=token_jefe, data={
                "precio_kilo_jefe": random.randint(19000, 23000),
            })
            if status in (200, 201):
                ok_precio += 1
        print(f"  Precio de venta asignado por el jefe en {ok_precio} remisiones.\n")

    print("=== Listo. Datos de prueba generados. ===")
    print("Revisa el Dashboard, Compras, Ventas, Caja, Inventario, Cuentas por")
    print("pagar y Letras -- ya deberían tener volumen real para navegar y probar.")


if __name__ == "__main__":
    main()