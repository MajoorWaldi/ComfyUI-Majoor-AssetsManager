//#region ui/components/sidebar/parsers/a1111ParamsParser.ts
function e(e) {
	if (!e || typeof e != "string") return null;
	let t = {}, n = e.split(/\nNegative prompt:\s*/i);
	if (n[0] && (t.prompt = n[0].trim()), n[1]) {
		let e = n[1].match(/^(.*?)\n?(Steps:.*)$/s);
		if (e) {
			t.negative_prompt = e[1].trim();
			let n = e[2], r = (e) => {
				let t = n.match(e);
				return t ? t[1].trim() : null;
			};
			t.steps = r(/Steps:\s*(\d+)/i), t.sampler = r(/Sampler:\s*([^,\n]+)/i), t.cfg = r(/CFG scale:\s*([\d.]+)/i), t.seed = r(/Seed:\s*(\d+)/i), t.width = r(/Size:\s*(\d+)x\d+/i), t.height = r(/Size:\s*\d+x(\d+)/i), t.model = r(/Model:\s*([^,\n]+)/i), t.denoising = r(/Denoising strength:\s*([\d.]+)/i), t.clip_skip = r(/Clip skip:\s*(\d+)/i);
		} else t.negative_prompt = n[1].trim();
	}
	return Object.keys(t).length > 0 ? t : null;
}
//#endregion
//#region ui/components/sidebar/parsers/comfyWorkflowParser.ts
function t(e) {
	try {
		let t = Object.entries(e || {});
		if (!t.length) return !1;
		let n = 0;
		for (let [, e] of t.slice(0, 50)) if (!(!e || typeof e != "object") && (e.inputs && typeof e.inputs == "object" && (n += 1), n >= 2)) return !0;
		return !1;
	} catch {
		return !1;
	}
}
function n(e) {
	if (!e || typeof e != "object") return null;
	let t = {}, n = [];
	for (let i of r(e)) {
		if (!i || typeof i != "object") continue;
		let e = s(i);
		if (!e || typeof e != "object") continue;
		let r = String(i?.class_type || i?.type || "").toLowerCase(), a = String(i?.title || i?._meta?.title || "").toLowerCase(), o = (e, n) => {
			if (t[e] || typeof n != "string") return;
			let r = n.trim();
			r && (/^[\d\s.,+-]+$/.test(r) || (t[e] = r));
		};
		if ((r.includes("cliptextencode") || r.includes("clip_text_encode") || a.includes("clip text encode")) && typeof e.text == "string") {
			let t = a.includes("negative");
			a.includes("positive") || a.includes("(prompt)") || a.includes("prompt"), o(t ? "negative_prompt" : "prompt", e.text);
		}
		if (o("negative_prompt", e.negative_prompt), o("negative_prompt", e.negative), !t.prompt && typeof e.text == "string") {
			let t = e.text.trim();
			(r.includes("prompt") || r.includes("encode") || r.includes("positive") || r.includes("negative") || a.includes("prompt") || a.includes("positive") || a.includes("negative")) && t.length >= 12 && /[a-zA-Z]/.test(t) && o("prompt", t);
		}
		e.seed !== void 0 && t.seed === void 0 && (t.seed = e.seed), e.steps !== void 0 && t.steps === void 0 && (t.steps = e.steps), e.cfg !== void 0 && t.cfg === void 0 && (t.cfg = e.cfg), e.sampler_name && !t.sampler && (t.sampler = e.sampler_name), e.scheduler && !t.scheduler && (t.scheduler = e.scheduler), e.denoise !== void 0 && t.denoise === void 0 && (t.denoise = e.denoise), e.width !== void 0 && t.width === void 0 && (t.width = e.width), e.height !== void 0 && t.height === void 0 && (t.height = e.height);
		let c = (e, n) => {
			if (t[e] || typeof n != "string") return;
			let r = n.trim();
			r && (t[e] = r);
		}, l = [
			e.ckpt_name,
			e.checkpoint,
			e.checkpoint_name,
			e.model_name,
			e.model
		];
		for (let e of l) t.model || c("model", e);
		if (c("vae", e.vae_name || e.vae), c("clip", e.clip_name || e.clip), c("unet", e.unet_name || e.unet), c("diffusion", e.diffusion_name || e.diffusion_model || e.diffusion), r.includes("lora") || r.includes("loraloader")) {
			let t = e.lora_name || e.lora || e.name || null, r = e.strength_model ?? e.strength ?? e.weight ?? e.lora_strength ?? null;
			t && n.push({
				name: t,
				weight: r
			});
		}
	}
	return n.length && (t.loras = n), Object.keys(t).length > 0 ? t : null;
}
function r(e, n = /* @__PURE__ */ new WeakSet()) {
	if (!e || typeof e != "object" || n.has(e)) return [];
	n.add(e);
	let s = [], c = (e.prompt && typeof e.prompt == "object" ? e.prompt : null) || (t(e) ? e : null);
	c && s.push(...Object.values(c));
	for (let t of i(e)) {
		let e = Array.isArray(t?.nodes) ? t.nodes.filter(Boolean) : [];
		s.push(...e);
		for (let t of e) for (let e of o(t)) s.push(...r(e, n));
		for (let e of a(t)) s.push(...r(e, n));
	}
	return s;
}
function i(e) {
	if (!e || typeof e != "object") return [];
	let t = [], n = (e) => {
		e && typeof e == "object" && Array.isArray(e.nodes) && t.push(e);
	};
	n(e);
	for (let t of [
		"workflow",
		"Workflow",
		"template",
		"Template",
		"subgraph",
		"Subgraph",
		"graph",
		"lgraph"
	]) n(e?.[t]);
	return t;
}
function a(e) {
	return [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	].filter((e) => e && typeof e == "object" && Array.isArray(e.nodes));
}
function o(e) {
	return [
		e?.subgraph,
		e?._subgraph,
		e?.subgraph?.graph,
		e?.subgraph?.lgraph,
		e?.properties?.subgraph,
		e?.subgraph_instance,
		e?.subgraph_instance?.graph,
		e?.inner_graph,
		e?.subgraph_graph
	].filter((e) => e && typeof e == "object" && Array.isArray(e.nodes));
}
function s(e) {
	let t = e?.inputs;
	if (t && typeof t == "object" && !Array.isArray(t)) return t;
	let n = e?.widgets_values, r = {};
	if (n && typeof n == "object" && !Array.isArray(n)) {
		for (let [e, t] of Object.entries(n)) r[e] = t;
		return r;
	}
	if (!Array.isArray(t) || !Array.isArray(n)) return null;
	let i = t.filter(c);
	for (let e = 0; e < n.length; e += 1) {
		let a = i[e] || t[e] || null, o = String(a?.label || a?.localized_name || a?.name || a?.widget?.name || a?.widget?.label || "").trim();
		r[o || `param_${e + 1}`] = n[e];
	}
	return r;
}
function c(e) {
	if (!e || typeof e != "object") return !1;
	if (e.widget === !0 || e.widget && typeof e.widget == "object" || typeof e.widget == "string" && e.widget.trim()) return !0;
	if (e.link != null) return !1;
	let t = String(e.type || "").trim().toUpperCase();
	return [
		"INT",
		"FLOAT",
		"STRING",
		"BOOLEAN",
		"BOOL",
		"COMBO",
		"ENUM"
	].includes(t);
}
//#endregion
//#region ui/components/sidebar/parsers/geninfoParser.ts
var l = /^(?:[a-z]:[\\/]|[\\/]{1,2}|\.{1,2}[\\/]|~[\\/]).+?[\\/][^\\/\n]+\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$/i, u = /^(?!.*[,;])(?!.*\b(?:cinematic|portrait|landscape|lighting|style|detailed|masterpiece|photo|render)\b).*(?:[\\/][^\\/\n]+){2,}\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$/i;
function d(r) {
	if (!r) return null;
	if (typeof r == "object") {
		let i = r.geninfo || r.GenInfo || r.generation || null;
		if (i && typeof i == "object") {
			let e = {}, t = /* @__PURE__ */ new Set(), n = (e, n) => {
				if (!(!n || typeof n != "object") && !(n.confidence !== "override" && n.source !== "majoor_geninfo")) for (let n of Array.isArray(e) ? e : [e]) t.add(n);
			}, r = i.positive?.value ?? i.positive?.text ?? null, a = i.negative?.value ?? i.negative?.text ?? null;
			typeof r == "string" && r.trim() && (e.prompt = r), typeof a == "string" && a.trim() && (e.negative_prompt = a), n("prompt", i.positive), n("negative_prompt", i.negative);
			let o = i.checkpoint?.name ?? i.checkpoint ?? null;
			typeof o == "string" && o.trim() && (e.model = o), n(["model", "checkpoint"], i.checkpoint);
			let s = i.clip?.name ?? i.clip ?? null;
			typeof s == "string" && s.trim() && (e.clip = s), n("clip", i.clip);
			let c = i.vae?.name ?? i.vae ?? null;
			typeof c == "string" && c.trim() && (e.vae = c), n("vae", i.vae);
			let l = i.models;
			l && typeof l == "object" && (e.models = l);
			let u = Array.isArray(i.model_groups) ? i.model_groups : null;
			u && u.length && (e.model_groups = u);
			let d = Array.isArray(i.loras) ? i.loras : null;
			d && (e.loras = d), d?.some((e) => e?.confidence === "override" || e?.source === "majoor_geninfo") && t.add("loras");
			let f = i.sampler?.name ?? i.sampler ?? null;
			typeof f == "string" && f.trim() && (e.sampler = f), n("sampler", i.sampler);
			let p = i.scheduler?.name ?? i.scheduler ?? null;
			typeof p == "string" && p.trim() && (e.scheduler = p), n("scheduler", i.scheduler);
			let m = i.steps?.value ?? i.steps ?? null;
			m != null && (e.steps = m), n("steps", i.steps);
			let h = i.cfg?.value ?? i.cfg ?? null;
			h != null && (e.cfg = h), n(["cfg", "cfg_scale"], i.cfg);
			let g = i.cfg_high_noise?.value ?? i.cfg_high_noise ?? null;
			g != null && (e.cfg_high_noise = g);
			let _ = i.cfg_low_noise?.value ?? i.cfg_low_noise ?? null;
			_ != null && (e.cfg_low_noise = _);
			let v = i.seed?.value ?? i.seed ?? null;
			v != null && (e.seed = v), n("seed", i.seed);
			let y = i.voice?.name ?? i.voice?.value ?? i.voice ?? null;
			y != null && String(y).trim() && (e.voice = String(y).trim());
			let b = i.language?.value ?? i.language ?? null;
			b != null && String(b).trim() && (e.language = String(b).trim());
			let x = i.temperature?.value ?? i.temperature ?? null;
			x != null && (e.temperature = x);
			let S = i.top_k?.value ?? i.top_k ?? null;
			S != null && (e.top_k = S);
			let C = i.top_p?.value ?? i.top_p ?? null;
			C != null && (e.top_p = C);
			let w = i.repetition_penalty?.value ?? i.repetition_penalty ?? null;
			w != null && (e.repetition_penalty = w);
			let T = i.max_new_tokens?.value ?? i.max_new_tokens ?? null;
			T != null && (e.max_new_tokens = T);
			let E = i.device?.value ?? i.device ?? null;
			E != null && String(E).trim() && (e.device = String(E).trim());
			let D = i.voice_preset?.value ?? i.voice_preset ?? null;
			D != null && String(D).trim() && (e.voice_preset = String(D).trim());
			let O = i.instruct?.value ?? i.instruct ?? null;
			O != null && String(O).trim() && (e.instruct = String(O).trim());
			let k = i.dtype?.value ?? i.dtype ?? null;
			k != null && String(k).trim() && (e.dtype = String(k).trim());
			let A = i.attn_implementation?.value ?? i.attn_implementation ?? null;
			A != null && String(A).trim() && (e.attn_implementation = String(A).trim());
			let j = i.x_vector_only_mode?.value ?? i.x_vector_only_mode ?? null;
			j != null && (e.x_vector_only_mode = j);
			let M = i.use_torch_compile?.value ?? i.use_torch_compile ?? null;
			M != null && (e.use_torch_compile = M);
			let N = i.use_cuda_graphs?.value ?? i.use_cuda_graphs ?? null;
			N != null && (e.use_cuda_graphs = N);
			let P = i.compile_mode?.value ?? i.compile_mode ?? null;
			P != null && String(P).trim() && (e.compile_mode = String(P).trim());
			let F = i.enable_chunking?.value ?? i.enable_chunking ?? null;
			F != null && (e.enable_chunking = F);
			let I = i.max_chars_per_chunk?.value ?? i.max_chars_per_chunk ?? null;
			I != null && (e.max_chars_per_chunk = I);
			let L = i.chunk_combination_method?.value ?? i.chunk_combination_method ?? null;
			L != null && String(L).trim() && (e.chunk_combination_method = String(L).trim());
			let R = i.silence_between_chunks_ms?.value ?? i.silence_between_chunks_ms ?? null;
			R != null && (e.silence_between_chunks_ms = R);
			let z = i.enable_audio_cache?.value ?? i.enable_audio_cache ?? null;
			z != null && (e.enable_audio_cache = z);
			let B = i.batch_size?.value ?? i.batch_size ?? null;
			B != null && (e.batch_size = B);
			let V = i.denoise?.value ?? i.denoise ?? null;
			V != null && (e.denoise = V), n(["denoise", "denoising"], i.denoise);
			let H = i.clip_skip?.value ?? i.clip_skip ?? i.clipSkip ?? null;
			H != null && (e.clip_skip = H);
			let U = i.inputs;
			Array.isArray(U) && (e.inputs = U);
			let W = i.lyrics?.value ?? i.lyrics ?? null;
			typeof W == "string" && W.trim() && (e.lyrics = W);
			let G = i.lyrics_strength?.value ?? i.lyrics_strength ?? null;
			G != null && (e.lyrics_strength = G);
			let K = i.notes?.value ?? i.workflow_notes?.value ?? i.notes ?? i.workflow_notes ?? null;
			typeof K == "string" && K.trim() && (e.workflow_notes = K.trim()), n(["workflow_notes", "notes"], i.notes ?? i.workflow_notes), Array.isArray(i.custom_info) && (e.custom_info = i.custom_info), Array.isArray(i.custom_info) && i.engine?.mode === "override" && t.add("custom_info"), Array.isArray(i.all_positive_prompts) && i.all_positive_prompts.length > 1 && (e.all_positive_prompts = i.all_positive_prompts), Array.isArray(i.all_negative_prompts) && i.all_negative_prompts.length > 1 && (e.all_negative_prompts = i.all_negative_prompts), Array.isArray(i.all_samplers) && i.all_samplers.length > 1 && (e.all_samplers = i.all_samplers), Array.isArray(i.chained_passes) && i.chained_passes.length > 1 && (e.chained_passes = i.chained_passes), Array.isArray(i.all_checkpoints) && i.all_checkpoints.length > 1 && (e.all_checkpoints = i.all_checkpoints);
			let q = i.size || null;
			if (q && typeof q == "object" && (q.width !== void 0 && (e.width = q.width), q.height !== void 0 && (e.height = q.height)), i.engine && typeof i.engine == "object" && (e.engine = i.engine, (i.engine.mode === "override" || i.engine.parser_version === "geninfo-override-v1" || i.engine.source === "majoor_geninfo") && (e.is_override = !0)), t.size && (e.override_fields = Array.from(t)), Object.keys(e).length) return e;
		}
		if ([
			"prompt",
			"negative_prompt",
			"negativePrompt",
			"steps",
			"sampler",
			"sampler_name",
			"cfg",
			"cfg_scale",
			"seed",
			"width",
			"height"
		].some((e) => Object.prototype.hasOwnProperty.call(r, e))) return r;
		let a = n(r);
		if (a) return a;
		if (t(r)) {
			let e = n({ prompt: r });
			if (e) return e;
		}
		let o = r.parameters || r["PNG:Parameters"] || r["EXIF:UserComment"] || r.UserComment || r.ImageDescription || null;
		if (typeof o == "string") {
			let t = e(o);
			if (t) return t;
		}
		let s = r.workflow || r.Workflow || r.comfy || r.comfyui || r.ComfyUI || null;
		if (s && typeof s == "object") {
			let e = n(s);
			if (e) return e;
		}
		return r;
	}
	if (typeof r == "string") {
		let t = r.trim();
		if (!t) return null;
		let n = e(t);
		if (n) return n;
		if (t.startsWith("{") && t.endsWith("}") || t.startsWith("[") && t.endsWith("]")) try {
			return d(JSON.parse(t));
		} catch {
			return null;
		}
		return { prompt: t };
	}
	return null;
}
function f(e) {
	let t = typeof e == "string" ? e.trim() : "";
	return !t || t.includes("\n") ? !1 : l.test(t) || u.test(t);
}
function p(e) {
	let t = typeof e == "string" ? e.trim() : "";
	return t ? f(t) ? "" : t : "";
}
function m(e, t) {
	let n = p(e), r = p(t);
	if (n) {
		let e = /(?:^|\n)\s*Negative prompt:\s*/i;
		if (e.test(n)) {
			let t = n.split(e), i = (t[0] || "").trim(), a = t.slice(1).join("Negative prompt:").trim(), o = a.search(/\n\s*Steps:\s*\d+/i), s = (o >= 0 ? a.slice(0, o) : a).trim();
			i && (n = p(i)), !r && s && (r = p(s));
		}
	}
	return n && r && n.trim() === r.trim() && (r = ""), {
		positive: n,
		negative: r
	};
}
function h(e) {
	if (!e) return "";
	let t = String(e).trim().replace(/\\/g, "/");
	return (t.split("/").pop() || t).replace(/\.(safetensors|ckpt|pt|pth|bin|gguf|json)$/i, "");
}
function g(e) {
	if (!e) return "";
	if (typeof e == "string") return h(e);
	let t = h(e.name || e.lora_name || "");
	if (!t) return "";
	let n = e.weight ?? e.strength ?? null, r = e.strength_model ?? null, i = e.strength_clip ?? null;
	if (r !== null || i !== null) {
		let e = [];
		return r != null && e.push(`m=${r}`), i != null && e.push(`c=${i}`), e.length ? `${t} (${e.join(", ")})` : t;
	}
	return n == null ? t : `${t} (${n})`;
}
function _(e) {
	let t = String(e || "").trim().toLowerCase();
	return t ? t === "img2vid" ? "Image-to-Video" : t === "txt2vid" ? "Text-to-Video" : t === "img2img" ? "Image-to-Image" : t === "txt2img" ? "Text-to-Image" : t === "vid2vid" ? "Video-to-Video" : t === "tts" ? "Text-to-Speech" : t === "audio" ? "Audio" : t.split(/[_\s-]+/).filter(Boolean).map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(" ") : "";
}
function v(e) {
	let t = String(e || "").trim().toLowerCase();
	if (!t || t === "api") return "";
	let n = {
		happy_horse: "Happy Horse",
		google_gemini: "Google Gemini",
		google_veo: "Google Veo",
		openai: "OpenAI",
		anthropic: "Anthropic",
		black_forest_labs: "Black Forest Labs",
		stability_ai: "Stability AI",
		alibaba_wan: "Alibaba Wan",
		kling_ai: "Kling AI",
		luma_dream_machine: "Luma Dream Machine",
		minimax_hailuo: "MiniMax Hailuo",
		xai_grok: "xAI Grok",
		ltxv_api: "LTXV API",
		eleven_labs: "ElevenLabs",
		bytedance_seedance: "ByteDance Seedance"
	};
	return n[t] ? n[t] : t.split(/[_\s-]+/).filter(Boolean).map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(" ");
}
function y(e) {
	let t = e?.engine && typeof e.engine == "object" ? e.engine : null, n = String(t?.type || "").trim(), r = String(t?.sampler_mode || "").trim().toLowerCase(), i = _(n) || n, a = v(t?.api_provider), o = r === "api" ? `API ${i || "Workflow"}` : i;
	return {
		workflowType: n,
		workflowLabel: String(o || n).trim(),
		workflowBadge: a
	};
}
//#endregion
export { m as a, d as i, g as n, p as o, h as r, y as t };
