import { Material, Vector2, WebGLRenderer } from "three";
import { ShaderChunkExtensions } from "../shader-chunks/ShaderChunkExtensions.js";
import { ImmutableTimer } from "../utils/ImmutableTimer.js";
import { Log } from "../utils/Log.js";
import { Resolution } from "../utils/Resolution.js";
import { Timer } from "../utils/Timer.js";
import { IOManager } from "./IOManager.js";
import { Disposable } from "./Disposable.js";
import { Renderable } from "./Renderable.js";
import { Resizable } from "./Resizable.js";
import { Pass } from "./Pass.js";

const v = /* @__PURE__ */ new Vector2();

/**
 * A render pipeline that can be used to group and run passes.
 *
 * @group Core
 */

export class RenderPipeline implements Disposable, Renderable, Resizable {

	/**
	 * A shared I/O manager.
	 */

	private static readonly ioManager = /* @__PURE__ */ new IOManager();

	/**
	 * The current renderer.
	 */

	private _renderer: WebGLRenderer | null;

	/**
	 * A timer.
	 */

	private _timer: Timer;

	/**
	 * @see {@link passes}
	 */

	private _passes: Pass<Material | null>[];

	/**
	 * The current resolution.
	 *
	 * @see {@link updateStyle}
	 */

	readonly resolution: Resolution;

	/**
	 * Determines whether the style of the canvas should be updated when the resolution is changed. Default is `true`.
	 */

	updateStyle: boolean;

	/**
	 * Determines whether the last pass should automatically render to screen. Default is `true`.
	 */

	autoRenderToScreen: boolean;

	/**
	 * Constructs a new render pipeline.
	 *
	 * @param renderer - A renderer.
	 */

	constructor(renderer: WebGLRenderer | null = null) {

		ShaderChunkExtensions.register();
		RenderPipeline.ioManager.addPipeline(this);

		this._renderer = renderer;
		this._timer = new Timer();
		this._passes = [];

		this.resolution = new Resolution();
		this.resolution.addEventListener("change", () => this.onResolutionChange());

		this.updateStyle = true;
		this.autoRenderToScreen = true;

	}

	/**
	 * The renderer.
	 */

	get renderer(): WebGLRenderer | null {

		return this._renderer;

	}

	set renderer(value: WebGLRenderer | null) {

		this._renderer = value;

		for(const pass of this.passes) {

			pass.renderer = value;

		}

		if(value !== null) {

			// Update the render resolution and refresh the buffers.
			this.onResolutionChange();
			RenderPipeline.ioManager.update();

		}

	}

	/**
	 * The internal timer.
	 */

	get timer(): ImmutableTimer {

		return this._timer;

	}

	/**
	 * A list of all registered passes.
	 */

	get passes(): ReadonlyArray<Pass<Material | null>> {

		return this._passes;

	}

	/**
	 * Registers a pass.
	 *
	 * @param pass - The pass.
	 */

	private registerPass(pass: Pass<Material | null>) {

		if(this.renderer !== null) {

			this.renderer.getDrawingBufferSize(v);
			pass.resolution.setBaseSize(v.width, v.height);

		}

		pass.renderer = this.renderer;
		pass.timer = this.timer;

	}

	/**
	 * Unregisters a pass.
	 *
	 * @param pass - The pass.
	 */

	private unregisterPass(pass: Pass<Material | null>) {

		pass.renderer = null;
		pass.timer = null;

	}

	/**
	 * Adds a pass.
	 *
	 * @param pass - The pass.
	 */

	addPass(pass: Pass<Material | null>) {

		const passes = this._passes;

		if(passes.indexOf(pass) !== -1) {

			throw new Error(`Unable to add pass "${pass.name}" because it was already added`);

		}

		this.registerPass(pass);
		passes.push(pass);
		RenderPipeline.ioManager.update();

	}

	/**
	 * Removes a pass.
	 *
	 * @param pass - The pass.
	 */

	removePass(pass: Pass<Material | null>): void {

		const passes = this._passes;
		const index = passes.indexOf(pass);
		const exists = (index !== -1);
		const removed = exists && (passes.splice(index, 1).length > 0);

		if(removed) {

			this.unregisterPass(pass);
			RenderPipeline.ioManager.update();

		}

	}

	/**
	 * Removes all passes.
	 */

	removeAllPasses(): void {

		for(const pass of this.passes) {

			this.unregisterPass(pass);

		}

		this._passes = [];
		RenderPipeline.ioManager.update();

	}

	/**
	 * Renders this pipeline.
	 *
	 * This method should be called once per frame via `requestAnimationFrame`.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
	 * @param timestamp - The current time in milliseconds.
	 */

	render(timestamp?: number): void {

		if(this.renderer === null) {

			return;

		}

		this._timer.update(timestamp);

		for(const pass of this.passes) {

			if(pass.enabled) {

				pass.render();

			}

		}

	}

	/**
	 * Handles resolution change events.
	 *
	 * @param resolution - The resolution.
	 */

	private onResolutionChange(resolution = this.resolution): void {

		if(this.renderer === null) {

			Log.debug("Unable to update the render size because the renderer is null");
			return;

		}

		const width = resolution.width;
		const height = resolution.height;
		const logicalSize = this.renderer.getSize(v);

		if(logicalSize.width !== width || logicalSize.height !== height) {

			this.renderer.setSize(width, height, this.updateStyle);

		}

		// The drawing buffer size takes the device pixel ratio into account.
		const effectiveSize = this.renderer.getDrawingBufferSize(v);

		for(const pass of this.passes) {

			pass.resolution.setBaseSize(effectiveSize.width, effectiveSize.height);

		}

	}

	/**
	 * Sets the render size.
	 *
	 * @param width - The width.
	 * @param height - The height.
	 * @param updateStyle - Whether the style of the canvas should be updated. Default is `true`.
	 */

	setSize(width: number, height: number, updateStyle = true): void {

		this.updateStyle = updateStyle;
		this.resolution.setBaseSize(width, height);

	}

	dispose(): void {

		RenderPipeline.ioManager.removePipeline(this);

		for(const pass of this.passes) {

			pass.dispose();

		}

		this.removeAllPasses();
		this._timer.dispose();

	}

}
