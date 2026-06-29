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
	let t = {}, n = [], r = o(e), l = [];
	for (let i of g(e)) {
		if (!i || typeof i != "object") continue;
		let e = b(i);
		if (!e || typeof e != "object") continue;
		let a = String(i?.class_type || i?.type || "").toLowerCase(), o = String(i?.title || i?._meta?.title || "").toLowerCase(), u = (e, n) => {
			if (t[e] || typeof n != "string") return;
			let r = n.trim();
			r && (/^[\d\s.,+-]+$/.test(r) || (t[e] = r));
		};
		if ((a.includes("cliptextencode") || a.includes("clip_text_encode") || o.includes("clip text encode")) && typeof e.text == "string") {
			let t = o.includes("negative");
			o.includes("positive") || o.includes("(prompt)") || o.includes("prompt"), u(t ? "negative_prompt" : "prompt", e.text);
		}
		if (u("negative_prompt", e.negative_prompt), u("negative_prompt", e.negative), !t.prompt && typeof e.text == "string") {
			let t = e.text.trim();
			(a.includes("prompt") || a.includes("encode") || a.includes("positive") || a.includes("negative") || o.includes("prompt") || o.includes("positive") || o.includes("negative")) && t.length >= 12 && /[a-zA-Z]/.test(t) && u("prompt", t);
		}
		let d = p(e.seed, r), h = p(e.steps, r), g = p(e.cfg, r), _ = p(e.denoise, r);
		if (d !== void 0 && t.seed === void 0 && (t.seed = d), h !== void 0 && t.steps === void 0 && (t.steps = h), g !== void 0 && t.cfg === void 0 && (t.cfg = g), e.sampler_name && !t.sampler && (t.sampler = e.sampler_name), e.scheduler && !t.scheduler && (t.scheduler = e.scheduler), _ !== void 0 && t.denoise === void 0 && (t.denoise = _), s(a)) {
			let t = c(i, r), n = f(i, r), a = m(i?.inputs?.model, r) || m(n.model_link, r);
			l.push({
				sampler_name: e.sampler_name || n.sampler_name || e.sampler,
				scheduler: e.scheduler || n.scheduler,
				steps: p(e.steps, r) ?? n.steps,
				cfg: p(e.cfg, r) ?? n.cfg,
				denoise: p(e.denoise, r) ?? n.denoise,
				seed: p(e.seed ?? e.noise_seed, r) ?? n.seed,
				start_at_step: p(e.start_at_step, r),
				end_at_step: p(e.end_at_step, r),
				model: a,
				pass_stage: t
			});
		}
		e.width !== void 0 && t.width === void 0 && (t.width = e.width), e.height !== void 0 && t.height === void 0 && (t.height = e.height);
		let v = (e, n) => {
			if (t[e] || typeof n != "string") return;
			let r = n.trim();
			r && (t[e] = r);
		}, y = [
			e.ckpt_name,
			e.checkpoint,
			e.checkpoint_name,
			e.model_name,
			e.model
		];
		for (let e of y) !t.model && !a.includes("upscale") && v("model", e);
		a.includes("upscale") && v("upscaler", e.model_name || e.upscale_model || e.model), v("vae", e.vae_name || e.vae), v("clip", e.clip_name || e.clip);
		let x = e.unet_name || e.unet;
		if (typeof x == "string" && x.trim()) {
			let e = t.models && typeof t.models == "object" ? t.models : {};
			/high[_\s-]?noise/i.test(x) ? e.unet_high_noise = { name: x.trim() } : /low[_\s-]?noise/i.test(x) ? e.unet_low_noise = { name: x.trim() } : v("unet", x), Object.keys(e).length && (t.models = e);
		}
		if (v("diffusion", e.diffusion_name || e.diffusion_model || e.diffusion), a.includes("lora") || a.includes("loraloader")) {
			let t = e.lora_name || e.lora || e.name || null, r = e.strength_model ?? e.strength ?? e.weight ?? e.lora_strength ?? null;
			if (t) {
				let i = { name: t };
				e.strength_model === void 0 ? i.weight = r : i.strength_model = e.strength_model, n.push(i);
			}
		}
	}
	let u = a(n), d = a(l, i);
	return u.length && (t.loras = u), d.length > 1 && (t.all_samplers = d), Object.keys(t).length > 0 ? t : null;
}
function r(e) {
	if (!e || typeof e != "object") return JSON.stringify(e);
	let t = {};
	for (let n of Object.keys(e).sort()) {
		let r = e[n];
		r == null || r === "" || (t[n] = r);
	}
	return JSON.stringify(t);
}
function i(e) {
	return !e || typeof e != "object" ? r(e) : [
		e.sampler_name || e.sampler || "",
		e.scheduler || "",
		e.steps ?? "",
		e.cfg ?? "",
		e.denoise ?? "",
		e.seed ?? "",
		e.start_at_step ?? "",
		e.end_at_step ?? ""
	].map((e) => String(e)).join("::");
}
function a(e, t = r) {
	let n = /* @__PURE__ */ new Set(), i = [];
	for (let r of e) {
		let e = t(r);
		n.has(e) || (n.add(e), i.push(r));
	}
	return i;
}
function o(e) {
	if (!e || typeof e != "object") return null;
	let n = e.prompt;
	if (typeof n == "string" && n.trim()) try {
		n = JSON.parse(n);
	} catch {
		n = null;
	}
	let r = n && typeof n == "object" ? n : e;
	return t(r) ? r : null;
}
function s(e) {
	return e.includes("ksamplerselect") || e.includes("samplerselect") ? !1 : e.includes("ksampler") || e.includes("samplercustom") || e.includes("sampler_custom");
}
function c(e, t) {
	if (!t) return "";
	let n = m(e?.inputs?.model, t).toLowerCase();
	if (l(n)) return "high";
	if (u(n)) return "low";
	if (/\b(upscale|upscaler|_to_\d{3,5}|to[_-]?\d{3,5})\b/i.test(n)) return "upscale";
	let r = d(e, t).join(" ");
	if (l(r)) return "high";
	if (u(r)) return "low";
	if (/\b(pidconditioning|imageupscalewithmodel|ultimate|supir|esrgan|realesrgan)\b/i.test(r)) return "upscale";
	let i = d(e, t, "latent_image").join(" ");
	return /\b(inpaint|vaeencodeforinpaint|setlatentnoise mask|masktoimage)\b/i.test(i) ? "inpaint" : /\b(latentupscale|latentupsampler|imageupscalewithmodel|ultimate|supir|esrgan|realesrgan)\b/i.test(i) && !l(r) && !u(r) ? "upscale" : /\b(vaeencode|loadimage|imagebatch|imagetolatent)\b/i.test(i) ? "img2img" : /\b(emptylatentimage|emptysd3latentimage|emptychromaradiancelatentimage|empty latent)\b/i.test(i) ? "txt2img" : "";
}
function l(e) {
	return /(?:^|[^a-z0-9])high[_\s-]?noise(?:[^a-z0-9]|$)/i.test(String(e || ""));
}
function u(e) {
	return /(?:^|[^a-z0-9])low[_\s-]?noise(?:[^a-z0-9]|$)/i.test(String(e || ""));
}
function d(e, t, n) {
	let r = n ? [e?.inputs?.[n]] : Object.values(e?.inputs || {}), i = [], a = /* @__PURE__ */ new Set(), o = (e) => {
		let n = String(e?._mjrPromptId || e?.id || "");
		if (n && a.has(n)) return;
		n && a.add(n);
		let r = String(e?.class_type || e?.type || e?._meta?.title || "");
		r && i.push(r.toLowerCase());
		let s = e?.inputs && typeof e.inputs == "object" ? e.inputs : {};
		for (let e of Object.values(s)) {
			let n = h(e, t);
			n && o(n);
		}
	};
	for (let e of r) {
		let n = h(e, t);
		n && o(n);
	}
	return i;
}
function f(e, t) {
	let n = {};
	if (!t) return n;
	let r = h(e?.inputs?.noise, t)?.inputs || {};
	r.noise_seed !== void 0 && (n.seed = r.noise_seed), r.seed !== void 0 && (n.seed = r.seed);
	let i = h(e?.inputs?.guider, t)?.inputs || {};
	i.cfg !== void 0 && (n.cfg = i.cfg), i.model !== void 0 && (n.model_link = i.model);
	let a = h(e?.inputs?.sampler, t)?.inputs || {};
	a.sampler_name && (n.sampler_name = a.sampler_name);
	let o = h(e?.inputs?.sigmas, t)?.inputs || {};
	if (o.scheduler && (n.scheduler = o.scheduler), o.steps !== void 0 && (n.steps = p(o.steps, t)), o.denoise !== void 0 && (n.denoise = p(o.denoise, t)), n.steps === void 0 && typeof o.sigmas == "string") {
		let e = o.sigmas.split(",").map((e) => e.trim()).filter(Boolean).length;
		e > 1 && (n.steps = Math.max(1, e - 1));
	}
	return n;
}
function p(e, t, n = /* @__PURE__ */ new Set()) {
	if (e == null || !Array.isArray(e)) return e;
	if (!t) return;
	let r = h(e, t);
	if (!r) return;
	let i = String(r?._mjrPromptId || r?.id || e[0] || "");
	if (i && n.has(i)) return;
	i && n.add(i);
	let a = r?.inputs && typeof r.inputs == "object" ? r.inputs : {};
	if (String(r?.class_type || r?.type || "").toLowerCase().includes("switch")) return p(p(a.switch, t, n) ? a.on_true : a.on_false, t, n);
	if (Object.prototype.hasOwnProperty.call(a, "value")) return a.value;
	for (let e of [
		"number",
		"int",
		"float",
		"seed",
		"steps",
		"cfg"
	]) if (Object.prototype.hasOwnProperty.call(a, e)) return a[e];
}
function m(e, t) {
	if (!t) return "";
	let n = /* @__PURE__ */ new Set(), r = (e) => {
		let i = h(e, t);
		if (!i) return "";
		let a = String(i?._mjrPromptId || i?.id || "");
		if (a && n.has(a)) return "";
		a && n.add(a);
		let o = i?.inputs || {};
		if (String(i?.class_type || i?.type || "").toLowerCase().includes("switch")) {
			let e = r(p(o.switch, t) ? o.on_true : o.on_false);
			if (e) return e;
		}
		let s = o.unet_name || o.ckpt_name || o.model_name || o.model || o.checkpoint || o.checkpoint_name || "";
		if (typeof s == "string" && s.trim()) return s.trim();
		for (let e of Object.values(o)) {
			let t = r(e);
			if (t) return t;
		}
		return "";
	};
	return r(e);
}
function h(e, t) {
	if (!Array.isArray(e) || e.length < 1) return null;
	let n = String(e[0]), r = t[n];
	if (!r || typeof r != "object") return null;
	if (!r._mjrPromptId) try {
		Object.defineProperty(r, "_mjrPromptId", {
			value: n,
			enumerable: !1
		});
	} catch {}
	return r;
}
function g(e, n = /* @__PURE__ */ new WeakSet()) {
	if (!e || typeof e != "object" || n.has(e)) return [];
	n.add(e);
	let r = [], i = e.prompt;
	if (typeof i == "string" && i.trim()) try {
		i = JSON.parse(i);
	} catch {
		i = null;
	}
	let a = (i && typeof i == "object" ? i : null) || (t(e) ? e : null);
	a && r.push(...Object.values(a));
	for (let t of _(e)) {
		let e = Array.isArray(t?.nodes) ? t.nodes.filter(Boolean) : [];
		r.push(...e);
		for (let t of e) for (let e of y(t)) r.push(...g(e, n));
		for (let e of v(t)) r.push(...g(e, n));
	}
	return r;
}
function _(e) {
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
function v(e) {
	return [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	].filter((e) => e && typeof e == "object" && Array.isArray(e.nodes));
}
function y(e) {
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
function b(e) {
	let t = e?.inputs;
	if (t && typeof t == "object" && !Array.isArray(t)) return t;
	let n = e?.widgets_values, r = {};
	if (n && typeof n == "object" && !Array.isArray(n)) {
		for (let [e, t] of Object.entries(n)) r[e] = t;
		return r;
	}
	if (!Array.isArray(t) || !Array.isArray(n)) return null;
	let i = t.filter(x);
	for (let e = 0; e < n.length; e += 1) {
		let a = i[e] || t[e] || null, o = String(a?.label || a?.localized_name || a?.name || a?.widget?.name || a?.widget?.label || "").trim();
		r[o || `param_${e + 1}`] = n[e];
	}
	return r;
}
function x(e) {
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
var S = /^(?:[a-z]:[\\/]|[\\/]{1,2}|\.{1,2}[\\/]|~[\\/]).+?[\\/][^\\/\n]+\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$/i, C = /^(?!.*[,;])(?!.*\b(?:cinematic|portrait|landscape|lighting|style|detailed|masterpiece|photo|render)\b).*(?:[\\/][^\\/\n]+){2,}\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$/i, w = new Set([
	"workflow",
	"quicktime:workflow",
	"keys:workflow",
	"comfyui:workflow",
	"comfy_workflow",
	"comfyuiworkflow"
]), T = new Set([
	"prompt",
	"quicktime:prompt",
	"keys:prompt",
	"comfyui:prompt",
	"comfy_prompt",
	"comfyuiprompt"
]);
function E(r) {
	if (!r) return null;
	if (typeof r == "object") {
		let i = r.geninfo || r.GenInfo || r.generation || null;
		if (i && typeof i == "object") {
			let e = {}, t = /* @__PURE__ */ new Set(), n = (e, n) => {
				if (!(!n || typeof n != "object") && !(n.confidence !== "override" && n.source !== "majoor_geninfo")) for (let n of Array.isArray(e) ? e : [e]) t.add(n);
			}, a = i.positive?.value ?? i.positive?.text ?? null, o = i.negative?.value ?? i.negative?.text ?? null;
			typeof a == "string" && a.trim() && (e.prompt = a), typeof o == "string" && o.trim() && (e.negative_prompt = o), n("prompt", i.positive), n("negative_prompt", i.negative);
			let s = i.checkpoint?.name ?? i.checkpoint ?? null;
			typeof s == "string" && s.trim() && (e.model = s), n(["model", "checkpoint"], i.checkpoint);
			let c = i.clip?.name ?? i.clip ?? null;
			typeof c == "string" && c.trim() && (e.clip = c), n("clip", i.clip);
			let l = i.vae?.name ?? i.vae ?? null;
			typeof l == "string" && l.trim() && (e.vae = l), n("vae", i.vae);
			let u = i.models;
			u && typeof u == "object" && (e.models = u);
			let d = Array.isArray(i.model_groups) ? i.model_groups : null;
			d && d.length && (e.model_groups = d);
			let f = Array.isArray(i.loras) ? i.loras : null;
			f && (e.loras = f), f?.some((e) => e?.confidence === "override" || e?.source === "majoor_geninfo") && t.add("loras");
			let p = i.sampler?.name ?? i.sampler ?? null;
			typeof p == "string" && p.trim() && (e.sampler = p), n("sampler", i.sampler);
			let m = i.scheduler?.name ?? i.scheduler ?? null;
			typeof m == "string" && m.trim() && (e.scheduler = m), n("scheduler", i.scheduler);
			let h = i.steps?.value ?? i.steps ?? null;
			h != null && (e.steps = h), n("steps", i.steps);
			let g = i.cfg?.value ?? i.cfg ?? null;
			g != null && (e.cfg = g), n(["cfg", "cfg_scale"], i.cfg);
			let _ = i.cfg_high_noise?.value ?? i.cfg_high_noise ?? null;
			_ != null && (e.cfg_high_noise = _);
			let v = i.cfg_low_noise?.value ?? i.cfg_low_noise ?? null;
			v != null && (e.cfg_low_noise = v);
			let y = i.seed?.value ?? i.seed ?? null;
			y != null && (e.seed = y), n("seed", i.seed);
			let b = i.voice?.name ?? i.voice?.value ?? i.voice ?? null;
			b != null && String(b).trim() && (e.voice = String(b).trim());
			let x = i.language?.value ?? i.language ?? null;
			x != null && String(x).trim() && (e.language = String(x).trim());
			let S = i.temperature?.value ?? i.temperature ?? null;
			S != null && (e.temperature = S);
			let C = i.top_k?.value ?? i.top_k ?? null;
			C != null && (e.top_k = C);
			let w = i.top_p?.value ?? i.top_p ?? null;
			w != null && (e.top_p = w);
			let T = i.repetition_penalty?.value ?? i.repetition_penalty ?? null;
			T != null && (e.repetition_penalty = T);
			let E = i.max_new_tokens?.value ?? i.max_new_tokens ?? null;
			E != null && (e.max_new_tokens = E);
			let D = i.device?.value ?? i.device ?? null;
			D != null && String(D).trim() && (e.device = String(D).trim());
			let O = i.voice_preset?.value ?? i.voice_preset ?? null;
			O != null && String(O).trim() && (e.voice_preset = String(O).trim());
			let k = i.instruct?.value ?? i.instruct ?? null;
			k != null && String(k).trim() && (e.instruct = String(k).trim());
			let A = i.dtype?.value ?? i.dtype ?? null;
			A != null && String(A).trim() && (e.dtype = String(A).trim());
			let M = i.attn_implementation?.value ?? i.attn_implementation ?? null;
			M != null && String(M).trim() && (e.attn_implementation = String(M).trim());
			let N = i.x_vector_only_mode?.value ?? i.x_vector_only_mode ?? null;
			N != null && (e.x_vector_only_mode = N);
			let I = i.use_torch_compile?.value ?? i.use_torch_compile ?? null;
			I != null && (e.use_torch_compile = I);
			let L = i.use_cuda_graphs?.value ?? i.use_cuda_graphs ?? null;
			L != null && (e.use_cuda_graphs = L);
			let R = i.compile_mode?.value ?? i.compile_mode ?? null;
			R != null && String(R).trim() && (e.compile_mode = String(R).trim());
			let z = i.enable_chunking?.value ?? i.enable_chunking ?? null;
			z != null && (e.enable_chunking = z);
			let B = i.max_chars_per_chunk?.value ?? i.max_chars_per_chunk ?? null;
			B != null && (e.max_chars_per_chunk = B);
			let V = i.chunk_combination_method?.value ?? i.chunk_combination_method ?? null;
			V != null && String(V).trim() && (e.chunk_combination_method = String(V).trim());
			let H = i.silence_between_chunks_ms?.value ?? i.silence_between_chunks_ms ?? null;
			H != null && (e.silence_between_chunks_ms = H);
			let U = i.enable_audio_cache?.value ?? i.enable_audio_cache ?? null;
			U != null && (e.enable_audio_cache = U);
			let W = i.batch_size?.value ?? i.batch_size ?? null;
			W != null && (e.batch_size = W);
			let G = i.denoise?.value ?? i.denoise ?? null;
			G != null && (e.denoise = G), n(["denoise", "denoising"], i.denoise);
			let K = i.clip_skip?.value ?? i.clip_skip ?? i.clipSkip ?? null;
			K != null && (e.clip_skip = K);
			let q = i.inputs;
			Array.isArray(q) && (e.inputs = q);
			let J = i.lyrics?.value ?? i.lyrics ?? null;
			typeof J == "string" && J.trim() && (e.lyrics = J);
			let Y = i.lyrics_strength?.value ?? i.lyrics_strength ?? null;
			Y != null && (e.lyrics_strength = Y);
			let X = i.notes?.value ?? i.workflow_notes?.value ?? i.notes ?? i.workflow_notes ?? null;
			typeof X == "string" && X.trim() && (e.workflow_notes = X.trim()), n(["workflow_notes", "notes"], i.notes ?? i.workflow_notes), Array.isArray(i.custom_info) && (e.custom_info = i.custom_info), Array.isArray(i.custom_info) && i.engine?.mode === "override" && t.add("custom_info"), Array.isArray(i.all_positive_prompts) && i.all_positive_prompts.length > 1 && (e.all_positive_prompts = i.all_positive_prompts), Array.isArray(i.all_negative_prompts) && i.all_negative_prompts.length > 1 && (e.all_negative_prompts = i.all_negative_prompts), Array.isArray(i.all_samplers) && i.all_samplers.length > 1 && (e.all_samplers = i.all_samplers), Array.isArray(i.chained_passes) && i.chained_passes.length > 1 && (e.chained_passes = i.chained_passes), Array.isArray(i.all_checkpoints) && i.all_checkpoints.length > 1 && (e.all_checkpoints = i.all_checkpoints);
			let Z = i.size || null;
			if (Z && typeof Z == "object" && (Z.width !== void 0 && (e.width = Z.width), Z.height !== void 0 && (e.height = Z.height)), i.engine && typeof i.engine == "object" && (e.engine = i.engine, (i.engine.mode === "override" || i.engine.parser_version === "geninfo-override-v1" || i.engine.source === "majoor_geninfo") && (e.is_override = !0)), t.size && (e.override_fields = Array.from(t)), j(e, P(r)), F(e, r), Object.keys(e).length) return e;
		}
		let a = n(r);
		if (a) return a;
		if (t(r)) {
			let e = n({ prompt: r });
			if (e) return e;
		}
		let o = P(r);
		if (o) return o;
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
		let s = r.parameters || r["PNG:Parameters"] || r["EXIF:UserComment"] || r.UserComment || r.ImageDescription || null;
		if (typeof s == "string") {
			let t = e(s);
			if (t) return t;
		}
		let c = r.workflow || r.Workflow || r.comfy || r.comfyui || r.ComfyUI || null;
		if (c && typeof c == "object") {
			let e = n(c);
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
			return E(JSON.parse(t));
		} catch {
			return null;
		}
		return { prompt: t };
	}
	return null;
}
function D(e) {
	return String(e || "").trim().replace(/\\/g, "/").toLowerCase();
}
function O(e) {
	if (!e) return null;
	if (typeof e == "object") return e;
	if (typeof e != "string") return null;
	let t = e.trim();
	if (!t || !(t.startsWith("{") || t.startsWith("["))) return null;
	try {
		return JSON.parse(t);
	} catch {
		return null;
	}
}
function k(e) {
	if (!e || typeof e != "object") return [];
	let t = [], n = (e) => {
		e && typeof e == "object" && !t.includes(e) && t.push(e);
	};
	n(e), n(e.metadata_raw), n(e.metadata), n(e.raw), n(e.exif), n(e.metadata_raw?.exif), n(e.metadata?.exif), n(e.format?.tags), n(e.ffprobe?.format?.tags), n(e.raw_ffprobe?.format?.tags), n(e.metadata_raw?.raw_ffprobe?.format?.tags), n(e.metadata_raw?.ffprobe?.format?.tags), n(e.metadata?.raw_ffprobe?.format?.tags), n(e.metadata?.ffprobe?.format?.tags);
	let r = [
		e.streams,
		e.ffprobe?.streams,
		e.raw_ffprobe?.streams,
		e.metadata_raw?.raw_ffprobe?.streams,
		e.metadata_raw?.ffprobe?.streams,
		e.metadata?.raw_ffprobe?.streams,
		e.metadata?.ffprobe?.streams
	];
	for (let e of r) if (Array.isArray(e)) for (let t of e) n(t?.tags);
	return t;
}
function A(e, t) {
	if (!e || typeof e != "object") return null;
	for (let [n, r] of Object.entries(e)) if (t.has(D(n))) return r;
	return null;
}
function j(e, t) {
	if (!(!t || typeof t != "object")) {
		for (let [n, r] of Object.entries(t)) if (!(r == null || r === "")) {
			if (Array.isArray(r) && Array.isArray(e[n])) {
				e[n] = N(e[n], r);
				continue;
			}
			if (r && typeof r == "object" && !Array.isArray(r) && e[n] && typeof e[n] == "object" && !Array.isArray(e[n])) {
				e[n] = {
					...r,
					...e[n]
				};
				continue;
			}
			(e[n] === void 0 || e[n] === null || e[n] === "") && (e[n] = r);
		}
	}
}
function M(e) {
	if (!e || typeof e != "object") return JSON.stringify(e);
	let t = e.name || e.lora_name || e.model || e.sampler_name || e.sampler || "", n = e.key || e.pass_stage || e.source || "";
	return t || n ? `${String(n).toLowerCase()}::${String(t).toLowerCase()}` : JSON.stringify(e);
}
function N(e, t) {
	let n = [...e], r = new Set(n.map((e) => M(e)));
	for (let e of t) {
		let t = M(e);
		r.has(t) || (r.add(t), n.push(e));
	}
	return n;
}
function P(e) {
	let r = null, i = null;
	for (let t of k(e)) if (r ||= O(A(t, w)), i ||= O(A(t, T)), r && i) break;
	let a = {};
	return (r || i) && (j(a, n({
		workflow: r,
		prompt: i
	})), j(a, n(r)), i && t(i) && j(a, n({ prompt: i }))), Object.keys(a).length ? a : null;
}
function F(e, t) {
	let r = t?.workflow || t?.Workflow || t?.comfy_workflow || t?.comfy || t?.comfyui || t?.ComfyUI || null;
	if (!r || typeof r != "object") return;
	let i = n(r), a = Array.isArray(i?.all_samplers) ? i.all_samplers : [];
	if (a.length) {
		for (let t of ["all_samplers", "chained_passes"]) {
			let n = Array.isArray(e[t]) ? e[t] : [];
			n.length && (e[t] = n.map((e, t) => {
				let n = a[t]?.pass_stage;
				return !n || e?.pass_stage ? e : {
					...e,
					pass_stage: n
				};
			}));
		}
		!Array.isArray(e.all_samplers) && a.length > 1 && (e.all_samplers = a);
	}
}
function I(e) {
	let t = typeof e == "string" ? e.trim() : "";
	return !t || t.includes("\n") ? !1 : S.test(t) || C.test(t);
}
function L(e) {
	let t = typeof e == "string" ? e.trim() : "";
	return t ? I(t) ? "" : t : "";
}
function R(e, t) {
	let n = L(e), r = L(t);
	if (n) {
		let e = /(?:^|\n)\s*Negative prompt:\s*/i;
		if (e.test(n)) {
			let t = n.split(e), i = (t[0] || "").trim(), a = t.slice(1).join("Negative prompt:").trim(), o = a.search(/\n\s*Steps:\s*\d+/i), s = (o >= 0 ? a.slice(0, o) : a).trim();
			i && (n = L(i)), !r && s && (r = L(s));
		}
	}
	return n && r && n.trim() === r.trim() && (r = ""), {
		positive: n,
		negative: r
	};
}
function z(e) {
	if (!e) return "";
	let t = String(e).trim().replace(/\\/g, "/");
	return (t.split("/").pop() || t).replace(/\.(safetensors|ckpt|pt|pth|bin|gguf|json)$/i, "");
}
function B(e) {
	let t = Number(e);
	return Number.isFinite(t) ? Math.abs(t - Math.round(t)) < 1e-9 ? String(Math.round(t)) : t.toFixed(2).replace(/0+$/g, "").replace(/\.$/, "") : String(e ?? "").trim();
}
function V(e) {
	if (!e) return "";
	if (typeof e == "string") return z(e);
	let t = z(e.name || e.lora_name || "");
	if (!t) return "";
	let n = e.weight ?? e.strength ?? null, r = e.strength_model ?? null, i = e.strength_clip ?? null;
	if (r !== null || i !== null) {
		let e = [];
		return r != null && e.push(`m=${B(r)}`), i != null && e.push(`c=${B(i)}`), e.length ? `${t} (${e.join(", ")})` : t;
	}
	return n == null ? t : `${t} (${B(n)})`;
}
function H(e) {
	let t = String(e || "").trim().toLowerCase();
	return t ? t === "img2vid" ? "Image-to-Video" : t === "txt2vid" ? "Text-to-Video" : t === "img2img" ? "Image-to-Image" : t === "txt2img" ? "Text-to-Image" : t === "vid2vid" ? "Video-to-Video" : t === "tts" ? "Text-to-Speech" : t === "audio" ? "Audio" : t.split(/[_\s-]+/).filter(Boolean).map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(" ") : "";
}
function U(e) {
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
function W(e) {
	let t = e?.engine && typeof e.engine == "object" ? e.engine : null, n = String(t?.type || "").trim(), r = String(t?.sampler_mode || "").trim().toLowerCase(), i = H(n) || n, a = U(t?.api_provider), o = r === "api" ? `API ${i || "Workflow"}` : i;
	return {
		workflowType: n,
		workflowLabel: String(o || n).trim(),
		workflowBadge: a
	};
}
//#endregion
export { R as a, E as i, V as n, L as o, z as r, W as t };
