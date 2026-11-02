"""Tests for resolve_mcp_servers in openjarvis.core.config."""

from pathlib import Path

import pytest

from openjarvis.core.config import resolve_mcp_servers


class TestResolveMcpServers:
    """Unit tests for resolve_mcp_servers."""

    def test_inline_json_backwards_compat(self, tmp_path: Path) -> None:
        raw = '[{"name": "test", "url": "http://localhost"}]'
        result = resolve_mcp_servers(raw, tmp_path)
        assert result == [{"name": "test", "url": "http://localhost"}]

    def test_empty_string(self, tmp_path: Path) -> None:
        assert resolve_mcp_servers("", tmp_path) == []

    def test_single_object_inline(self, tmp_path: Path) -> None:
        raw = '{"name": "ha", "url": "http://localhost"}'
        result = resolve_mcp_servers(raw, tmp_path)
        assert result == [{"name": "ha", "url": "http://localhost"}]

    def test_non_list_result_raises(self, tmp_path: Path) -> None:
        string_file = tmp_path / "bad.json"
        string_file.write_text('"just a string"', encoding="utf-8")

        with pytest.raises(ValueError, match="must be a JSON array or object"):
            resolve_mcp_servers("bad.json", tmp_path)

    def test_file_path_loads_array(self, tmp_path: Path) -> None:
        servers_file = tmp_path / "servers.json"
        servers_file.write_text(
            '[{"name": "s1", "url": "http://a"}, {"name": "s2", "url": "http://b"}]',
            encoding="utf-8",
        )

        result = resolve_mcp_servers("servers.json", tmp_path)
        assert len(result) == 2
        assert result[0]["name"] == "s1"
        assert result[1]["name"] == "s2"

    def test_legacy_json_string_entries_are_normalized(self, tmp_path: Path) -> None:
        raw = '["{\\"name\\": \\"legacy\\", \\"url\\": \\"http://a\\"}"]'

        assert resolve_mcp_servers(raw, tmp_path) == [
            {"name": "legacy", "url": "http://a"}
        ]

    @pytest.mark.parametrize("raw", ["[1]", "[null]", '["not-json"]'])
    def test_non_object_entries_are_rejected(self, raw: str, tmp_path: Path) -> None:
        with pytest.raises(ValueError, match="entry 0"):
            resolve_mcp_servers(raw, tmp_path)


def test_token_env_is_resolved_without_mutating_source(tmp_path, monkeypatch):
    monkeypatch.setenv('FREDS_MCP_TOKEN', 'private-test-token')
    raw = '[{"name":"freds","url":"https://example.com/mcp","token_env":"FREDS_MCP_TOKEN"}]'
    result = resolve_mcp_servers(raw, tmp_path)
    assert result[0]['token'] == 'private-test-token'
    assert 'token_env' not in result[0]
    assert 'private-test-token' not in raw


def test_missing_token_env_fails_closed(tmp_path, monkeypatch):
    monkeypatch.delenv('FREDS_MCP_TOKEN', raising=False)
    with pytest.raises(ValueError, match='requires environment variable'):
        resolve_mcp_servers('[{"token_env":"FREDS_MCP_TOKEN"}]', tmp_path)


def test_token_env_cannot_fall_back_to_inline_token(tmp_path):
    with pytest.raises(ValueError, match='cannot combine'):
        resolve_mcp_servers('[{"token_env":"MISSING","token":"secret"}]', tmp_path)
