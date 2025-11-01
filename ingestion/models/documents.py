"""
Pydantic data models for different document types.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class USCSection(BaseModel):
    """US Code Title 26 (IRC) section."""

    citation: str = Field(..., description="Authority citation (e.g., '26 U.S.C. § 195')")
    section: str = Field(..., description="Section number (e.g., '195')")
    title: str = Field(..., description="Section title")
    text: str = Field(..., description="Full section text")
    url: str = Field(..., description="URL to the section")
    version_date: Optional[str] = Field(None, description="Last modified date")

    class Config:
        json_schema_extra = {
            "example": {
                "citation": "26 U.S.C. § 195",
                "section": "195",
                "title": "Start-up expenditures",
                "text": "A taxpayer may elect...",
                "url": "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section195",
                "version_date": "2025-09-05",
            }
        }


class CFRRegulation(BaseModel):
    """CFR Title 26 (Treasury Regulations) regulation."""

    citation: str = Field(..., description="Authority citation (e.g., '26 CFR § 1.195-1')")
    part: str = Field(..., description="Part number (e.g., '1')")
    section: str = Field(..., description="Section number (e.g., '1.195-1')")
    title: str = Field(..., description="Regulation title")
    text: str = Field(..., description="Full regulation text")
    url: str = Field(..., description="URL to the regulation")
    version_date: Optional[str] = Field(None, description="Last modified date")

    class Config:
        json_schema_extra = {
            "example": {
                "citation": "26 CFR § 1.195-1",
                "part": "1",
                "section": "1.195-1",
                "title": "Election to amortize start-up expenditures",
                "text": "An election to amortize startup expenditures...",
                "url": "https://www.ecfr.gov/current/title-26/section-1.195-1",
                "version_date": "2025-01-15",
            }
        }


class IRBDocument(BaseModel):
    """IRS Internal Revenue Bulletin document."""

    citation: str = Field(..., description="Document citation (e.g., 'Rev. Rul. 2025-01')")
    doc_type: str = Field(
        ...,
        description="Document type",
        regex="^(revenue_ruling|revenue_procedure|notice|treasury_decision|announcement)$",
    )
    number: str = Field(..., description="Document number (e.g., '2025-01')")
    title: str = Field(..., description="Document title")
    text: str = Field(..., description="Full document text")
    bulletin_number: str = Field(..., description="IRB number (e.g., '2025-44')")
    bulletin_date: str = Field(..., description="Bulletin date/year")
    url: str = Field(..., description="Direct URL with anchor")

    class Config:
        json_schema_extra = {
            "example": {
                "citation": "Rev. Rul. 2025-01",
                "doc_type": "revenue_ruling",
                "number": "2025-01",
                "title": "Section 179 Deduction Limitations",
                "text": "This ruling addresses the application of...",
                "bulletin_number": "2025-44",
                "bulletin_date": "2025",
                "url": "https://www.irs.gov/irb/2025-44#REV-RUL-2025-01",
            }
        }
