import { Texture, Uniform } from "three";
import { EffectShaderSection, EffectShaderSection as Section } from "../enums/EffectShaderSection.js";
import { FullscreenMaterial } from "./FullscreenMaterial.js";

import fragmentTemplate from "./shaders/effect.frag";
import vertexTemplate from "./shaders/effect.vert";

/**
 * An effect material.
 *
 * @group Materials
 */

export class EffectMaterial extends FullscreenMaterial {

	/**
	 * Constructs a new effect material.
	 */

	constructor() {

		super({
			name: "EffectMaterial",
			uniforms: {
				gBuffer: new Uniform(null),
				time: new Uniform(0.0)
			}
		});

	}

	/**
	 * The current gBuffer.
	 */

	get gBuffer(): Record<string, Texture | null> {

		return this.uniforms.gBuffer.value as Record<string, Texture | null>;

	}

	set gBuffer(value: Record<string, Texture | null>) {

		this.uniforms.gBuffer.value = value;

	}

	/**
	 * Indicates whether output color space conversion is enabled.
	 */

	get colorSpaceConversion(): boolean {

		return (this.defines.COLOR_SPACE_CONVERSION !== undefined);

	}

	set colorSpaceConversion(value: boolean) {

		if(this.colorSpaceConversion !== value) {

			if(value) {

				this.defines.COLOR_SPACE_CONVERSION = "1";

			} else {

				delete this.defines.COLOR_SPACE_CONVERSION;

			}

			this.needsUpdate = true;

		}

	}

	/**
	 * The current animation time in seconds.
	 */

	get time(): number {

		return this.uniforms.time.value as number;

	}

	set time(value: number) {

		this.uniforms.time.value = value;

	}

	/**
	 * Sets the shader parts.
	 *
	 * @param shaderParts - A collection of shader code snippets. See {@link EffectShaderSection}.
	 * @return This material.
	 */

	setShaderParts(shaderParts: Map<EffectShaderSection, string | null>): this {

		this.fragmentShader = fragmentTemplate
			.replace(Section.FRAGMENT_MAIN_IMAGE, shaderParts.get(Section.FRAGMENT_MAIN_IMAGE) ?? "")
			.replace(Section.FRAGMENT_MAIN_GDATA, shaderParts.get(Section.FRAGMENT_MAIN_GDATA) ?? "")
			.replace(Section.FRAGMENT_MAIN_UV, shaderParts.get(Section.FRAGMENT_MAIN_UV) ?? "")
			.replace(Section.FRAGMENT_HEAD, shaderParts.get(Section.FRAGMENT_HEAD) ?? "")
			.replace(Section.FRAGMENT_HEAD_GBUFFER, shaderParts.get(Section.FRAGMENT_HEAD_GBUFFER) ?? "");

		this.vertexShader = vertexTemplate
			.replace(Section.VERTEX_MAIN_SUPPORT, shaderParts.get(Section.VERTEX_MAIN_SUPPORT) ?? "")
			.replace(Section.VERTEX_HEAD, shaderParts.get(Section.VERTEX_HEAD) ?? "");

		this.needsUpdate = true;
		return this;

	}

	/**
	 * Sets the shader macros.
	 *
	 * @param defines - A collection of preprocessor macro definitions.
	 * @return This material.
	 */

	setDefines(defines: Map<string, string | number | boolean>): this {

		for(const entry of defines.entries()) {

			this.defines[entry[0]] = entry[1];

		}

		this.needsUpdate = true;
		return this;

	}

	/**
	 * Sets the shader uniforms.
	 *
	 * @param uniforms - A collection of uniforms.
	 * @return This material.
	 */

	setUniforms(uniforms: Map<string, Uniform>): this {

		for(const entry of uniforms.entries()) {

			this.uniforms[entry[0]] = entry[1];

		}

		return this;

	}

}
