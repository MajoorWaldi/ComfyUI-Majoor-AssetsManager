//#region ui/app/graphTraversal.ts
function e(e = null) {
	return e?.rootGraph ?? e?.graph?.rootGraph ?? e?.graph ?? e?.canvas?.graph ?? null;
}
function t(e) {
	if (!e || typeof e != "object") return [];
	if (Array.isArray(e.nodes)) return e.nodes.filter(Boolean);
	if (Array.isArray(e._nodes)) return e._nodes.filter(Boolean);
	let t = e._nodes_by_id ?? e.nodes_by_id ?? null;
	return t instanceof Map ? Array.from(t.values()).filter(Boolean) : t && typeof t == "object" ? Object.values(t).filter(Boolean) : [];
}
function n(e) {
	return e?.links ?? e?._links ?? null;
}
function r(e, t) {
	return String(e?.name ?? e?.title ?? e?.id ?? t).trim() || t;
}
function i(e, t, n, r) {
	!n || typeof n != "object" || t.has(n) || (t.add(n), e.push({
		graph: n,
		label: r
	}));
}
function a(e) {
	if (!e || typeof e != "object") return [];
	let t = e.subgraphs ?? e.definitions?.subgraphs ?? e.workflow?.definitions?.subgraphs;
	return t ? t instanceof Map ? Array.from(t.values()).filter(Boolean) : Array.isArray(t) ? t.filter(Boolean) : typeof t == "object" ? Object.values(t).filter(Boolean) : [] : [];
}
function o(e) {
	let n = [
		e?.subgraph,
		e?._subgraph,
		e?.subgraph?.graph,
		e?.subgraph?.lgraph,
		e?.properties?.subgraph,
		e?.subgraph_instance,
		e?.subgraph_instance?.graph,
		e?.inner_graph,
		e?.subgraph_graph
	].filter((e) => !!(e && typeof e == "object" && t(e).length > 0));
	return Array.isArray(e?.nodes) && e.nodes.length > 0 && e.nodes !== e?.graph?.nodes && n.push({ nodes: e.nodes }), n;
}
function s(e) {
	let t = typeof e?.serialize == "function" ? e.serialize() : null;
	return (Array.isArray(t?.definitions?.subgraphs) ? t.definitions.subgraphs : []).map((e, t) => ({
		graph: e,
		label: `Subgraph ${r(e, String(e?.id ?? t + 1))}`
	}));
}
function c(n) {
	let c = n?.graph || n?.canvas || n?.rootGraph ? e(n) : n, l = [], u = /* @__PURE__ */ new Set(), d = [];
	for (i(d, u, c, "Workflow"); d.length;) {
		let e = d.pop();
		if (e) {
			l.push(e);
			for (let t of a(e.graph)) i(d, u, t, `${e.label} / ${r(t, "Subgraph")}`);
			for (let n of t(e.graph)) for (let t of o(n)) i(d, u, t, `${e.label} / ${String(n?.title || n?.type || "Subgraph").trim()}`);
		}
	}
	for (let e of s(c)) i(l, u, e.graph, e.label);
	return l;
}
function l(e, n) {
	for (let r of c(e)) for (let e of t(r.graph)) n({
		node: e,
		graph: r.graph,
		label: r.label
	});
}
function u(e, t) {
	let n = String(t ?? "");
	if (!n) return null;
	let r = null;
	return l(e, ({ node: e }) => {
		!r && String(e?.id ?? "") === n && (r = e);
	}), r;
}
//#endregion
export { e as a, t as i, u as n, o, n as r, l as s, c as t };
