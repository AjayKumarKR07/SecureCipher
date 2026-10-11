from fastapi import APIRouter, HTTPException, status
from app.schemas.algorithm import AlgorithmInfo, AlgorithmListResponse
from app.services.algorithm_service import get_all_algorithms, get_algorithm_by_id

router = APIRouter(tags=["Cryptographic Algorithms"])


@router.get("/algorithms", response_model=AlgorithmListResponse, summary="List Supported Cryptographic Algorithms")
def list_algorithms() -> AlgorithmListResponse:
    """
    Returns the six cryptographic algorithms supported by SecureCipher along with
    their architectural purpose, category, key lengths, and status.
    """
    algos = get_all_algorithms()
    return AlgorithmListResponse(algorithms=algos, total=len(algos))


@router.get("/algorithms/{algo_id}", response_model=AlgorithmInfo, summary="Get Algorithm Details")
def get_algorithm_details(algo_id: str) -> AlgorithmInfo:
    """Returns detailed specification and capabilities for a specific cryptographic algorithm."""
    algo = get_algorithm_by_id(algo_id.lower())
    if not algo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cryptographic algorithm '{algo_id}' is not registered in SecureCipher.",
        )
    return algo
