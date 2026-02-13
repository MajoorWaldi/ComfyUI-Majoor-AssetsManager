from pathlib import Path
from queue import Queue

from mjr_am_backend.features.index.scanner import IndexScanner


def test_drain_walk_queue_reads_bounded_batch():
    q: "Queue[Path | None]" = Queue()
    p1 = Path("a.png")
    p2 = Path("b.png")
    q.put(p1)
    q.put(p2)
    q.put(None)

    items = IndexScanner._drain_walk_queue(q, 2)
    assert items == [p1, p2]

    # Remaining sentinel should still be available for the next pull.
    tail = IndexScanner._drain_walk_queue(q, 1)
    assert tail == [None]

