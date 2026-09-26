import json
import shutil
import zlib

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request
from mjr_am_backend.adapters.tools import external_tools as tools
from mjr_am_backend.adapters.tools import local_media
from mjr_am_backend.adapters.tools.ffprobe import FFProbe
from mjr_am_backend.routes.handlers import releases
from mjr_am_shared import runtime_env, version


@pytest.mark.parametrize("path", ["https://host/a.mp4", "rtsp://host/a", "file:/tmp/a", "concat:a|b", "pipe:0", "-i", "a\n.mp4"])
def test_media_input_rejected_before_execution(monkeypatch, path):
    def forbidden(*args, **kwargs):
        pytest.fail("invalid input reached process boundary")

    monkeypatch.setattr(tools, "run", forbidden)
    with pytest.raises((ValueError, OSError)):
        tools.run_ffmpeg(["ffmpeg", "-i", path, "output.png"])


def test_media_files_resolved_and_protocols_restricted(tmp_path, monkeypatch):
    source = tmp_path / "a video.mp4"
    source.touch()
    captured = []
    monkeypatch.setattr(tools, "run", lambda cmd, **kw: captured.append(cmd))
    tools.run_ffmpeg(["ffmpeg", "-i", str(source), "output.png"])
    cmd = captured[0]
    assert cmd[cmd.index("-i") + 1] == str(source.resolve())
    assert cmd[cmd.index("-protocol_whitelist") + 1] == "file,pipe"
    probe = FFProbe.__new__(FFProbe)
    probe.bin = "ffprobe"
    probe._resolved_bin = None
    assert "-protocol_whitelist" in probe._build_ffprobe_cmd(str(source))
    with pytest.raises(ValueError):
        tools.local_media_path(tmp_path)
    with pytest.raises(OSError):
        tools.local_media_path(tmp_path / "missing.mp4")


def test_environment_preserves_missing_empty_live_and_default_values(monkeypatch):
    key = "MAJOOR_TEST_RUNTIME_ENV"
    monkeypatch.delenv(key, raising=False)
    assert runtime_env.get_env(key) is None
    assert runtime_env.get_env(key, 64) == 64
    runtime_env.set_env(key, "")
    assert runtime_env.has_env(key)
    assert runtime_env.get_env(key, "fallback") == ""
    runtime_env.set_env(key, "updated")
    assert runtime_env.get_env(key) == "updated"
    runtime_env.unset_env(key)
    assert not runtime_env.has_env(key)


@pytest.mark.skipif(not shutil.which("ffmpeg") or not shutil.which("ffprobe"), reason="Media tools unavailable")
def test_real_media_probe_and_frame_extraction(tmp_path):
    source = tmp_path / "local video.mp4"
    generated = tools.run(
        [shutil.which("ffmpeg"), "-v", "error", "-f", "lavfi", "-i",
         "color=c=black:s=32x32:d=0.2", "-c:v", "mpeg4", str(source)],
        capture_output=True, timeout=15,
    )
    assert generated.returncode == 0, generated.stderr
    probe_bin = shutil.which("ffprobe")
    assert local_media.video_duration(str(source), probe_bin) > 0
    frame = local_media.video_frame(str(source), 0, probe_bin)
    assert frame.size == (32, 32)
    playlist = tmp_path / "remote.m3u8"
    playlist.write_text("#EXTM3U\n#EXT-X-TARGETDURATION:1\n#EXTINF:1,\nhttp://127.0.0.1:9/a.ts\n#EXT-X-ENDLIST\n")
    result = FFProbe(bin_name=probe_bin).read(str(playlist))
    assert not result.ok
    assert "not on whitelist" in result.error


def test_git_metadata_loose_packed_tags_and_worktree(tmp_path, monkeypatch):
    monkeypatch.setattr(version, "_repo_root", lambda: tmp_path)
    git = tmp_path / ".git"
    git.mkdir()
    (git / "HEAD").write_text("ref: refs/heads/nightly\n")
    oid = "a" * 40
    (git / "packed-refs").write_text(f"{oid} refs/heads/nightly\n{'b' * 40} refs/tags/v2.5.1\n^{oid}\n")
    version._run_git.cache_clear()
    assert version._resolve_branch_from_git() == "nightly"
    assert version._run_git("describe", "--tags", "--exact-match") == "v2.5.1"
    (git / "HEAD").write_text(oid)
    tags = git / "refs" / "tags"
    tags.mkdir(parents=True)
    tag_oid = "c" * 40
    (tags / "v2.5.0").write_text(tag_oid)
    obj = git / "objects" / tag_oid[:2] / tag_oid[2:]
    obj.parent.mkdir(parents=True)
    obj.write_bytes(zlib.compress(b"tag 80\0object " + oid.encode() + b"\ntype commit\n"))
    version._run_git.cache_clear()
    assert version._resolve_branch_from_git() == ""
    assert version._run_git("describe", "--tags", "--exact-match") == "v2.5.0"
    checkout = tmp_path / "checkout"
    checkout.mkdir()
    worktree = git / "worktrees" / "test"
    worktree.mkdir(parents=True)
    (checkout / ".git").write_text(f"gitdir: {worktree}")
    (worktree / "commondir").write_text("../..")
    (worktree / "HEAD").write_text("ref: refs/heads/nightly")
    monkeypatch.setattr(version, "_repo_root", lambda: checkout)
    version._run_git.cache_clear()
    assert version._resolve_branch_from_git() == "nightly"
    version._run_git.cache_clear()


