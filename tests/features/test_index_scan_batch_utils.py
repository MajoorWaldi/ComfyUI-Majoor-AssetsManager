from mjr_am_backend.features.index.scan_batch_utils import should_skip_by_journal


def test_should_skip_by_journal_false_when_not_incremental() -> None:
    assert not should_skip_by_journal(
        incremental=False,
        journal_state_hash="abc",
        state_hash="abc",
        fast=True,
        existing_id=1,
        has_rich_meta_set={1},
    )


def test_should_skip_by_journal_false_when_hash_mismatch() -> None:
    assert not should_skip_by_journal(
        incremental=True,
        journal_state_hash="abc",
        state_hash="def",
        fast=True,
        existing_id=1,
        has_rich_meta_set={1},
    )


def test_should_skip_by_journal_true_in_fast_mode_with_matching_hash() -> None:
    assert should_skip_by_journal(
        incremental=True,
        journal_state_hash="abc",
        state_hash="abc",
        fast=True,
        existing_id=0,
        has_rich_meta_set=set(),
    )


def test_should_skip_by_journal_true_when_existing_has_rich_metadata() -> None:
    assert should_skip_by_journal(
        incremental=True,
        journal_state_hash="abc",
        state_hash="abc",
        fast=False,
        existing_id=42,
        has_rich_meta_set={42},
    )


def test_should_skip_by_journal_false_when_not_fast_and_no_rich_metadata() -> None:
    assert not should_skip_by_journal(
        incremental=True,
        journal_state_hash="abc",
        state_hash="abc",
        fast=False,
        existing_id=42,
        has_rich_meta_set=set(),
    )
