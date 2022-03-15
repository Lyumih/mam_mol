namespace $ {
	export class $mol_button_demo extends $mol_example_small {
		
		/**
		 * ```tree
		 * title @ \All types of buttons in every states
		 * ```
		 */
		title() {
			return this.$.$mol_locale.text( '$mol_button_demo_title' )
		}
		
		/**
		 * ```tree
		 * sub /
		 * 	<= Major_enabled
		 * 	<= Major_disabled
		 * 	<= Minor_enabled
		 * 	<= Minor_disabled
		 * 	<= Minor_icon_enabled
		 * ```
		 */
		sub() {
			return [
				this.Major_enabled(),
				this.Major_disabled(),
				this.Minor_enabled(),
				this.Minor_disabled(),
				this.Minor_icon_enabled()
			] as readonly any[]
		}
		
		/**
		 * ```tree
		 * tags / \button
		 * ```
		 */
		tags() {
			return [
				"button"
			] as readonly any[]
		}
		
		/**
		 * ```tree
		 * major_label @ \Click me!
		 * ```
		 */
		major_label() {
			return this.$.$mol_locale.text( '$mol_button_demo_major_label' )
		}
		
		/**
		 * ```tree
		 * Major_enabled $mol_button_major title <= major_label
		 * ```
		 */
		@ $mol_mem
		Major_enabled() {
			const obj = new this.$.$mol_button_major()
			
			obj.title = () => this.major_label()
			
			return obj
		}
		
		/**
		 * ```tree
		 * Major_disabled $mol_button_major
		 * 	title <= major_label
		 * 	enabled false
		 * ```
		 */
		@ $mol_mem
		Major_disabled() {
			const obj = new this.$.$mol_button_major()
			
			obj.title = () => this.major_label()
			obj.enabled = () => false
			
			return obj
		}
		
		/**
		 * ```tree
		 * minor_label @ \Or click me..
		 * ```
		 */
		minor_label() {
			return this.$.$mol_locale.text( '$mol_button_demo_minor_label' )
		}
		
		/**
		 * ```tree
		 * Minor_enabled $mol_button_minor title <= minor_label
		 * ```
		 */
		@ $mol_mem
		Minor_enabled() {
			const obj = new this.$.$mol_button_minor()
			
			obj.title = () => this.minor_label()
			
			return obj
		}
		
		/**
		 * ```tree
		 * Minor_disabled $mol_button_minor
		 * 	title <= minor_label
		 * 	enabled false
		 * ```
		 */
		@ $mol_mem
		Minor_disabled() {
			const obj = new this.$.$mol_button_minor()
			
			obj.title = () => this.minor_label()
			obj.enabled = () => false
			
			return obj
		}
		
		/**
		 * ```tree
		 * Minor_icon $mol_icon_cursor_default_click_outline
		 * ```
		 */
		@ $mol_mem
		Minor_icon() {
			const obj = new this.$.$mol_icon_cursor_default_click_outline()
			
			return obj
		}
		
		/**
		 * ```tree
		 * Minor_icon_enabled $mol_button_minor sub /
		 * 	<= Minor_icon
		 * 	<= minor_label
		 * ```
		 */
		@ $mol_mem
		Minor_icon_enabled() {
			const obj = new this.$.$mol_button_minor()
			
			obj.sub = () => [
				this.Minor_icon(),
				this.minor_label()
			] as readonly any[]
			
			return obj
		}
	}
	
}
