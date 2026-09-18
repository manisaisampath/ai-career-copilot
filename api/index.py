import sys
import os
from urllib.parse import parse_qs, urlencode

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.abspath(os.path.join(current_dir, "..", "backend"))

if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app
from fastapi import Request

@app.middleware("http")
async def vercel_route_dispatcher(request: Request, call_next):
    path_param = request.query_params.get("_path")
    if path_param is not None:
        clean_subpath = path_param.strip("/")
        request.scope["path"] = f"/{clean_subpath}" if clean_subpath else "/"
        
        # Remove internal _path parameter from ASGI query string
        qs = parse_qs(request.scope.get("query_string", b"").decode("utf-8", errors="ignore"))
        qs.pop("_path", None)
        flat_qs = []
        for k, vals in qs.items():
            for v in vals:
                flat_qs.append((k, v))
        request.scope["query_string"] = urlencode(flat_qs).encode("utf-8")
        
    return await call_next(request)
