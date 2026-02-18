# IMPORTANT: This needs to stay in sync with the `proto/types.proto`.
# When changing data model, always modify the `proto/types.proto` first and
# only then apply the required changes here. `proto/types.proto` is the
# single source of truth.

from pydantic import BaseModel, Field

class Item(BaseModel):
    starId: str = Field(alias="star")
    name: str = Field(alias="item")


class Place(BaseModel):
    starId: str = Field(alias="star")
    name: str = Field(alias="item")


class InitialState(BaseModel):
    items: list[Item]
    places: list[Place]


class Step(BaseModel):
    action: str
    item: str = ""


class Story(BaseModel):
    title: str
    story: str
    initial_state: InitialState
    steps: list[Step]


