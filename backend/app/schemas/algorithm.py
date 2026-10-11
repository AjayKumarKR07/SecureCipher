from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class AlgorithmInfo(BaseModel):
    id: str
    name: str
    category: str
    purpose: str
    description: str
    key_size_info: str
    status: str
    features: List[str]

    model_config = ConfigDict(from_attributes=True)


class AlgorithmListResponse(BaseModel):
    algorithms: List[AlgorithmInfo]
    total: int

    model_config = ConfigDict(from_attributes=True)
