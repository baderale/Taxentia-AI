# Ollama Setup Guide - Hybrid LLM Architecture

## Overview

Taxentia now uses a **hybrid approach** combining:
- **Ollama (Primary)**: Local LLM for fast, private responses (2-4 seconds)
- **GPT-4o Mini (Fallback/Validation)**: For accuracy and confidence-based validation

## Quick Start

### 1. Start Docker Services

```bash
docker-compose up -d
```

This starts:
- **Qdrant** (vector database) on port 6333
- **PostgreSQL** (application database) on port 5432
- **Ollama** (local LLM) on port 11434

### 2. Pull and Run a Model

```bash
# SSH into Ollama container
docker exec -it taxentia-ollama ollama pull llama2

# Or for faster responses (smaller model)
docker exec -it taxentia-ollama ollama pull mistral

# Or for highest quality (larger model - needs more VRAM)
docker exec -it taxentia-ollama ollama pull llama2-13b
```

Model recommendations:
- **llama2** (7B): Balanced speed/quality, ~8GB VRAM
- **mistral** (7B): Fast, ~8GB VRAM
- **llama2-13b** (13B): High quality, ~24GB VRAM
- **phi3** (3.8B): Fastest, ~4GB VRAM (lower quality)

### 3. Verify Ollama is Running

```bash
curl http://localhost:11434/api/tags
```

Should return list of available models.

### 4. Start Your App

```bash
npm run dev
```

The app will use Ollama for fast responses!

## Architecture Flow

```
User Query
    ↓
┌─────────────────────────────────────────┐
│  Hybrid LLM Service                     │
│                                          │
│  1. Try Ollama (2-4s)                   │
│     └─ If success → Return to user ✓    │
│     └─ If fail → Fall back to GPT-4o    │
│                                          │
│  2. If confidence < 70% → Async validate│
│     with GPT-4o Mini in background      │
│                                          │
│  3. Fallback: Use GPT-4o Mini directly  │
│     (if Ollama unavailable)             │
└─────────────────────────────────────────┘
    ↓
Response + Authorities (from Qdrant)
```

## Environment Variables

Set in `.env`:

```bash
# Ollama Configuration
OLLAMA_API_URL="http://localhost:11434"          # Ollama API endpoint
OLLAMA_MODEL="llama2"                            # Model name

# OpenAI Configuration (Fallback/Validation)
OPENAI_API_KEY="sk-..."                          # Your OpenAI key
OPENAI_MODEL_NAME="gpt-4o-mini"                  # Fallback model
USE_GPT4O_VALIDATION="true"                      # Enable async validation
```

## Configuration Options

### Change Ollama Model

Edit `.env`:
```bash
OLLAMA_MODEL="mistral"  # or "llama2-13b", "phi3", etc.
```

Then restart app and pull the model:
```bash
docker exec -it taxentia-ollama ollama pull mistral
```

### Disable GPT-4o Validation

Edit `.env`:
```bash
USE_GPT4O_VALIDATION="false"
```

Now only Ollama is used (completely offline after setup).

### Use Only GPT-4o Mini (No Ollama)

Edit `server/routes.ts` and change back to `openaiService` instead of `hybridLLMService`.

## Performance Expectations

### Ollama Responses
- **First query**: 2-4 seconds (model warm-up)
- **Subsequent**: 1-2 seconds

### GPT-4o Mini Responses
- ~15-20 seconds (due to API latency)

### Hybrid Mode
- Fast response from Ollama
- Optional GPT-4o validation in background
- User sees result immediately

## Troubleshooting

### Ollama Container Won't Start

```bash
# Check logs
docker logs taxentia-ollama

# Verify Docker resource limits
docker system df

# Restart container
docker restart taxentia-ollama
```

### "Connection refused" on port 11434

```bash
# Verify container is running
docker ps | grep ollama

# Check if service is ready
docker exec taxentia-ollama curl http://localhost:11434/api/tags
```

### Out of Memory (OOM) Errors

Reduce model size:
```bash
docker exec -it taxentia-ollama ollama pull phi3  # Smaller model
```

Update `.env`:
```bash
OLLAMA_MODEL="phi3"
```

### GPU Not Being Used

1. Ensure Docker has GPU access configured in `docker-compose.yml`
2. Uncomment GPU settings in ollama service
3. Install NVIDIA Container Runtime
4. Restart Docker

## Advanced: Using with GPU

### macOS (Metal GPU)

Ollama automatically uses Metal GPU - no changes needed.

### Windows/Linux (NVIDIA GPU)

1. Install NVIDIA Container Runtime
2. Edit `docker-compose.yml` and uncomment GPU section:

```yaml
ollama:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

3. Restart: `docker-compose down && docker-compose up -d`

## Monitoring

### View Ollama Logs

```bash
docker logs -f taxentia-ollama
```

### Check Memory Usage

```bash
docker stats taxentia-ollama
```

### Monitor Response Times

Check server logs:
```bash
# In your terminal running npm run dev
# Look for: "Calling Ollama with model: llama2" messages
```

## Production Deployment

### Recommended Settings

```bash
# Use larger model for accuracy
OLLAMA_MODEL="llama2-13b"

# Enable GPT-4o validation for quality assurance
USE_GPT4O_VALIDATION="true"

# Use GPU for performance
# (Uncomment GPU settings in docker-compose.yml)

# Set resource limits in docker-compose.yml
```

### Cost Analysis

**Monthly costs** (10k queries):
- **Ollama only**: $0 (after setup)
- **Ollama + GPT-4o validation (10% of responses)**: ~$15
- **GPT-4o Mini only**: ~$50
- **Previous (GPT-4 Turbo)**: ~$200+

**Time to response**:
- **Ollama**: 2-4 seconds
- **Hybrid**: 2-4 seconds (with optional background validation)
- **GPT-4o Mini**: 15-20 seconds

## Next Steps

1. ✅ Start Ollama container
2. ✅ Pull a model
3. ✅ Test with `curl http://localhost:11434/api/tags`
4. ✅ Start the app: `npm run dev`
5. ✅ Make a query from the UI
6. ✅ Check logs for "Calling Ollama" message

Questions? Check `server/services/hybrid-llm-service.ts` for implementation details.
