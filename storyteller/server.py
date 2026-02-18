import json
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from anthropic import AsyncAnthropic

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

http_client = httpx.AsyncClient()
claude = AsyncAnthropic()


def load_template(filepath: str) -> str:
    with open(filepath, "r") as file:
        return file.read().strip()


def user_prompt(galaxy_json: str) -> str:
    template_json = load_template("storyteller/response_json_template.json")
    return f"""Here is the galaxy map:
        {galaxy_json}
        
        Create a simple adventure scenario. Place items and orbital objects on stars,
        then write steps for the player to follow.
        Respond with this exact JSON structure:
        {template_json}
        Only use stars that exist in the galaxy map."""


async def generate_scenario(galaxy: dict) -> dict:
    galaxy_json = json.dumps(galaxy)

    response = await claude.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system="""You are a game scenario designer...
        Respond with valid JSON only. You must respond with raw JSON only. No markdown, no backticks, no explanation. Just the JSON object.
        This JSON must be fully parseable. Generate no more than 3 items and no more per 3 places on which the items may be used. It is ok
        if one item is used multiple times on multiple places.

        """,
        messages=[
            {
                "role": "user",
                "content": user_prompt(galaxy_json),
            },
            {"role": "assistant", "content": "{"},
        ],
    )

    text = "{" + response.content[0].text
    print(text)

    return json.loads(text)


async def fetch_json(url: str):
    try:
        r = await http_client.get(url)
        r.raise_for_status()
        return r.json()
    except (httpx.RequestError, httpx.HTTPStatusError) as e:
        raise HTTPException(502, f"Service unavailable: {url} - {str(e)}")


@app.get("/api/v1/prompt")
async def get_prompt():
    galaxy = await fetch_json("http://localhost:8081/api/v1/galaxy")

    return {
        "prompt": user_prompt(json.dumps(galaxy)),
    }


@app.get("/api/v1/story/new")
async def new_story():
    # Gather, because we'll be getting more stuff here.
    (galaxy,) = await asyncio.gather(
        fetch_json("http://localhost:8081/api/v1/galaxy"),
    )

    scenario = await generate_scenario(galaxy)

    return {
        "scenario": scenario,
    }


@app.on_event("shutdown")
async def shutdown_event():
    await http_client.aclose()
    await claude.close()
