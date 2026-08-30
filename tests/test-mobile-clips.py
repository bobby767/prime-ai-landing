#!/usr/bin/env python3
"""Un movil debe bajarse los .m.mp4 y un escritorio los .mp4.

Por que existe esta prueba: clipMobile/connectorsMobile son OPCIONALES en el motor.
Si una ruta esta mal escrita, si world.config.js pierde la clave o si isMobile()
cambia de criterio, no hay error en ninguna parte — el motor cae al clip de
escritorio y la pagina sigue funcionando, solo que el telefono se baja el doble de
bytes. Es un fallo silencioso y solo se ve en la red, asi que se mira la red.

    python3 tests/test-mobile-clips.py            # sirve el directorio y comprueba

El movil se emula con viewport de 390px Y has_touch/is_mobile, porque isMobile()
del motor es «coarse pointer O <=860px»: hay que dar los dos para probar la rama
que de verdad ve un telefono.
"""
import http.server, socketserver, threading, functools, sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PORT = 8913

def serve():
    class Mudo(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass   # el log del servidor tapa el resultado
    h = functools.partial(Mudo, directory=str(ROOT))
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

def clips_pedidos(pw, movil):
    kw = dict(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True) if movil \
         else dict(viewport={"width": 1440, "height": 900})
    b = pw.chromium.launch()
    ctx = b.new_context(**kw)
    vistos = []
    ctx.on("request", lambda r: vistos.append(r.url) if ".mp4" in r.url else None)
    p = ctx.new_page()
    p.goto(f"http://127.0.0.1:{PORT}/scroll.html", wait_until="load")
    # Bajar del todo: el motor carga los clips por escena, no de golpe.
    for _ in range(60):
        p.mouse.wheel(0, 2000)
        p.wait_for_timeout(120)
    p.wait_for_timeout(1500)
    escenas = p.eval_on_selector_all(".sw-scene.has-clip", "e => e.length")
    b.close()
    return vistos, escenas

fallos = []
srv = serve()
try:
    with sync_playwright() as pw:
        for movil in (True, False):
            quien = "movil" if movil else "escritorio"
            urls, escenas = clips_pedidos(pw, movil)
            scroll = [u for u in urls if "assets/scroll/vid/" in u]
            m  = [u for u in scroll if ".m.mp4" in u]
            d  = [u for u in scroll if ".m.mp4" not in u]
            print(f"{quien:11} escenas con clip: {escenas}  |  .m.mp4: {len(set(m))}  .mp4: {len(set(d))}")
            if escenas != 11:
                fallos.append(f"{quien}: {escenas} escenas con clip, se esperaban 11")
            if movil and d:
                fallos.append(f"movil pidio clips de ESCRITORIO (cae al fallback): {sorted(set(d))[:3]}")
            if movil and not m:
                fallos.append("movil no pidio ni un .m.mp4 — clipMobile no llega al motor")
            if not movil and m:
                fallos.append(f"escritorio pidio clips de MOVIL: {sorted(set(m))[:3]}")
finally:
    srv.shutdown()

if fallos:
    print("FALLO\n  " + "\n  ".join(fallos)); sys.exit(1)
print("OK — el movil se lleva los .m.mp4 y el escritorio los .mp4")
