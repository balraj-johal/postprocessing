import { HalftoneShape } from "../enums/HalftoneShape.js";
import { Effect } from "./Effect.js";
import { OverlayBlendFunction } from "./blending/blend-functions/OverlayBlendFunction.js";

import fragmentShader from "./shaders/halftone.frag";
import { Uniform } from "three";

/**
 * HalftoneEffect options.
 *
 * @category Effects
 */

export interface HalftoneEffectOptions {
	shape?: HalftoneShape;
	radius?: number;
	rotateR?: number;
	rotateG?: number;
	rotateB?: number;
	scatter?: number;
}

/**
 * A halftone effect.
 *
 * Based on the implementation found in Three.js:
 * https://github.com/mrdoob/three.js/blob/0bf3908b73b2cf73d7361cce17cfc8b816cb2a00/examples/jsm/postprocessing/HalftonePass.js
 *
 * @category Effects
 */

export class HalftoneEffect extends Effect {

	/**
	 * Constructs a new halftone effect.
	 *
	 * @param options - The options.
	 */

	constructor({
		shape = HalftoneShape.ELLIPSE,
		radius = 10,
		rotateR = 14,
		rotateG = 45,
		rotateB = 30,
		scatter = 0
	}: HalftoneEffectOptions = {}) {

		super("HalftoneEffectOptions");

		this.fragmentShader = fragmentShader;
		this.blendMode.blendFunction = new OverlayBlendFunction();

		const uniforms = this.input.uniforms;
		uniforms.set("radius", new Uniform(radius));
		uniforms.set("rotateR", new Uniform(rotateR));
		uniforms.set("rotateG", new Uniform(rotateG));
		uniforms.set("rotateB", new Uniform(rotateB));
		uniforms.set("scatter", new Uniform(scatter));
		uniforms.set("shape", new Uniform(shape));

	}

	/**
	 * The halftone dot radius.
	 */

	get radius() {

		return this.input.uniforms.get("radius")!.value as number;

	}

	set radius(value: number) {

		this.input.uniforms.get("radius")!.value = value;

	}

	/**
	 * The halftone dot scatter.
	 */

	get scatter() {

		return this.input.uniforms.get("scatter")!.value as number;

	}

	set scatter(value: number) {

		this.input.uniforms.get("scatter")!.value = value;

	}

	/**
	 * The halftone dot rotateR.
	 */

	get rotateR() {

		return this.input.uniforms.get("rotateR")!.value as number;

	}

	set rotateR(value: number) {

		this.input.uniforms.get("rotateR")!.value = value;

	}

	/**
	 * The halftone dot rotateG.
	 */

	get rotateG() {

		return this.input.uniforms.get("rotateG")!.value as number;

	}

	set rotateG(value: number) {

		this.input.uniforms.get("rotateG")!.value = value;

	}

	/**
	 * The halftone dot rotateB.
	 */

	get rotateB() {

		return this.input.uniforms.get("rotateB")!.value as number;

	}

	set rotateB(value: number) {

		this.input.uniforms.get("rotateB")!.value = value;

	}

	/**
	 * The halftone dot shape.
	 */

	get shape() {

		return this.input.uniforms.get("shape")!.value as HalftoneShape;

	}

	set shape(value: HalftoneShape) {

		this.input.uniforms.get("shape")!.value = value;

	}

}
