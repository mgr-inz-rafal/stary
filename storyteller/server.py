from fastapi import FastAPI, HTTPException
import httpx
import asyncio

app = FastAPI()
client = httpx.AsyncClient()

async def fetch_json(url: str):
    try:
        r = await client.get(url)
        r.raise_for_status()
        return r.json()
    except httpx.RequestError:
        raise HTTPException(502, f"Service unavailable: {url}")


@app.get("/api/v1/story/new")
async def info():
    galaxy = await asyncio.gather(
        fetch_json("http://localhost:8081/api/v1/galaxy"),
    )

    return {
        "galaxy": galaxy,
    }
