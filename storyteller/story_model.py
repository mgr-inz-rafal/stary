# IMPORTANT: This needs to stay in sync with the `proto/types.proto`.
# When changing data model, always modify the `proto/types.proto` first and
# only then apply the required changes here. `proto/types.proto` is the
# single source of truth.

from pydantic import BaseModel, Field, ConfigDict

class Item(BaseModel):
    starId: int
    name: str


class Place(BaseModel):
    starId: int
    name: str


class InitialState(BaseModel):
    items: list[Item]
    places: list[Place]


class Step(BaseModel):
    action: str
    item: str = ""

class Story(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str
    story: str
    initial_state: InitialState = Field(alias="initialState")
    steps: list[Step]


