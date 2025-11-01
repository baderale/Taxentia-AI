"""
Text chunking module for breaking documents into manageable chunks.

Implements sentence-aware chunking with overlap for context continuity.
Uses NLTK for proper sentence boundary detection (handles abbreviations).
"""

import re
from typing import List, Dict, Any, Optional
from ingestion.models.chunks import Chunk, ChunkMetadata
from ingestion.utils.hashing import generate_chunk_id
import logging

try:
    import nltk
    from nltk.tokenize import sent_tokenize
    # Ensure punkt tokenizer is available
    try:
        sent_tokenize("test")
    except LookupError:
        nltk.download("punkt", quiet=True)
except ImportError:
    # Fallback if nltk not available
    sent_tokenize = None

logger = logging.getLogger(__name__)


class TextChunker:
    """
    Chunk text into overlapping segments for embedding.

    Strategy:
    1. Short documents (≤ max_chunk_size): Return as single chunk
    2. Paragraph-based: Split on double newlines, accumulate until max size
    3. Sentence-based fallback: For paragraphs > max size, split on sentences
    4. Overlap: Prepend last 200 chars of previous chunk to next chunk
    """

    def __init__(
        self,
        max_chunk_size: int = 2000,
        overlap_size: int = 200,
    ):
        """
        Initialize chunker.

        Args:
            max_chunk_size: Maximum characters per chunk (default: 2000)
            overlap_size: Character overlap between chunks (default: 200)
        """
        self.max_chunk_size = max_chunk_size
        self.overlap_size = overlap_size

    def chunk_document(
        self,
        text: str,
        metadata: Dict[str, Any],
    ) -> List[Chunk]:
        """
        Chunk a document into overlapping segments.

        Args:
            text: Document text to chunk
            metadata: Metadata for chunk (source_type, citation, etc.)

        Returns:
            List of Chunk objects with metadata

        Example:
            >>> chunker = TextChunker()
            >>> chunks = chunker.chunk_document(
            ...     "Section 195...",
            ...     {"source_type": "usc", "citation": "26 U.S.C. § 195"}
            ... )
            >>> len(chunks)
            3
        """
        # Clean whitespace
        text = self._clean_text(text)

        if not text:
            logger.warning("Empty text provided to chunker")
            return []

        # Short documents: return as single chunk
        if len(text) <= self.max_chunk_size:
            chunk_metadata = ChunkMetadata(
                **metadata,
                chunk_index=0,
                total_chunks=1,
            )
            string_id = generate_chunk_id(
                metadata.get("source_type", "unknown"),
                metadata.get("citation", "unknown"),
                0,
            )
            return [
                Chunk(
                    text=text,
                    metadata=chunk_metadata,
                    string_id=string_id,
                )
            ]

        # Long documents: split into chunks
        chunks = self._split_into_chunks(text, metadata)
        return chunks

    def _clean_text(self, text: str) -> str:
        """
        Clean and normalize text.

        - Remove extra whitespace
        - Collapse multiple newlines
        - Strip leading/trailing whitespace
        """
        # Replace multiple newlines with double newline
        text = re.sub(r"\n\n+", "\n\n", text)
        # Replace multiple spaces with single space
        text = re.sub(r" +", " ", text)
        # Strip
        return text.strip()

    def _split_into_chunks(
        self,
        text: str,
        metadata: Dict[str, Any],
    ) -> List[Chunk]:
        """
        Split long text into overlapping chunks.

        Strategy:
        1. Try paragraph-based splitting (on double newlines)
        2. For large paragraphs, use sentence-based splitting
        3. Add overlap between chunks
        """
        chunks: List[str] = []
        current_chunk = ""

        # Split by paragraphs first
        paragraphs = text.split("\n\n")

        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue

            # If paragraph is small enough, add to current chunk
            if len(current_chunk) + len(paragraph) + 2 <= self.max_chunk_size:
                if current_chunk:
                    current_chunk += "\n\n"
                current_chunk += paragraph
            else:
                # Current chunk would exceed max size
                if current_chunk:
                    # Save current chunk
                    chunks.append(current_chunk)
                    # Start new chunk with overlap from previous
                    overlap_text = current_chunk[-self.overlap_size :]
                    overlap_text = self._get_overlap_at_word_boundary(overlap_text)

                    # Add paragraph, splitting if needed
                    if len(paragraph) > self.max_chunk_size:
                        # Paragraph itself is too large, split by sentences
                        para_chunks = self._split_by_sentences(paragraph)
                        # Add first chunk with overlap
                        current_chunk = overlap_text + para_chunks[0]
                        chunks.append(current_chunk)

                        # Add middle chunks
                        for para_chunk in para_chunks[1:-1]:
                            overlap = overlap_text + para_chunk
                            if len(overlap) > self.max_chunk_size:
                                chunks.append(overlap)
                                overlap_text = para_chunk[-self.overlap_size :]
                                overlap_text = self._get_overlap_at_word_boundary(overlap_text)
                            else:
                                current_chunk = overlap

                        # Set up for last chunk
                        current_chunk = (
                            overlap_text + para_chunks[-1]
                            if len(para_chunks) > 1
                            else para_chunks[-1]
                        )
                    else:
                        # Regular paragraph, just add with overlap
                        current_chunk = overlap_text + paragraph

        # Add final chunk
        if current_chunk:
            chunks.append(current_chunk)

        # Convert chunks to Chunk objects with metadata
        chunk_objects: List[Chunk] = []
        total_chunks = len(chunks)

        for idx, chunk_text in enumerate(chunks):
            chunk_text = chunk_text.strip()
            if not chunk_text:
                continue

            chunk_metadata = ChunkMetadata(
                **metadata,
                chunk_index=idx,
                total_chunks=total_chunks,
            )
            string_id = generate_chunk_id(
                metadata.get("source_type", "unknown"),
                metadata.get("citation", "unknown"),
                idx,
            )
            chunk_objects.append(
                Chunk(
                    text=chunk_text,
                    metadata=chunk_metadata,
                    string_id=string_id,
                )
            )

        return chunk_objects

    def _split_by_sentences(self, text: str) -> List[str]:
        """
        Split text by sentences using NLTK.

        Falls back to regex if NLTK not available.
        """
        if sent_tokenize is not None:
            try:
                sentences = sent_tokenize(text)
                # Group sentences to avoid too many small chunks
                chunks = []
                current = ""
                for sent in sentences:
                    if len(current) + len(sent) <= self.max_chunk_size:
                        current += " " + sent if current else sent
                    else:
                        if current:
                            chunks.append(current)
                        current = sent
                if current:
                    chunks.append(current)
                return chunks
            except Exception as e:
                logger.warning(f"NLTK sentence tokenization failed: {e}, using regex")

        # Fallback to regex (simple but may not handle abbreviations well)
        # Matches sentence boundaries (period, exclamation, question mark)
        pattern = r"[^.!?]*[.!?]+"
        matches = re.findall(pattern, text)
        if not matches:
            return [text]

        # Group matches to avoid too many small chunks
        chunks = []
        current = ""
        for match in matches:
            if len(current) + len(match) <= self.max_chunk_size:
                current += match
            else:
                if current:
                    chunks.append(current.strip())
                current = match
        if current:
            chunks.append(current.strip())

        return chunks or [text]

    def _get_overlap_at_word_boundary(self, text: str) -> str:
        """
        Get overlap text, breaking at word boundary if needed.

        Ensures overlap doesn't cut words in half.
        """
        if len(text) <= self.overlap_size:
            return text

        # Get overlap size characters
        overlap = text[-self.overlap_size :]

        # Find last space to break at word boundary
        last_space = overlap.rfind(" ")
        if last_space > 0:
            overlap = overlap[:last_space]

        return overlap

    def chunk_documents_batch(
        self,
        documents: List[Dict[str, Any]],
    ) -> List[Chunk]:
        """
        Chunk multiple documents in batch.

        Args:
            documents: List of dicts with 'text' and 'metadata' keys

        Returns:
            List of all chunks from all documents

        Example:
            >>> chunker = TextChunker()
            >>> docs = [
            ...     {"text": "...", "metadata": {...}},
            ...     {"text": "...", "metadata": {...}},
            ... ]
            >>> chunks = chunker.chunk_documents_batch(docs)
        """
        all_chunks: List[Chunk] = []
        for doc in documents:
            chunks = self.chunk_document(doc["text"], doc["metadata"])
            all_chunks.extend(chunks)
        return all_chunks
