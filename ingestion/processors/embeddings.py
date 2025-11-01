"""
OpenAI embeddings service with batching and token management.

Uses text-embedding-3-small model with accurate token counting via tiktoken.
Implements batch processing to respect API limits and optimize costs.
"""

import asyncio
from typing import List, Tuple
import logging
from datetime import datetime

from openai import AsyncOpenAI, RateLimitError, APIError
import tiktoken

from ingestion.config.settings import get_settings
from ingestion.models.chunks import Chunk, EmbeddedChunk, IngestionBatch

logger = logging.getLogger(__name__)

settings = get_settings()

# Initialize tiktoken encoding for accurate token counting
try:
    encoding = tiktoken.encoding_for_model("text-embedding-3-small")
except Exception as e:
    logger.warning(f"Failed to load tiktoken encoding: {e}, using fallback")
    encoding = None


def count_tokens(text: str) -> int:
    """
    Count tokens in text using tiktoken.

    Uses text-embedding-3-small tokenizer for accuracy.
    Falls back to character/3 heuristic if tiktoken fails.

    Args:
        text: Text to count tokens for

    Returns:
        Approximate number of tokens
    """
    if encoding is not None:
        try:
            return len(encoding.encode(text))
        except Exception as e:
            logger.warning(f"Token counting failed: {e}, using fallback")

    # Fallback heuristic: ~1 token per 3 characters (conservative)
    return max(1, len(text) // 3)


class EmbeddingsService:
    """
    Generate embeddings for text chunks using OpenAI API.

    Features:
    - Batch processing (respects API limits)
    - Token counting with tiktoken
    - Retry logic for rate limits
    - Cost estimation
    """

    def __init__(
        self,
        model: str = "text-embedding-3-small",
        batch_size: int = 40,
        max_tokens_per_batch: int = 3500,
    ):
        """
        Initialize embeddings service.

        Args:
            model: OpenAI model name (default: text-embedding-3-small)
            batch_size: Chunks per batch (default: 40)
            max_tokens_per_batch: Token limit per batch (default: 3500, conservative)
        """
        self.model = model
        self.batch_size = batch_size
        self.max_tokens_per_batch = max_tokens_per_batch
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.embedding_dimension = 1536  # text-embedding-3-small dimension
        self.price_per_1m_tokens = 0.02  # $0.02 per 1M tokens

    async def generate_embeddings(
        self,
        chunks: List[Chunk],
        batch_delay_ms: int = 100,
    ) -> List[EmbeddedChunk]:
        """
        Generate embeddings for a list of chunks.

        Batches chunks to respect token limits and rate limits.

        Args:
            chunks: List of chunks to embed
            batch_delay_ms: Delay between batches (milliseconds)

        Returns:
            List of EmbeddedChunk objects with vectors

        Raises:
            APIError: If embedding generation fails
        """
        if not chunks:
            return []

        logger.info(f"Generating embeddings for {len(chunks)} chunks")

        # Create batches
        batches = self._create_batches(chunks)
        logger.info(f"Created {len(batches)} batches")

        embedded_chunks: List[EmbeddedChunk] = []
        total_tokens = 0
        total_cost = 0.0

        for batch_idx, batch in enumerate(batches):
            logger.info(
                f"Processing batch {batch_idx + 1}/{len(batches)} "
                f"({len(batch.embedded_chunks)} chunks, {batch.total_tokens} tokens)"
            )

            # Generate embeddings for batch
            try:
                batch_embedded = await self._embed_batch(batch)
                embedded_chunks.extend(batch_embedded)
                total_tokens += batch.total_tokens
                total_cost += batch.cost_estimate

                logger.debug(
                    f"Batch {batch_idx + 1} complete. "
                    f"Running total: {total_tokens} tokens, ${total_cost:.4f}"
                )
            except RateLimitError as e:
                logger.warning(f"Rate limited on batch {batch_idx + 1}, retrying...")
                await asyncio.sleep(5)  # Wait 5 seconds
                batch_embedded = await self._embed_batch(batch)
                embedded_chunks.extend(batch_embedded)
                total_tokens += batch.total_tokens
                total_cost += batch.cost_estimate

            # Delay between batches (rate limit protection)
            if batch_idx < len(batches) - 1:
                await asyncio.sleep(batch_delay_ms / 1000.0)

        logger.info(
            f"Embeddings complete. "
            f"Total: {len(embedded_chunks)} chunks, "
            f"{total_tokens} tokens, "
            f"${total_cost:.4f}"
        )

        return embedded_chunks

    def _create_batches(self, chunks: List[Chunk]) -> List[IngestionBatch]:
        """
        Create batches respecting token and chunk limits.

        Token limit: 3500 tokens per batch (conservative, API allows 8192)
        Chunk limit: 40 chunks per batch

        Args:
            chunks: List of chunks to batch

        Returns:
            List of IngestionBatch objects
        """
        batches: List[IngestionBatch] = []
        current_batch_chunks: List[Chunk] = []
        current_tokens = 0

        for chunk in chunks:
            # Count tokens for this chunk
            chunk_tokens = count_tokens(chunk.text)

            # Enforce max tokens per chunk (truncate if needed)
            if chunk_tokens > 3000:
                logger.warning(
                    f"Chunk exceeds token limit ({chunk_tokens} > 3000), "
                    f"truncating from {len(chunk.text)} chars"
                )
                # Truncate to ~9000 characters (~3000 tokens)
                chunk.text = chunk.text[:9000]
                chunk_tokens = count_tokens(chunk.text)

            # Check if adding this chunk would exceed batch limits
            if (
                len(current_batch_chunks) >= self.batch_size
                or current_tokens + chunk_tokens > self.max_tokens_per_batch
            ) and current_batch_chunks:
                # Save current batch and start new one
                batch = self._create_embedded_chunk_batch(current_batch_chunks)
                batches.append(batch)
                current_batch_chunks = []
                current_tokens = 0

            current_batch_chunks.append(chunk)
            current_tokens += chunk_tokens

        # Add final batch
        if current_batch_chunks:
            batch = self._create_embedded_chunk_batch(current_batch_chunks)
            batches.append(batch)

        return batches

    def _create_embedded_chunk_batch(self, chunks: List[Chunk]) -> IngestionBatch:
        """
        Create an IngestionBatch from chunks (before embedding).

        This is a temporary structure used internally for batching.
        """
        total_tokens = sum(count_tokens(chunk.text) for chunk in chunks)
        # Create placeholder EmbeddedChunks (will be updated with actual embeddings)
        embedded_chunks = [
            EmbeddedChunk(
                chunk=chunk,
                embedding=[],  # Will be filled by API
                numeric_id=0,  # Will be calculated
                tokens=count_tokens(chunk.text),
            )
            for chunk in chunks
        ]
        return IngestionBatch(
            embedded_chunks=embedded_chunks,
            total_tokens=total_tokens,
            batch_size=len(chunks),
        )

    async def _embed_batch(self, batch: IngestionBatch) -> List[EmbeddedChunk]:
        """
        Generate embeddings for a batch using OpenAI API.

        Args:
            batch: IngestionBatch with chunks to embed

        Returns:
            List of EmbeddedChunk with actual embeddings
        """
        # Extract texts from chunks
        texts = [chunk.chunk.text for chunk in batch.embedded_chunks]

        try:
            # Call OpenAI API
            response = await self.client.embeddings.create(
                model=self.model,
                input=texts,
                encoding_format="float",
            )

            # Map embeddings back to chunks
            embedded_chunks: List[EmbeddedChunk] = []
            for idx, chunk_obj in enumerate(batch.embedded_chunks):
                embedding = response.data[idx].embedding

                # Verify embedding dimensions
                if len(embedding) != self.embedding_dimension:
                    raise ValueError(
                        f"Unexpected embedding dimension: {len(embedding)} "
                        f"(expected {self.embedding_dimension})"
                    )

                # Calculate numeric ID from string ID
                from ingestion.utils.hashing import string_to_numeric_id

                numeric_id = string_to_numeric_id(chunk_obj.chunk.string_id)

                embedded_chunks.append(
                    EmbeddedChunk(
                        chunk=chunk_obj.chunk,
                        embedding=embedding,
                        numeric_id=numeric_id,
                        tokens=chunk_obj.tokens,
                    )
                )

            return embedded_chunks

        except APIError as e:
            logger.error(f"API error during embedding: {e}")
            raise

    def estimate_cost(self, chunks: List[Chunk]) -> Tuple[int, float]:
        """
        Estimate cost for embedding chunks.

        Args:
            chunks: List of chunks to estimate

        Returns:
            Tuple of (estimated_tokens, estimated_cost)

        Example:
            >>> service = EmbeddingsService()
            >>> tokens, cost = service.estimate_cost(chunks)
            >>> print(f"Estimated: {tokens} tokens, ${cost:.4f}")
        """
        total_tokens = sum(count_tokens(chunk.text) for chunk in chunks)
        cost = (total_tokens / 1_000_000) * self.price_per_1m_tokens
        return total_tokens, cost
