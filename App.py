
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial
import threading
import webbrowser

HOST = "127.0.0.1"
PORT = 8000

def main():
    carpeta = Path(__file__).resolve().parent

    handler = partial(
        SimpleHTTPRequestHandler,
        directory=str(carpeta)
    )

    servidor = ThreadingHTTPServer((HOST, PORT), handler)

    direccion = f"http://{HOST}:{PORT}/index.html"

    print("SignBridge iniciado correctamente")
    print(f"Abriendo aplicación: {direccion}")
    print("Presiona Ctrl+C para detenerla.")

    threading.Timer(
        1,
        lambda: webbrowser.open(direccion)
    ).start()

    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nCerrando SignBridge...")
    finally:
        servidor.server_close()

if __name__ == "__main__":
    main()
