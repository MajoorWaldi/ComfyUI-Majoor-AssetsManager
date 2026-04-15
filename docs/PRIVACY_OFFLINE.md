# Majoor Assets Manager - Privacy & Offline Guide

**Version**: 2.4.5
**Last Updated**: April 7, 2026

## Overview

This page explains what Majoor Assets Manager processes locally, what can require network access, what the visible tokens are used for, and what "offline" means in practice.

## Short Answer

- AI inference is intended to run locally on your machine.
- Images and prompts are not uploaded to a hosted cloud inference API for semantic search, captions, similarity, or prompt alignment.
- Internet access is mainly required for the initial HuggingFace model download.
- Once the required models are cached locally, AI features can work offline.
- No usage telemetry is intentionally sent to the developer.

## What Stays Local

After models are available locally, these features run inside your local ComfyUI / Majoor process:

- semantic search
- find similar
- prompt alignment
- caption generation
- auto-tagging

This means Majoor does not rely on a hosted remote AI inference backend for those features.

## What Uses The Network

### Model download

AI features may download models from HuggingFace on first use. Those model files are then cached locally.

Typical cached model location:

```text
~/.cache/huggingface/hub/
```

### Optional HuggingFace token

The HuggingFace token is optional and only affects HuggingFace Hub access:

- better download reliability
- better Hub rate limits
- access to model download endpoints when needed

It is **not** a hosted AI inference key.

### Remote access security

The Majoor API token is unrelated to HuggingFace. It protects remote write access to the local Majoor backend when ComfyUI is exposed on LAN, behind a reverse proxy, or through a tunnel.

It is **not** used to send prompts or images to an external AI service.

## Token Clarification

Majoor exposes two token concepts that are easy to confuse:

### HuggingFace Token

- optional
- used for model downloads from HuggingFace Hub
- improves download access and rate limits
- not used as a cloud inference token

### Majoor API Token

- used for securing remote write operations
- applies to the local Majoor backend
- relevant when ComfyUI is reachable remotely
- not used for AI inference uploads

## Offline Use

### What works offline

AI features can work offline **after** the required models already exist in the local HuggingFace cache.

Non-AI Majoor features do not depend on HuggingFace model downloads.

### What does not work offline on first use

If the model files are not already cached locally, first-time AI bootstrap requires network access to download them.

## Important Nuance

The privacy statement here is specifically about:

- where inference runs
- whether prompts or images are uploaded for AI processing

That is different from saying there is zero upstream trust surface.

Model loading still depends on local HuggingFace / Transformers packages and downloaded model files. Some compatibility loaders may rely on upstream model packaging behavior. So the correct claim is:

- **local inference, no hosted cloud upload of prompts/images for AI processing**

not:

- **zero external code or zero trust surface**

## Recommended Wording For Users

You can summarize Majoor's behavior like this:

> AI features run locally on the user's machine. Prompts and images are not sent to a hosted cloud inference service for semantic search, similarity, captions, or alignment. Internet access is mainly needed only for the initial HuggingFace model download, and once models are cached locally the AI features can be used offline.

## Related Documents

- [AI_FEATURES.md](AI_FEATURES.md)
- [SECURITY_ENV_VARS.md](SECURITY_ENV_VARS.md)
- [SETTINGS_CONFIGURATION.md](SETTINGS_CONFIGURATION.md)
