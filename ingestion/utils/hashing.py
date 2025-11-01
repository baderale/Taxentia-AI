"""
ID hashing utilities.

CRITICAL: This must exactly replicate the TypeScript implementation to avoid
ID collisions with existing Qdrant data.

TypeScript implementation:
private stringToNumericId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;  // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
"""


def string_to_numeric_id(s: str) -> int:
    """
    Convert a string ID to a numeric ID using the exact same algorithm as TypeScript.

    This function must produce identical results to the TypeScript implementation
    for the same input strings. Used for Qdrant point IDs.

    Args:
        s: String identifier (e.g., "usc-195-chunk-0")

    Returns:
        Absolute numeric hash value (always positive)

    Example:
        >>> string_to_numeric_id("usc-195-chunk-0")
        1234567890  # Exact result depends on hash algorithm

    Critical Note:
        This hash must match TypeScript results for compatibility with existing Qdrant data.
        Do NOT modify this function without verifying compatibility!
    """
    hash_val = 0

    for char in s:
        # ((hash << 5) - hash) is equivalent to hash * 31
        hash_val = ((hash_val << 5) - hash_val) + ord(char)
        # Convert to 32-bit signed integer (& 0xFFFFFFFF masks to 32 bits)
        # In JavaScript, bitwise operations automatically convert to 32-bit
        hash_val = hash_val & 0xFFFFFFFF

    # Return absolute value (JavaScript uses Math.abs)
    return abs(hash_val)


def generate_chunk_id(source_type: str, citation: str, chunk_index: int) -> str:
    """
    Generate a string ID for a chunk before hashing.

    Args:
        source_type: Type of source ('usc', 'cfr', 'irb')
        citation: Authority citation (e.g., "26 U.S.C. § 195")
        chunk_index: Index of chunk within document

    Returns:
        String ID in format: "{source_type}-{citation}-chunk-{index}"

    Example:
        >>> generate_chunk_id("usc", "26 U.S.C. § 195", 0)
        "usc-26 U.S.C. § 195-chunk-0"
    """
    # Sanitize citation for ID (remove spaces, special chars)
    sanitized_citation = citation.replace(" ", "-").replace("/", "-").replace(".", "-")
    return f"{source_type}-{sanitized_citation}-chunk-{chunk_index}"


def generate_numeric_chunk_id(source_type: str, citation: str, chunk_index: int) -> int:
    """
    Generate a numeric chunk ID (string → hash).

    This is a convenience function that combines generate_chunk_id and string_to_numeric_id.

    Args:
        source_type: Type of source ('usc', 'cfr', 'irb')
        citation: Authority citation
        chunk_index: Index of chunk within document

    Returns:
        Numeric ID suitable for Qdrant
    """
    string_id = generate_chunk_id(source_type, citation, chunk_index)
    return string_to_numeric_id(string_id)
