from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    UserLoginRequest,
    UserLoginResponse,
    UserRegistrationRequest,
    UserRegistrationResponse,
)
from app.services.user_login_service import (
    UserLoginError,
    UserLoginService,
)
from app.services.user_registration_service import (
    UserRegistrationError,
    UserRegistrationService,
)
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import (
    CurrentUserResponse,
    UserLoginRequest,
    UserLoginResponse,
    UserRegistrationRequest,
    UserRegistrationResponse,
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.get(
    "/me",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_200_OK,
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        created_at=current_user.created_at,
    )


@router.post(
    "/register",
    response_model=UserRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_user(
    request: UserRegistrationRequest,
    db: AsyncSession = Depends(get_db),
) -> UserRegistrationResponse:
    user_repository = UserRepository(db)

    registration_service = UserRegistrationService(
        user_repository
    )

    try:
        user = await registration_service.register(request)
    except UserRegistrationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return user


@router.post(
    "/login",
    response_model=UserLoginResponse,
    status_code=status.HTTP_200_OK,
)
async def login_user(
    request: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> UserLoginResponse:
    user_repository = UserRepository(db)

    login_service = UserLoginService(
        user_repository
    )

    try:
        access_token = await login_service.login(request)
    except UserLoginError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    return UserLoginResponse(
        access_token=access_token,
        token_type="bearer",
    )