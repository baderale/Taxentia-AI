"""
Pydantic data models for text chunks and embeddings.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime


class ChunkMetadata(BaseModel):
    """Metadata associated with a text chunk."""

    source_type: str = Field(..., description="Type of source ('usc', 'cfr', 'irb')")
    citation: str = Field(..., description="Authority citation")
    chunk_index: int = Field(..., description="Index of chunk within document")
    total_chunks: int = Field(..., description="Total chunks for this document")
    title: Optional[str] = Field(None, description="Document title")
    section: Optional[str] = Field(None, description="Section/regulation number")
    url: Optional[str] = Field(None, description="URL to original source")
    version_date: Optional[str] = Field(None, description="Last modified date")
    extra_fields: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "source_type": "usc",
                "citation": "26 U.S.C. § 195",
                "chunk_index": 0,
                "total_chunks": 3,
                "title": "Start-up expenditures",
                "section": "195",
                "url": "https://uscode.house.gov/view.xhtml?...",
                "version_date": "2025-09-05",
            }
        }


class Chunk(BaseModel):
    """A text chunk ready for embedding."""

    text: str = Field(..., description="Chunk text (≤2000 characters)")
    metadata: ChunkMetadata = Field(..., description="Chunk metadata")
    string_id: str = Field(..., description="String ID (e.g., 'usc-195-chunk-0')")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "A taxpayer may elect to amortize certain start-up expenditures...",
                "metadata": {
                    "source_type": "usc",
                    "citation": "26 U.S.C. § 195",
                    "chunk_index": 0,
                    "total_chunks": 3,
                },
                "string_id": "usc-26-U-S-C-----195-chunk-0",
            }
        }


class EmbeddedChunk(BaseModel):
    """A chunk with its vector embedding."""

    chunk: Chunk = Field(..., description="The original chunk")
    embedding: List[float] = Field(..., description="Vector embedding (1536 dimensions)")
    numeric_id: int = Field(..., description="Numeric ID for Qdrant")
    tokens: int = Field(..., description="Number of tokens in chunk text")

    class Config:
        json_schema_extra = {
            "example": {
                "chunk": {
                    "text": "A taxpayer may elect...",
                    "metadata": {...},
                    "string_id": "usc-195-chunk-0",
                },
                "embedding": [0.123, -0.456, ...],  # 1536 dimensions
                "numeric_id": 1234567890,
                "tokens": 42,
            }
        }


class IngestionBatch(BaseModel):
    """A batch of embedded chunks ready for upload to Qdrant."""

    embedded_chunks: List[EmbeddedChunk] = Field(..., description="Chunks in this batch")
    total_tokens: int = Field(..., description="Total tokens in batch")
    batch_size: int = Field(..., description="Number of chunks in batch")

    @property
    def cost_estimate(self) -> float:
        """Estimate cost for this batch at $0.02 per 1M tokens."""
        return (self.total_tokens / 1_000_000) * 0.02
