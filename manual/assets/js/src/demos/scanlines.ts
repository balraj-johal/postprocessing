import {
	CubeTextureLoader,
	HalfFloatType,
	LoadingManager,
	PerspectiveCamera,
	SRGBColorSpace,
	Scene,
	Texture,
	WebGLRenderer
} from "three";

import {
	ClearPass,
	EffectPass,
	GeometryPass,
	OverlayBlendFunction,
	RenderPipeline,
	ToneMappingEffect
} from "postprocessing";

import { Pane } from "tweakpane";
import { SpatialControls } from "spatial-controls";
import * as DefaultEnvironment from "../objects/DefaultEnvironment.js";
import * as Utils from "../utils/index.js";
import { ScanlineEffect } from "src/effects/ScanlineEffect.js";

function load(): Promise<Map<string, Texture>> {

	const assets = new Map<string, Texture>();
	const loadingManager = new LoadingManager();
	const cubeTextureLoader = new CubeTextureLoader(loadingManager);

	return new Promise<Map<string, Texture>>((resolve, reject) => {

		loadingManager.onLoad = () => resolve(assets);
		loadingManager.onError = (url) => reject(new Error(`Failed to load ${url}`));

		cubeTextureLoader.load(Utils.getSkyboxUrls("space", ".jpg"), (t) => {

			t.colorSpace = SRGBColorSpace;
			assets.set("sky", t);

		});

	});

}

window.addEventListener("load", () => void load().then((assets) => {

	// Renderer

	const renderer = new WebGLRenderer({
		powerPreference: "high-performance",
		antialias: false,
		stencil: false,
		depth: false
	});

	renderer.debug.checkShaderErrors = Utils.isLocalhost;
	const container = document.querySelector(".viewport") as HTMLElement;
	container.prepend(renderer.domElement);

	// Camera & Controls

	const camera = new PerspectiveCamera();
	const controls = new SpatialControls(camera.position, camera.quaternion, renderer.domElement);
	const settings = controls.settings;
	settings.rotation.sensitivity = 2.2;
	settings.rotation.damping = 0.05;
	settings.translation.damping = 0.1;
	controls.position.set(0, 0, 1);
	controls.lookAt(0, 0, 0);

	// Scene, Lights, Objects

	const scene = new Scene();
	const skyMap = assets.get("sky") as Texture;
	scene.background = skyMap;
	scene.environment = skyMap;
	scene.fog = DefaultEnvironment.createFog();
	scene.add(DefaultEnvironment.createEnvironment());

	// Post Processing

	const effect = new ScanlineEffect({ scrollSpeed: 0.006 });
	effect.blendMode.opacity = 0.25;
	effect.blendMode.blendFunction = new OverlayBlendFunction();
	const effectPass = new EffectPass(effect, new ToneMappingEffect());

	const pipeline = new RenderPipeline(renderer);
	pipeline.add(
		new ClearPass(),
		new GeometryPass(scene, camera, {
			frameBufferType: HalfFloatType,
			samples: 4
		}),
		effectPass
	);

	// Settings

	const pane = new Pane({ container: container.querySelector(".tp") as HTMLElement });
	const fpsGraph = Utils.createFPSGraph(pane);

	const folder = pane.addFolder({ title: "Settings" });
	folder.addBinding(effect, "density", { min: 0, max: 2, step: 1e-3 });
	folder.addBinding(effect, "scrollSpeed", { min: -0.02, max: 0.02, step: 1e-3 });

	Utils.addBlendModeBindings(folder, effect.blendMode);

	// Resize Handler

	function onResize(): void {

		const width = container.clientWidth, height = container.clientHeight;
		camera.aspect = width / height;
		camera.fov = Utils.calculateVerticalFoV(90, Math.max(camera.aspect, 16 / 9));
		camera.updateProjectionMatrix();
		pipeline.setSize(width, height);

	}

	window.addEventListener("resize", onResize);
	onResize();

	// Render Loop

	requestAnimationFrame(function render(timestamp: number): void {

		fpsGraph.begin();
		controls.update(timestamp);
		pipeline.render(timestamp);
		fpsGraph.end();

		requestAnimationFrame(render);

	});

}));
