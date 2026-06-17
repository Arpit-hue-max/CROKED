from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "https://croked.vercel.app,http://localhost:3000"
    rate_limit: str = "30/minute"
    alpha_vantage_api_key: str = ""
    finnhub_api_key: str = ""

    # Angel One SmartAPI settings
    angelone_api_key: str = ""
    angelone_client_code: str = ""
    angelone_password: str = ""
    angelone_totp_secret: str = ""

    # Database settings
    database_url: str = "postgresql://postgres:postgres@localhost:5432/croked"

    # JWT settings
    jwt_secret: str = "supersecretkeychangeinproduction"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days

    # Email settings (SMTP — optional, falls back to console log if not set)
    email_host: str = ""
    email_port: int = 587
    email_user: str = ""
    email_pass: str = ""
    email_from: str = ""  # e.g. 'CROKED <noreply@croked.ai>'

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
