namespace $ {
	
	export function $mol_promise_like( val: any ): val is Promise<any> {
		return val && typeof val.then === 'function'
	}

}