from mjr_am_backend.features.workflows import classify_workflow, parse_workflow, workflow_node_text


def test_parse_workflow_includes_nested_subgraph_nodes():
    subgraph = {
        "nodes": [
            {"id": 10, "type": "LoadImage", "widgets_values": ["input.png"]},
            {"id": 11, "type": "KSampler"},
        ],
        "links": [[1, 10, 0, 11, 0, "IMAGE"]],
    }
    workflow = {
        "nodes": [
            {"id": 1, "type": "CheckpointLoaderSimple", "widgets_values": ["model.safetensors"]},
            {"id": 2, "type": "GroupNode", "subgraph": subgraph},
        ],
        "links": [[1, 1, 0, 2, 0, "MODEL"]],
    }

    stats = parse_workflow(workflow)

    assert stats.node_count == 2
    assert stats.link_count == 1
    assert stats.subgraph_count == 1
    assert stats.subgraph_node_count == 2
    assert any(node.get("id") == 10 for node in stats.nodes)
    assert any(node.get("id") == 11 for node in stats.nodes)


def test_workflow_node_text_collects_widget_and_input_text():
    text = workflow_node_text(
        [
            {
                "type": "CLIPTextEncode",
                "widgets_values": ["cinematic lighting", 123],
                "inputs": {"text": "prompt text", "strength": 0.8},
            }
        ]
    )

    assert "cliptextencode" in text
    assert "cinematic lighting" in text
    assert "prompt text" in text


def test_classify_workflow_detects_common_workflow_buckets():
    video_edit = classify_workflow("LoadVideo Wan cloud provider")
    i2v = classify_workflow("LoadImage Seedance workflow")
    upscale = classify_workflow("Ultimate upscale model")
    image_edit = classify_workflow("inpaint image edit")

    assert video_edit.task == "Video Edit"
    assert video_edit.runs_on == "api"
    assert i2v.task == "I2V"
    assert i2v.model_family == "Seedance"
    assert upscale.task == "Upscale"
    assert image_edit.task == "Image Edit"


def test_classify_workflow_uses_graph_structure_for_i2v():
    result = classify_workflow(
        "",
        [
            {"id": 1, "type": "LoadImage", "widgets_values": ["start.png"]},
            {"id": 2, "type": "WanVideoSampler"},
            {"id": 3, "type": "VHS_VideoCombine"},
        ],
    )

    assert result.task == "I2V"
    assert result.model_family == "Wan"
    assert result.source == "graph"
    assert result.confidence >= 0.9
    assert result.signals["has_image_input"] is True
    assert result.signals["has_video_sink"] is True


def test_classify_workflow_detects_video_edit_and_api_provider():
    result = classify_workflow(
        "",
        [
            {"id": 1, "type": "LoadVideo", "widgets_values": ["clip.mp4"]},
            {"id": 2, "type": "GoogleVeoVideoGeneration"},
        ],
    )

    assert result.task == "Video Edit"
    assert result.model_family == "Veo"
    assert result.provider == "Google"
    assert result.runs_on == "api"


def test_classify_workflow_detects_model_from_checkpoint_widget():
    result = classify_workflow(
        "",
        [
            {
                "id": 1,
                "type": "CheckpointLoaderSimple",
                "widgets_values": ["qwen_image_edit_fp8.safetensors"],
            },
            {"id": 2, "type": "KSampler"},
            {"id": 3, "type": "SaveImage"},
        ],
    )

    assert result.task == "T2I"
    assert result.model_family == "Qwen"
    assert result.runs_on == "local"
