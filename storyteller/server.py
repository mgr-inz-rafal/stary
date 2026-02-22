import json
import asyncio
import httpx
import random

from story_model import Story

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

random.seed()

prefill_prefix = "{"


def load_template(filepath: str) -> str:
    with open(filepath, "r") as file:
        return file.read().strip()


def user_prompt(galaxy_json: str) -> str:
    template_json = load_template("response_json_template.json")
    return f"""Here is the galaxy map:
        {galaxy_json}
        
        Create a simple adventure scenario. Place items and orbital objects on stars,
        then write steps for the player to follow.
        Respond with this exact JSON structure:
        {template_json}
        Only use stars that exist in the galaxy map."""


async def execute_tools(response, tool_handlers):
    tool_results = []
    for block in response.content:
        if block.type == "tool_use":
            handler = tool_handlers.get(block.name)
            if not handler:
                raise ValueError(f"We don't have this tool: {block.name}")
            result = await handler(block.input)
            print(f"Tool '{block.name}' returned: {result}")
            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result),
                }
            )
    
    return tool_results


async def generate_story(galaxy: dict) -> dict:
    galaxy_json = json.dumps(galaxy)

    tools = [
        {
            "name": "get_adventure_theme",
            "description": "Retrieves the current adventure theme that should be incorporated into the story generation. Always call this tool before generating the story.",
            "input_schema": {"type": "object", "properties": {}, "required": []},
        }
    ]

    tool_handlers = {
        "get_adventure_theme": lambda _: fetch_json(
            "http://localhost:8083/api/v1/theme"
        ),
    }

    messages = [
        {
            "role": "user",
            "content": user_prompt(galaxy_json),
        }
    ]

    while True:
        # Send the initial message
        response = await claude.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system="""You are a game scenario designer.
            You MUST call the get_adventure_theme tool first to retrieve the current theme.
            """,
            tools=tools,
            messages=messages,
        )

        # Check how LLM wants to proceed
        match response.stop_reason:
            case "tool_use":
                print("LLM wants to use tools")

                # Append his response to the convo
                messages.append({"role": "assistant", "content": response.content})

                # Execute tools
                tool_results = await execute_tools(response, tool_handlers)

                # Add our tool results to the conversation
                messages.append({"role": "user", "content": tool_results})

            case "end_turn":
                print("LLM done with the answer")

                # Put '{' into LLMs mouth, so that it continues with pure JSON
                messages.append({"role": "assistant", "content": prefill_prefix})

                final_response = await claude.messages.create(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=1024,
                    system="""You are a game scenario designer.
                    You have already retrieved the adventure theme. Now generate the story.
                    The theme MUST be deeply reflected in all names, places, and descriptions.
                    Respond with valid JSON only. No markdown, no backticks, no explanation. Just the JSON object.
                    Generate no more than 3 items and no more than 3 places. All must be in distinct stars.
                    """,
                    messages=messages,
                )

                # Attach the actual response to our prefilled '{'
                text = prefill_prefix + final_response.content[0].text
                print(text)
                return json.loads(text)

            case "max_tokens":
                # TODO: Propagate this error to the user
                print(
                    "LLM hit max tokens - the resulting JSON will most likely be truncated"
                )

            case "stop_sequence":
                print("On demand stop sequence")


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


@app.get("/api/v1/theme")
async def get_theme():
    themes = ["Star Wars", "Alien", "Star Trek", "Dune"]
    theme_index = random.randint(0, len(themes) - 1)
    return {
        "theme": themes[theme_index],
    }


@app.get("/api/v1/story/new", response_model=Story)
async def new_story():
    # Gather, because we'll be getting more stuff here.
    (galaxy,) = await asyncio.gather(
        fetch_json("http://localhost:8081/api/v1/galaxy"),
    )

    story = await generate_story(galaxy)
    validated_story = Story.model_validate(story)

    return validated_story


@app.on_event("shutdown")
async def shutdown_event():
    await http_client.aclose()
    await claude.close()
