# Majoor Gen Info Override

Builds an explicit metadata payload for **Majoor Save Image** and **Majoor Save Video**.

Connect `workflow_context` to a late node in the generation branch when you want Majoor to recover the executed sampler values from the complete prompt graph. Manual values take precedence when supplied.

## Main inputs

- `positive_prompt` / `negative_prompt`: prompt text to preserve.
- `seed`, `steps`, `cfg`, `sampler`, `scheduler`: optional generation values. Negative values mean automatic detection.
- `model`, `vae`, `clip`: optional model identifiers.
- `loras_json`: JSON array such as `[{"name":"detail.safetensors","strength":0.8}]`.
- `custom_info_json`: JSON array of user-facing metadata sections.

Invalid JSON is ignored safely; it is never executed as code.
