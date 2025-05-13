import openai
import json
from pydantic import BaseModel, Field
from typing import Union
import os

# Get API key from environment variables
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# Define the simplified analysis response
class SensitivityAnalysis(BaseModel):
    sensitivity_score: int = Field(..., ge=0, le=100, description="Overall sensitivity score (0-100)")
    explanation: str = Field(..., description="Brief explanation of the overall score")

# Error response model
class AnalysisError(BaseModel):
    error: str = Field(..., description="Error message")
    sensitivity_score: int = Field(default=0, ge=0, le=100)
    explanation: str = Field(default="Error occurred during analysis")

class SensitiveContentAnalyzer:
    def __init__(self, api_key: str = OPENAI_API_KEY):
        """Initialize the analyzer with OpenAI API key."""
        self.client = openai.OpenAI(api_key=api_key)
        
    def get_system_prompt(self) -> str:
        """Generate the system prompt with Pydantic schema."""
        schema = SensitivityAnalysis.model_json_schema()
        
        return f"""You are an AI assistant that analyzes text for sensitive information. 
        You must respond only with valid JSON that matches the following schema:
        
        {json.dumps(schema, indent=2)}
        
        Analyze the content for all types of sensitive information including:
        - Personal identifiers (SSN, addresses, phone numbers, email addresses)
        - Financial information (credit cards, bank accounts, financial records)
        - Medical/health data (medical records, health conditions, prescriptions)
        - Government/legal info (legal documents, case numbers, court records)
        - Business confidential (proprietary data, trade secrets, internal communications)
        - Authentication credentials (passwords, API keys, tokens)
        
        
        Provide a single overall sensitivity score from 0-100 where:
        - 0 means no sensitive information
        - 100 means extremely sensitive information
        
        Include a brief explanation that summarizes why the content received that score."""
        
    def analyze_content(self, content: str) -> Union[SensitivityAnalysis, AnalysisError]:
        """
        Analyze content for sensitive information and return simplified results.
        
        Args:
            content (str): The content to analyze
            
        Returns:
            Union[SensitivityAnalysis, AnalysisError]: Structured analysis or error response
        """
        
        user_prompt = f"""Analyze the following content for sensitive information:

{content}

Provide the analysis with a single sensitivity score and explanation that not contains any user input in the required JSON format."""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Using a more efficient model
                messages=[
                    {"role": "system", "content": self.get_system_prompt()},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0,
                response_format={"type": "json_object"}
            )
            
            # Parse the response using JSON
            result_dict = json.loads(response.choices[0].message.content)
            result = SensitivityAnalysis(**result_dict)
            return result
            
        except Exception as e:
            return AnalysisError(
                error=f"Failed to analyze content: {str(e)}"
            )

# Instantiate a global analyzer that can be reused
analyzer = SensitiveContentAnalyzer()

async def analyze_note_sensitivity(content: str) -> dict:
    """
    Analyze note content and return sensitivity data.
    Returns a dict with sensitivity_score and explanation.
    """
    try:
        # Analyze the content
        result = analyzer.analyze_content(content)
        
        # Return the analysis result as a dict
        if isinstance(result, AnalysisError):
            return {
                "sensitivity_score": 0,
                "explanation": f"Error during analysis: {result.error}"
            }
        else:
            return {
                "sensitivity_score": result.sensitivity_score,
                "explanation": result.explanation
            }
    except Exception as e:
        return {
            "sensitivity_score": 0,
            "explanation": f"Failed to analyze sensitivity: {str(e)}"
        } 