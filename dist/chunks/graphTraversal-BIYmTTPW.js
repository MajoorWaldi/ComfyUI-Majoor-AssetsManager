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
function i(e) {
	return !e || typeof e != "object" ? !1 : e.isRootGraph === !0 || e.rootGraph === e;
}
function a(e, t = e?.graph) {
	let n = String(e?.id ?? e?.ID ?? "").trim();
	if (!n) return "";
	let r = i(t) ? "" : String(t?.id ?? "").trim();
	return r ? `${r}:${n}` : n;
}
function o(e, t, n, r) {
	!n || typeof n != "object" || t.has(n) || (t.add(n), e.push({
		graph: n,
		label: r
	}));
}
function s(e) {
	if (!e || typeof e != "object") return [];
	let t = e.subgraphs ?? e.definitions?.subgraphs ?? e.workflow?.definitions?.subgraphs;
	return t ? t instanceof Map ? Array.from(t.values()).filter(Boolean) : Array.isArray(t) ? t.filter(Boolean) : typeof t == "object" ? Object.values(t).filter(Boolean) : [] : [];
}
function c(e) {
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
function l(e) {
	let t = typeof e?.serialize == "function" ? e.serialize() : null;
	return (Array.isArray(t?.definitions?.subgraphs) ? t.definitions.subgraphs : []).map((e, t) => ({
		graph: e,
		label: `Subgraph ${r(e, String(e?.id ?? t + 1))}`
	}));
}
function u(n) {
	let i = n?.graph || n?.canvas || n?.rootGraph ? e(n) : n, a = [], u = /* @__PURE__ */ new Set(), d = [];
	for (o(d, u, i, "Workflow"); d.length;) {
		let e = d.pop();
		if (e) {
			a.push(e);
			for (let t of s(e.graph)) o(d, u, t, `${e.label} / ${r(t, "Subgraph")}`);
			for (let n of t(e.graph)) for (let t of c(n)) o(d, u, t, `${e.label} / ${String(n?.title || n?.type || "Subgraph").trim()}`);
		}
	}
	if (a.length <= 1) for (let e of l(i)) o(a, u, e.graph, e.label);
	return a;
}
function d(e, n) {
	for (let r of u(e)) for (let [e, i] of t(r.graph).entries()) {
		let t = String(i?.id ?? i?.ID ?? e).trim() || String(e);
		n({
			node: i,
			graph: r.graph,
			label: r.label,
			locatorId: a(i, r.graph),
			qualifiedId: `${r.label}::${t}`
		});
	}
}
function f(n, r) {
	let i = String(r ?? "").trim();
	if (!i) return null;
	let a = n?.graph || n?.canvas || n?.rootGraph ? e(n) : n;
	if (!a) return null;
	let o = (e, n) => {
		if (!e) return null;
		let r = /^-?\d+$/.test(n) ? Number(n) : n;
		try {
			let t = e.getNodeById?.(r) ?? e.getNodeById?.(n);
			if (t) return t;
		} catch {}
		return t(e).find((e) => String(e?.id ?? e?.ID ?? "") === n) ?? null;
	}, s = i.split(":").filter(Boolean);
	if (s.length > 1) {
		let e = a, t = !0;
		for (let n of s.slice(0, -1)) {
			let r = o(e, n), i = r?.subgraph ?? r?._subgraph ?? null;
			if (!i) {
				t = !1;
				break;
			}
			e = i;
		}
		if (t) {
			let t = o(e, s[s.length - 1]);
			if (t) return t;
		}
	}
	let c = null;
	if (d(a, (e) => {
		!c && e.locatorId === i && (c = e.node);
	}), c) return c;
	let l = o(a, i);
	if (l) return l;
	let u = [];
	return d(a, ({ node: e, graph: t }) => {
		t !== a && String(e?.id ?? e?.ID ?? "") === i && u.push(e);
	}), u.length === 1 ? u[0] : null;
}
//#endregion
export { e as a, t as i, f as n, c as o, n as r, d as s, u as t };
