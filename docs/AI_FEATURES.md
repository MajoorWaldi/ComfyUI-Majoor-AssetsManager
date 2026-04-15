# Majoor Assets Manager — AI Features Guide

**Comprehensive guide to AI-powered features in Majoor Assets Manager**

*Version: 2.4.5*
*Last Updated: April 15, 2026*

---

## Table of Contents

- [Overview](#overview)
- [AI Models & Technologies](#ai-models--technologies)
- [Enabling AI Features](#enabling-ai-features)
- [Core AI Features](#core-ai-features)
  - [Semantic Search](#1-semantic-search)
  - [Find Similar](#2-find-similar)
  - [AI Auto-Tags](#3-ai-auto-tags)
  - [Enhanced Captions (Florence-2)](#4-enhanced-captions-florence-2)
  - [Prompt Alignment Score](#5-prompt-alignment-score)
  - [Smart Collections](#6-smart-collections)
  - [Discover Groups](#7-discover-groups)
- [How It Works](#how-it-works)
- [Configuration & Tuning](#configuration--tuning)
- [Performance Considerations](#performance-considerations)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)
- [Privacy & Security](#privacy--security)

---

## Overview

Majoor Assets Manager includes a suite of **AI-powered features** that leverage multimodal embedding models to provide semantic search, visual similarity matching, and automated metadata generation. These features help you discover and organize your generated assets more intelligently.

### What AI Features Provide

| Feature | Description | Use Case |
|---------|-------------|----------|
| **Semantic Search** | Search using natural language instead of keywords | "sunset over mountains" finds matching images |
| **Find Similar** | Discover visually similar assets | Find variations of a successful generation |
| **AI Auto-Tags** | Automatic tag suggestions based on image content | Auto-tag "portrait", "landscape", "cyberpunk" |
| **Enhanced Captions** | AI-generated detailed image descriptions | Generate searchable captions for images |
| **Prompt Alignment** | Score how well image matches its prompt | Verify generation quality |
| **Smart Collections** | Auto-group assets by visual similarity | Create themed collections automatically |
| **Discover Groups** | Cluster library by visual themes | Explore your library's content patterns |

### Key Benefits

- **Natural Language Search**: No need to remember exact filenames or tags
- **Visual Discovery**: Find assets by appearance, not just metadata
- **Automated Organization**: Reduce manual tagging workload
- **Quality Insights**: Understand prompt-image alignment
- **Themed Grouping**: Automatically discover patterns in your library

---

## AI Models & Technologies

### Primary Models

| Model | Purpose | Dimensions | Source |
|-------|---------|------------|--------|
| **SigLIP2 SO400M** | Image & text embeddings | 1152 | Google |
| **X-CLIP Base** | Video embeddings | 768 | Microsoft |
| **Florence-2 Base** | Image captioning | N/A | Microsoft |

### Technology Stack

- **Sentence Transformers**: Model loading and inference
- **Faiss**: Vector similarity search (Facebook AI Similarity Search)
- **Transformers**: HuggingFace transformers for model inference
- **SQLite with vector extension**: Embedding storage

### Model Download & Caching

Models are downloaded automatically on first use and cached locally:

```
Cache Location: ~/.cache/huggingface/hub/
Models:
  - google/siglip-so400m-patch14-384 (SigLIP2)
  - microsoft/xclip-base-patch32 (X-CLIP)
  - microsoft/Florence-2-base (Florence-2)
```

**Initial Download Sizes:**
- SigLIP2: ~1.2 GB
- X-CLIP: ~600 MB
- Florence-2: ~800 MB

---

## Enabling AI Features

### Method 1: Via Settings UI (Recommended)

1. Open **Assets Manager** panel in ComfyUI
2. Click **Settings** (gear icon)
3. Find **AI Features** section
4. Toggle **Enable AI semantic search** to ON
5. Wait for initial model download (progress shown in console)
6. Click **Save Settings**

### Method 2: Via Environment Variable

Add to your environment before starting ComfyUI:

```bash
# Windows (PowerShell)
$env:MJR_AM_ENABLE_VECTOR_SEARCH="1"

# Windows (Command Prompt)
set MJR_AM_ENABLE_VECTOR_SEARCH=1

# Linux/macOS
export MJR_AM_ENABLE_VECTOR_SEARCH=1
```

### Verification

After enabling:

1. Check console for model loading messages:
   ```
   INFO: Loading multimodal embedding model 'google/siglip-so400m-patch14-384' …
   INFO: SigLIP2 model loaded and ready: 'google/siglip-so400m-patch14-384' (dim=1152)
   ```

2. In Assets Manager, look for:
   - Sparkles icon (🔮) in search bar for semantic search toggle
   - "Find Similar" button in asset context menu
   - AI-related options in Collections panel

### Initial Setup Workflow

```
1. Enable AI features in Settings
   ↓
2. Trigger initial index scan (Ctrl+S)
   ↓
3. Wait for metadata extraction to complete
   ↓
4. Click "Backfill vectors" in Index Status
   ↓
5. Wait for vector embeddings to be computed
   ↓
6. AI features are now fully functional
```

### Per-Asset Vector Operations

You can trigger scan and backfill vectors for **individual assets** directly from the grid view:

#### Via Card Status Dot

1. **Locate the status indicator** on an asset card (small dot in corner)
2. **Click the status dot** to open the asset actions menu
3. Select one of:
   - **"Index Asset"** — Trigger metadata scan for this asset only
   - **"Generate Vector"** — Compute AI embedding for this asset
   - **"Re-index"** — Force re-scan and re-compute vectors

#### Via Sparkles Icon (Prime Icon)

1. **Hover over an asset card** to reveal action buttons
2. **Click the sparkles icon** (🔮) if visible on the card
3. Choose from AI-specific actions:
   - **Generate Caption** — Run Florence-2 captioning
   - **Compute Alignment** — Calculate prompt alignment score
   - **Suggest Tags** — Generate AI auto-tags
   - **Find Similar** — Show visually similar assets

#### When to Use Per-Asset Operations

| Scenario | Recommended Action |
|----------|-------------------|
| New asset added after backfill | Click status dot → Generate Vector |
| Caption missing/outdated | Click sparkles → Generate Caption |
| Poor alignment score | Click sparkles → Re-compute Alignment |
| Asset not appearing in semantic search | Status dot → Index Asset, then Generate Vector |
| Testing AI features on single image | Use sparkles icon actions |

#### Visual Indicators

| Indicator | Meaning |
|-----------|---------|
| 🟢 Green dot | Asset fully indexed with vectors |
| 🟡 Yellow dot | Asset indexed, vectors pending |
| 🔴 Red dot | Indexing failed or vectors unavailable |
| 🔮 Sparkles visible | AI features available for this asset |
| ⏳ Spinning icon | Processing in progress |

<div class="tip">
<strong>💡 Tip:</strong> For best results, run a full backfill first, then use per-asset operations to update individual items as needed.
</div>

---

## Core AI Features

### 1. Semantic Search

Search your asset library using natural language queries instead of keywords.

#### How to Use

1. Open **Assets Manager** panel
2. Click the **sparkles icon** (🔮) in the search bar to enable semantic mode
3. Type a natural language query:
   - "sunset over mountains with orange sky"
   - "cyberpunk city at night"
   - "portrait of a woman with blue hair"
4. Press Enter to search

#### Query Examples

| Query Type | Example |
|------------|---------|
| **Visual description** | "red sports car on mountain road" |
| **Style/Mood** | "dark gothic castle in mist" |
| **Color-based** | "images with dominant blue tones" |
| **Subject-based** | "anime character with long white hair" |
| **French queries** | "chien" → finds dog images (auto-translated) |

#### How It Works

1. Your query is converted to a text embedding using SigLIP2
2. The embedding is compared against all indexed image embeddings
3. Results are ranked by cosine similarity (closest matches first)
4. Results are hydrated with full asset metadata for display

#### Tips

- Be descriptive: "sunset beach with palm trees" works better than "beach"
- Use color words: "green forest", "blue ocean", "red sunset"
- Include style keywords: "anime", "photorealistic", "cyberpunk"
- Semantic search works across languages (FR → EN auto-translation)

---

### 2. Find Similar

Discover assets visually similar to a selected asset.

#### How to Use

1. **Select an asset** in the grid view (click once)
2. **Right-click** → **Find Similar** (or click the Clone icon)
3. View visually similar assets ranked by similarity score
4. Adjust `top_k` parameter to show more/fewer results (default: 20)

#### Use Cases

- **Variation Discovery**: Find successful variations of a generation
- **Style Exploration**: Discover assets with similar aesthetic
- **Quality Comparison**: Compare different attempts at same prompt
- **Theme Grouping**: Find all assets matching a visual theme

#### Similarity Score

Results include a similarity score (0.0 to 1.0):
- **0.85+**: Very similar (near-duplicates or variations)
- **0.70-0.85**: Highly similar (same theme/style)
- **0.55-0.70**: Moderately similar (related concepts)
- **<0.55**: Loosely related (shared elements only)

#### Technical Details

- Reference asset is excluded from results
- Uses cosine similarity in embedding space
- Searches across all scopes (Outputs, Inputs, Custom)
- Respects current scope filter if applied

---

### 3. AI Auto-Tags

Automatically suggested tags based on image content analysis.

#### How It Works

1. Image embedding is compared against predefined tag vocabulary
2. Tags with similarity above threshold are suggested
3. Auto-tags are stored separately from user tags
4. Tags can be viewed and applied to assets

#### Available Auto-Tags

The system includes 20+ canonical tags:

| Category | Tags |
|----------|------|
| **Subject** | portrait, landscape, character, food, vehicle, nature, architecture |
| **Style** | cyberpunk, anime, photorealistic, abstract, fantasy, sci-fi, horror |
| **Medium** | watercolor, pixel-art, 3d-render, sketch, black-and-white |
| **Content** | nsfw (adult content detection) |

#### How to View Auto-Tags

1. Open an asset in the **Viewer**
2. Look at the **Sidebar** → **AI Tags** section
3. See suggested tags with confidence scores

#### How to Apply Auto-Tags

1. In Viewer sidebar, click **Apply All** to add all AI tags
2. Or click individual tags to add selectively
3. Tags are merged with your existing tags

#### Configuration

Adjust sensitivity via environment variable:

```bash
# Lower threshold = more tags (less precise)
# Higher threshold = fewer tags (more precise)
MJR_AM_VECTOR_AUTOTAG_THRESHOLD=0.06  # Default
```

---

### 4. Enhanced Captions (Florence-2)

Generate detailed AI-powered image descriptions.

#### How to Generate

1. Open an asset in the **Viewer**
2. In the sidebar, find **Image Description** section
3. Click **Generate** button
4. Wait for caption generation (5-30 seconds)
5. Generated caption appears in sidebar

#### Caption Quality

Florence-2 generates detailed, descriptive captions:

**Example Input**: Anime-style image of a girl with blue hair

**Generated Caption**:
> "An anime-style illustration of a young woman with long flowing blue hair and large expressive eyes. She is wearing a school uniform with a white shirt and blue skirt. The background shows a soft gradient of pink and purple, suggesting a sunset or dawn setting. The art style is typical of modern anime with clean lines and vibrant colors."

#### Use Cases

- **Accessibility**: Describe images for visually impaired users
- **Search Enhancement**: Captions are indexed for semantic search
- **Documentation**: Auto-generate descriptions for asset catalogs
- **Prompt Analysis**: Compare generated caption with original prompt

#### Batch Generation

For multiple assets, use the API:

```bash
POST /mjr/am/vector/caption/{asset_id}
```

Or use the "Backfill vectors" feature which generates captions for all images.

#### Storage

- Captions stored in `asset_metadata.enhanced_caption` field
- Persisted in SQLite database
- Survives index resets (stored separately from vectors)

---

### 5. Prompt Alignment Score

Measure how well an image matches its generation prompt.

#### What It Measures

The alignment score quantifies the semantic similarity between:
- The original generation prompt (from metadata)
- The visual content of the image (from embedding)

#### Score Interpretation

| Score Range | Interpretation |
|-------------|----------------|
| **0.80-1.00** | Excellent alignment (image matches prompt very well) |
| **0.65-0.80** | Good alignment (minor deviations) |
| **0.50-0.65** | Moderate alignment (noticeable differences) |
| **0.30-0.50** | Poor alignment (significant prompt drift) |
| **<0.30** | Very poor alignment (image doesn't match prompt) |

#### How It's Calculated

The score uses **multi-signal fusion**:

1. **Multi-segment image↔text score** (60% weight)
   - Prompt split into segments
   - Each segment scored against image
   - Length-weighted average with best-segment bonus

2. **Caption↔prompt text similarity** (20% weight)
   - Florence-2 caption compared to prompt
   - Text-to-text coherence measure

3. **Semantic dimension score** (20% weight)
   - Subject, style, medium, mood, color dimensions
   - Each dimension scored separately

**Negative Prompt Penalty**: If negative prompt exists, its similarity to image reduces the score (penalizes unwanted content leakage).

#### How to View

1. Open asset in **Viewer**
2. Look for **Prompt Alignment** section in sidebar
3. Score displayed as percentage (0-100%)

#### Use Cases

- **Quality Control**: Identify generations that didn't match intent
- **Prompt Engineering**: Refine prompts based on alignment feedback
- **Curation**: Filter library by alignment quality
- **Model Comparison**: Compare different models' prompt adherence

---

### 6. Smart Collections

Automatically create collections based on AI suggestions.

#### How to Use

1. Open **Collections** panel
2. Click **Smart Suggestions** button
3. Review AI-suggested collections
4. Click **Create** to accept a suggestion

#### Suggestion Types

The AI analyzes your library and suggests:

- **Theme-based**: "Cyberpunk Collection", "Nature Scenes"
- **Style-based**: "Anime Collection", "Photorealistic"
- **Color-based**: "Blue Tones", "Warm Colors"
- **Subject-based**: "Portraits", "Landscapes", "Vehicles"

#### How Suggestions Work

1. Asset embeddings are clustered using k-means
2. Each cluster is analyzed for common themes
3. Representative tags and descriptions generated
4. Suggestions presented for approval

#### Configuration

Adjust number of suggestions:

```json
{
  "k": 8  // Number of clusters (2-20)
}
```

More clusters = more specific collections
Fewer clusters = broader collections

---

### 7. Discover Groups

Cluster your entire library by visual similarity.

#### How to Use

1. Open **Collections** panel
2. Click **Discover Groups** button
3. Wait for clustering to complete
4. Browse discovered groups
5. Convert groups to collections as desired

#### Group Characteristics

Each group includes:
- **Preview**: Sample images from the group
- **Size**: Number of assets in group
- **Tags**: Common AI-suggested tags
- **Representative Query**: Natural language description

#### Use Cases

- **Library Exploration**: Discover patterns in your assets
- **Cleanup**: Identify duplicate or near-duplicate generations
- **Curation**: Find themed subsets for projects
- **Analysis**: Understand your generation habits

#### Performance

Clustering time depends on library size:

| Assets | Time (approx.) |
|--------|----------------|
| 100-500 | 5-15 seconds |
| 500-2000 | 15-60 seconds |
| 2000-10000 | 1-5 minutes |
| 10000+ | 5-15 minutes |

---

## How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Assets Manager UI                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Semantic │  │   Find   │  │   Auto   │  │  Smart   │   │
│  │  Search  │  │ Similar  │  │  Tags    │  │Collections│  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                          │
                    HTTP API
                          │
┌─────────────────────────┼─────────────────────────────────┐
│              Majoor Backend (Python)                      │
│  ┌──────────────────────┴──────────────────────────┐     │
│  │           Vector Service Layer                  │     │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────┐  │     │
│  │  │  SigLIP2   │  │   X-CLIP   │  │Florence-2│  │     │
│  │  │  (Image)   │  │  (Video)   │  │ (Caption)│  │     │
│  │  └─────┬──────┘  └─────┬──────┘  └────┬─────┘  │     │
│  └────────┼───────────────┼──────────────┼────────┘     │
│           │               │              │              │
│  ┌────────┴───────────────┴──────────────┴──────────┐   │
│  │              Faiss Index (In-Memory)             │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────┴───────────────────────────┐   │
│  │        SQLite (asset_embeddings table)           │   │
│  │  - asset_id                                      │   │
│  │  - vector (BLOB)                                 │   │
│  │  - aesthetic_score                               │   │
│  │  - auto_tags (JSON)                              │   │
│  │  - enhanced_caption                              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Embedding Pipeline

```
1. Asset Discovery
   ↓
2. Metadata Extraction (ExifTool, FFprobe)
   ↓
3. Vector Embedding Computation
   ├─ Image → SigLIP2 image encoder
   ├─ Video → X-CLIP video encoder (keyframes)
   └─ Text → SigLIP2 text encoder
   ↓
4. Embedding Storage
   └─ SQLite: asset_embeddings table
   ↓
5. Index Building
   └─ Faiss IndexFlatIP (cosine similarity)
   ↓
6. Query Processing
   ├─ Text query → text embedding
   ├─ Image query → image embedding
   └─ Similarity search → ranked results
```

### Vector Storage Schema

```sql
CREATE TABLE asset_embeddings (
    asset_id INTEGER PRIMARY KEY,
    vector BLOB NOT NULL,           -- Packed float32 array
    model_name TEXT NOT NULL,       -- e.g., "google/siglip-so400m-patch14-384"
    aesthetic_score REAL,           -- Prompt alignment score (0-1)
    auto_tags TEXT,                 -- JSON array of tag strings
    enhanced_caption TEXT,          -- Florence-2 generated caption
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Configuration & Tuning

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MJR_AM_ENABLE_VECTOR_SEARCH` | `1` | Enable/disable AI features |
| `MJR_AM_VECTOR_MODEL` | `google/siglip-so400m-patch14-384` | Image/text model |
| `MJR_AM_VECTOR_VIDEO_MODEL` | `microsoft/xclip-base-patch32` | Video model |
| `MJR_AM_PROMPT_MODEL` | `microsoft/Florence-2-base` | Caption model |
| `MJR_AM_VECTOR_DIM` | `1152` | Embedding dimension |
| `MJR_AM_VECTOR_AUTOTAG_THRESHOLD` | `0.06` | Auto-tag sensitivity |
| `MJR_AM_VECTOR_SIMILAR_TOPK` | `20` | Default similar results |
| `MJR_AM_VECTOR_KEYFRAME_INTERVAL` | `5.0` | Video keyframe interval (sec) |
| `MJR_AM_VECTOR_BATCH_SIZE` | `32` | Embedding batch size |
| `MJR_AM_AI_VERBOSE_LOGS` | `0` | Verbose AI logging |

### Model Selection

#### Image/Text Model Options

| Model | Dimensions | Speed | Quality | Use Case |
|-------|------------|-------|---------|----------|
| `google/siglip-so400m-patch14-384` | 1152 | Medium | High | Default, balanced |
| `google/siglip-base-patch16-224` | 768 | Fast | Medium | Lower RAM systems |
| `google/siglip-large-patch16-384` | 1024 | Slow | Very High | Quality-focused |

#### Video Model Options

| Model | Dimensions | Speed | Quality |
|-------|------------|-------|---------|
| `microsoft/xclip-base-patch32` | 768 | Medium | Good |
| `microsoft/xclip-large-patch14` | 1024 | Slow | Better |

#### Caption Model Options

| Model | Size | Speed | Quality |
|-------|------|-------|---------|
| `microsoft/Florence-2-base` | ~230M | Fast | Good |
| `microsoft/Florence-2-large` | ~580M | Medium | Better |

### Tuning Examples

#### Faster Embedding (Lower Quality)

```bash
export MJR_AM_VECTOR_MODEL="google/siglip-base-patch16-224"
export MJR_AM_VECTOR_BATCH_SIZE=64
export MJR_AM_VECTOR_DIM=768
```

#### Higher Quality (Slower)

```bash
export MJR_AM_VECTOR_MODEL="google/siglip-large-patch16-384"
export MJR_AM_PROMPT_MODEL="microsoft/Florence-2-large"
export MJR_AM_VECTOR_AUTOTAG_THRESHOLD=0.30
```

#### Low-RAM System

```bash
export MJR_AM_VECTOR_BATCH_SIZE=8
export MJR_AM_VECTOR_MODEL="google/siglip-base-patch16-224"
```

---

## Performance Considerations

### Resource Requirements

| Component | Minimum | Recommended | Optimal |
|-----------|---------|-------------|---------|
| **RAM** | 8 GB | 16 GB | 32 GB |
| **VRAM** | 0 GB (CPU) | 4 GB | 8+ GB |
| **Storage** | 5 GB free | 10 GB free | 20+ GB free |
| **CPU** | 4 cores | 8 cores | 12+ cores |

### Model Loading Times

| Model | Cold Load | Cached |
|-------|-----------|--------|
| SigLIP2 SO400M | 30-60s | 5-10s |
| X-CLIP Base | 20-40s | 3-8s |
| Florence-2 Base | 15-30s | 2-5s |

### Embedding Speed

| Asset Type | CPU Only | GPU (RTX 3060) |
|------------|----------|----------------|
| Image (1080p) | 2-5 sec | 0.5-1 sec |
| Video (1 min) | 10-30 sec | 3-10 sec |
| Text caption | 0.5-2 sec | 0.1-0.5 sec |

### Backfill Performance

**Backfill vectors** computes embeddings for all assets without vectors:

| Library Size | Time (CPU) | Time (GPU) |
|--------------|------------|------------|
| 100 assets | 2-5 min | 30-60 sec |
| 500 assets | 10-25 min | 2-5 min |
| 1000 assets | 20-50 min | 5-10 min |
| 5000 assets | 2-4 hours | 25-50 min |

### Optimization Tips

1. **Enable GPU acceleration** (CUDA):
   ```bash
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
   ```

2. **Adjust batch size** for your hardware:
   - Low RAM: `MJR_AM_VECTOR_BATCH_SIZE=8`
   - High RAM: `MJR_AM_VECTOR_BATCH_SIZE=64`

3. **Use CPU-only mode** if GPU memory is limited:
   ```bash
   export CUDA_VISIBLE_DEVICES=""
   ```

4. **Limit index size** for large libraries:
   - Vector searcher caps at 100,000 assets
   - Most recent assets prioritized

5. **Schedule backfill** during off-hours:
   - Run overnight for large libraries
   - System remains usable during backfill

---

## Troubleshooting

### Common Issues

#### 1. AI Features Not Appearing

**Symptoms**: No sparkles icon, no "Find Similar" button

**Solutions**:
- Check if AI features are enabled in Settings
- Verify `MJR_AM_ENABLE_VECTOR_SEARCH=1` in environment
- Restart ComfyUI after enabling
- Check console for model loading errors

#### 2. Model Download Fails

**Symptoms**: Error downloading models, timeout

**Solutions**:
```bash
# Check internet connectivity
ping huggingface.co

# Manual model download
huggingface-cli download google/siglip-so400m-patch14-384

# Set HF mirror (for China/regions with restrictions)
export HF_ENDPOINT=https://hf-mirror.com
```

#### 3. Out of Memory (OOM)

**Symptoms**: System freezes, crashes during embedding

**Solutions**:
- Reduce batch size: `MJR_AM_VECTOR_BATCH_SIZE=8`
- Close other applications
- Use CPU-only mode to free GPU RAM
- Restart ComfyUI to clear memory

#### 4. Slow Performance

**Symptoms**: Searches take >5 seconds, UI lag

**Solutions**:
- Reduce library size (split into multiple scopes)
- Use GPU acceleration if available
- Increase system RAM
- Disable verbose logging: `MJR_AM_AI_VERBOSE_LOGS=0`

#### 5. Poor Search Results

**Symptoms**: Irrelevant results for queries

**Solutions**:
- Ensure vectors are backfilled: Index Status → Backfill vectors
- Use more descriptive queries
- Check model loaded correctly in console
- Verify embedding dimension matches model

#### 6. Caption Generation Fails

**Symptoms**: "Generate" button shows error, no caption

**Solutions**:
- Check Florence-2 model loaded (console logs)
- Verify asset is an image (not video)
- Increase timeout: `MJR_AM_DB_TIMEOUT=120`
- Check disk space for model cache

### Diagnostic Commands

```bash
# Check model cache
ls -la ~/.cache/huggingface/hub/

# Verify Python packages
pip list | grep -E "sentence-transformers|transformers|faiss"

# Test model loading
python -c "from sentence_transformers import SentenceTransformer; m = SentenceTransformer('google/siglip-so400m-patch14-384'); print('OK')"

# Check vector index status
curl http://localhost:8188/mjr/am/vector/stats
```

### Log Analysis

Enable verbose logging for debugging:

```bash
export MJR_AM_AI_VERBOSE_LOGS=1
```

Look for these log patterns:

```
# Successful model load
INFO: Loading multimodal embedding model 'google/siglip-so400m-patch14-384' …
INFO: SigLIP2 model loaded and ready: 'google/siglip-so400m-patch14-384' (dim=1152)

# Successful embedding
DEBUG: Vector embedding computed for asset 12345

# Search query
INFO: Semantic search: 'sunset mountains' → 20 results
```

---

## API Reference

### Semantic Search

```http
GET /mjr/am/vector/search?q={query}&top_k={count}&scope={scope}
```

**Parameters**:
- `q` (required): Natural language query
- `top_k` (optional): Max results (default: 20, max: 200)
- `scope` (optional): `output`, `input`, `custom`, `all`

**Example**:
```bash
curl "http://localhost:8188/mjr/am/vector/search?q=sunset%20beach&top_k=10"
```

**Response**:
```json
{
  "ok": true,
  "data": [
    {
      "id": 12345,
      "asset_id": 12345,
      "filepath": "/path/to/image.png",
      "filename": "image.png",
      "kind": "image",
      "_vectorScore": 0.8923
    }
  ]
}
```

### Find Similar

```http
GET /mjr/am/vector/similar/{asset_id}?top_k={count}
```

**Parameters**:
- `asset_id` (required): Reference asset ID
- `top_k` (optional): Max results (default: 20)

**Example**:
```bash
curl "http://localhost:8188/mjr/am/vector/similar/12345?top_k=10"
```

### Prompt Alignment

```http
GET /mjr/am/vector/alignment/{asset_id}
```

**Response**:
```json
{
  "ok": true,
  "data": 0.7523
}
```

### Generate Caption

```http
POST /mjr/am/vector/caption/{asset_id}
```

**Response**:
```json
{
  "ok": true,
  "data": "An anime-style illustration of..."
}
```

### Auto-Tags

```http
GET /mjr/am/vector/auto-tags/{asset_id}
```

**Response**:
```json
{
  "ok": true,
  "data": ["anime", "portrait", "fantasy"]
}
```

### Suggest Collections

```http
POST /mjr/am/vector/suggest-collections
Content-Type: application/json

{"k": 8}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "suggestions": [
      {
        "name": "Cyberpunk Collection",
        "query": "cyberpunk neon city night",
        "estimated_size": 45,
        "tags": ["cyberpunk", "sci-fi", "night"]
      }
    ]
  }
}
```

### Vector Stats

```http
GET /mjr/am/vector/stats
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "total": 1234,
    "avg_score": 0.6523,
    "dim": 1152,
    "enabled": true
  }
}
```

### Re-index Asset

```http
POST /mjr/am/vector/index/{asset_id}
```

Force re-computation of embedding for a single asset.

---

## Privacy & Security

For a dedicated user-facing explanation focused on privacy, offline behavior, and token meaning, see [PRIVACY_OFFLINE.md](PRIVACY_OFFLINE.md).

### Data Privacy

- **Local Processing**: All AI inference runs locally on your machine
- **No Cloud Upload**: Images and prompts never leave your computer
- **Local Cache**: Models cached in `~/.cache/huggingface/hub/`
- **No Telemetry**: No usage data sent to developers

In practice, semantic search, find-similar, prompt alignment, caption generation, and auto-tagging run against models loaded inside your local ComfyUI / Majoor process after those models are available locally.

### Network Access

Initial model download requires internet access:

- Downloads from HuggingFace CDN
- One-time download per model
- Subsequent uses work offline
- Optional HuggingFace token only affects HuggingFace Hub downloads and rate limits

### Token Clarification

Majoor exposes two different token concepts that are easy to confuse:

- **HuggingFace token**: optional, used for downloading model files from HuggingFace Hub with better rate limits. It is not a hosted AI inference key.
- **Majoor API token**: used to secure remote write access to the local Majoor backend when ComfyUI is reachable over LAN, reverse proxy, or tunnel. It is not used to send prompts or images to an external AI service.

### Offline Use

Offline use is supported once the required models are already cached locally.

- If AI models are already present in the HuggingFace cache, AI features can run without internet access.
- If models are not cached yet, the first model bootstrap requires network access.
- Non-AI Majoor features do not depend on HuggingFace model downloads.

### Security Considerations

1. **Model Integrity**: Models downloaded from official HuggingFace repos
2. **Model Code Surface**: AI inference is local, but some model loading still depends on upstream HuggingFace/Transformers model packages and compatibility loaders
3. **Sandboxing**: Models run in same process as ComfyUI
4. **Resource Limits**: Built-in rate limiting prevents abuse

### Environment Isolation

For enhanced security, run in isolated environment:

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt -r requirements-vector.txt
```

---

## Appendix: Model Cards

### SigLIP2 SO400M

- **Publisher**: Google
- **Architecture**: Vision-Language Transformer
- **Training**: Contrastive image-text pairs
- **License**: Apache 2.0
- **HuggingFace**: https://huggingface.co/google/siglip-so400m-patch14-384

### X-CLIP Base

- **Publisher**: Microsoft
- **Architecture**: Video-Language Transformer
- **Training**: Video-text pairs
- **License**: MIT
- **HuggingFace**: https://huggingface.co/microsoft/xclip-base-patch32

### Florence-2 Base

- **Publisher**: Microsoft
- **Architecture**: Vision-Language Model
- **Training**: Image-caption pairs
- **License**: MIT
- **HuggingFace**: https://huggingface.co/microsoft/Florence-2-base

---

## Changelog

### v2.4.0 (March 2026)
- Added Florence-2 caption generation
- Improved prompt alignment scoring with multi-signal fusion
- Added French-to-English query translation
- Enhanced auto-tag vocabulary (20+ tags)
- Smart Collections with k-means clustering

### v2.3.0 (February 2026)
- Initial AI features release
- Semantic search with SigLIP2
- Find Similar functionality
- Basic auto-tagging

---

## Support & Resources

### Documentation
- [Main Documentation Index](DOCUMENTATION_INDEX.md)
- [API Reference](API_REFERENCE.md)
- [Configuration Guide](SETTINGS_CONFIGURATION.md)

### Community
- [GitHub Issues](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/issues)
- [GitHub Discussions](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/discussions)

### Model Documentation
- [Sentence Transformers Docs](https://sbert.net/)
- [HuggingFace Transformers](https://huggingface.co/docs/transformers)
- [Faiss Documentation](https://faiss.ai/)

---

*This documentation is part of the Majoor Assets Manager project.*
*Copyright © 2026 Ewald ALOEBOETOE (MajoorWaldi)*
