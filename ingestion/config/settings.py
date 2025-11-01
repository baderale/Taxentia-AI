"""
Application configuration using Pydantic Settings.
Loads from environment variables with sensible defaults.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # OpenAI Configuration
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    # Qdrant Configuration
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection_name: str = "taxentia-authorities"

    # PostgreSQL Configuration
    database_url: str = "postgresql+asyncpg://taxentia:password@localhost:5432/taxentia"

    # Logging Configuration
    log_level: str = "INFO"
    log_format: str = "json"  # json or text

    # Ingestion Configuration
    batch_size_embeddings: int = 40  # Chunks per embedding batch
    batch_size_qdrant: int = 100  # Points per Qdrant upsert
    max_chunk_size: int = 2000  # Characters per chunk
    chunk_overlap: int = 200  # Character overlap between chunks

    # Timeouts (seconds)
    http_timeout: int = 120
    qdrant_timeout: int = 60

    # Rate Limiting
    irb_request_delay_min: float = 1.0  # Minimum delay between IRS requests
    irb_request_delay_max: float = 2.0  # Maximum delay between IRS requests

    # Checkpointing
    checkpoint_dir: str = "data/checkpoints"
    checkpoint_interval: int = 10  # Save checkpoint every N documents

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


def get_settings() -> Settings:
    """Get singleton settings instance."""
    return Settings()
