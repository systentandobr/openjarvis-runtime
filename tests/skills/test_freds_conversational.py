"""Native skill discovery/invocation with no engine, microphone or external work."""
from pathlib import Path
import tomllib
from xml.etree import ElementTree

from openjarvis.core.config import MemoryFilesConfig, SystemPromptConfig
from openjarvis.core.events import EventBus
from openjarvis.prompt.builder import SystemPromptBuilder
from openjarvis.skills.manager import SkillManager

ROOT = Path(__file__).resolve().parents[2]


class NoExecution:
    def execute(self, *args, **kwargs):
        raise AssertionError("Loading conversational instructions must not execute tools")


def test_workspace_skill_is_discoverable_and_instruction_only(tmp_path):
    manager = SkillManager(EventBus(), overlay_dir=tmp_path / "overlays")
    manager.discover(paths=[ROOT / "skills"])
    catalog = ElementTree.fromstring(manager.get_catalog_xml())
    assert catalog.find("./skill[@name='freds-conversational']") is not None
    manifest = manager.resolve("freds-conversational")
    assert not manifest.steps
    assert not manifest.required_capabilities
    tools = manager.get_skill_tools(tool_executor=NoExecution())
    tool = next(t for t in tools if t.spec.name == "skill_freds-conversational")
    result = tool.execute(task="Me ajude a acompanhar o escritório")
    assert result.success
    assert result.content == manifest.markdown_content
    assert result.metadata["skill_kind"] == "instructional"
    assert result.metadata["steps"] == 0


def test_example_prefix_and_skill_catalog_compose_without_user_memory(tmp_path):
    with (ROOT / "configs" / "freds-conversational.example.toml").open("rb") as stream:
        fragment = tomllib.load(stream)
    manager = SkillManager(EventBus(), overlay_dir=tmp_path / "overlays")
    manager.discover(paths=[ROOT / fragment["skills"]["skills_dir"]])
    builder = SystemPromptBuilder(
        agent_template="Freds",
        memory_files_config=MemoryFilesConfig(soul_path="", memory_path="", user_path=""),
        system_prompt_config=SystemPromptConfig(**fragment["system_prompt"]),
        skill_catalog_xml=manager.get_catalog_xml(),
    )
    sections = builder.sections()
    assert any(section.source == "skill_catalog_xml" for section in sections)
    assert fragment["system_prompt"]["prefix"].strip() in builder.build()