def _write_tag_object(git, oid, target, name, timestamp):
    body = (
        f"object {target}\ntype commit\ntag {name}\n"
        f"tagger Test <test@example.invalid> {timestamp} +0000\n\nRelease\n"
    ).encode()
    obj = git / "objects" / oid[:2] / oid[2:]
    obj.parent.mkdir(parents=True, exist_ok=True)
    obj.write_bytes(zlib.compress(f"tag {len(body)}\0".encode() + body))


@pytest.mark.parametrize("storage", ["loose", "packed_refs", "packed_objects", "mixed"])
def test_stable_annotated_tag_wins_over_lightweight_nightly(tmp_path, monkeypatch, storage):
    monkeypatch.setattr(version, "_repo_root", lambda: tmp_path)
    for key in ("MAJOR_ASSETS_MANAGER_BRANCH", "MAJOOR_ASSETS_MANAGER_BRANCH",
                "MAJOR_ASSETS_MANAGER_CHANNEL", "MAJOOR_ASSETS_MANAGER_CHANNEL"):
        monkeypatch.delenv(key, raising=False)
    git = tmp_path / ".git"
    tags = git / "refs" / "tags"
    tags.mkdir(parents=True)
    commit, annotation = "a" * 40, "b" * 40
    (git / "HEAD").write_text(commit)
    (tmp_path / "pyproject.toml").write_text('version = "2.5.1"\n')
    if storage != "packed_objects":
        _write_tag_object(git, annotation, commit, "v2.5.1", 1700000000)
    if storage != "loose":
        (git / "packed-refs").write_text(
            f"{commit} refs/tags/nightly\n{annotation} refs/tags/v2.5.1\n^{commit}\n"
        )
    if storage in {"loose", "mixed"}:
        (tags / "nightly").write_text(commit)
        (tags / "v2.5.1").write_text(annotation)
    version._run_git.cache_clear()
    try:
        assert version._run_git("describe", "--tags", "--exact-match") == "v2.5.1"
        assert version.get_version_info() == {"version": "2.5.1", "branch": "main"}
    finally:
        version._run_git.cache_clear()


def test_newest_annotated_tag_wins_and_loose_ref_overrides_packed(tmp_path, monkeypatch):
    monkeypatch.setattr(version, "_repo_root", lambda: tmp_path)
    git = tmp_path / ".git"
    tags = git / "refs" / "tags"
    tags.mkdir(parents=True)
    commit, old_tag, new_tag, other_commit = (char * 40 for char in "abcd")
    (git / "HEAD").write_text(commit)
    (tags / "nightly").write_text(old_tag)
    (tags / "v2.5.1").write_text(new_tag)
    _write_tag_object(git, old_tag, commit, "nightly", 1700000000)
    _write_tag_object(git, new_tag, commit, "v2.5.1", 1700000010)
    (git / "packed-refs").write_text(f"{old_tag} refs/tags/nightly\n^{commit}\n")
    version._run_git.cache_clear()
    try:
        assert version._run_git("describe", "--tags", "--exact-match") == "v2.5.1"
        _write_tag_object(git, old_tag, commit, "nightly", 1700000020)
        version._run_git.cache_clear()
        assert version._run_git("describe", "--tags", "--exact-match") == "nightly"
        (tags / "nightly").write_text(other_commit)
        version._run_git.cache_clear()
        assert version._run_git("describe", "--tags", "--exact-match") == "v2.5.1"
    finally:
        version._run_git.cache_clear()


@pytest.mark.asyncio
@pytest.mark.parametrize("channel,suffix", [("stable", "latest"), ("nightly", "tags/nightly")])
async def test_release_check_uses_fixed_repository(monkeypatch, channel, suffix):
    async def fetch(session, url, headers):
        assert url == f"https://api.github.com/repos/MajoorWaldi/ComfyUI-Majoor-AssetsManager/releases/{suffix}"
        return {"tag_name": "v2.5.2", "published_at": "today", "body": "not exposed"}

    monkeypatch.setattr(releases, "_fetch_github_json", fetch)
    app = web.Application()
    routes = web.RouteTableDef()
    releases.register_releases_routes(routes)
    app.add_routes(routes)
    req = make_mocked_request("GET", f"/mjr/am/releases?channel={channel}&owner=other", app=app)
    match = await app.router.resolve(req)
    response = await match.handler(req)
    payload = json.loads(response.text)
    assert payload["ok"]
    assert payload["data"]["tag_name"] == "v2.5.2"
    assert "body" not in payload["data"]


@pytest.mark.asyncio
async def test_github_boundary_rejects_other_hosts_and_redirects():
    class Response:
        status = 302

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

    class Session:
        def get(self, url, **kwargs):
            assert kwargs["allow_redirects"] is False
            return Response()

    with pytest.raises(ValueError):
        await releases._fetch_github_json(Session(), "https://other.example/release", {})
    with pytest.raises(RuntimeError):
        await releases._fetch_github_json(Session(), "https://api.github.com/release", {})
