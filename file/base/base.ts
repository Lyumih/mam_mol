namespace $ {

	export class $mol_file_base extends $mol_object {
		
		@ $mol_mem_key
		static absolute<This extends typeof $mol_file_base>(this: This, path : string ) {
			return this.make<typeof $mol_file_base>({
				path : $mol_const( path )
			}) as InstanceType< This >
		}

		static relative<This extends typeof $mol_file_base>(this: This, path : string ) : InstanceType<This> {
			throw new Error( 'Not implemented yet' )
		}
		
		static base = ''
		
		path() {
			return '.'
		}
		
		parent() {
			return this.resolve( '..' )
		}

		@ $mol_mem
		protected stat(next? : $mol_file_stat | null, virt?: 'virt') {

			const path = this.path()
			const parent = this.parent()
			parent.watcher()

			// Отслеживать проверку наличия родительской папки не стоит до корня диска
			// Лучше ограничить mam-ом
			if ( path !== this.$.$mol_file_base.watch_root && path !== parent.path() ) {
				/*
				Если родитель удалился, надо ресетнуть все дочерние на любой глубине
				Родитель может удалиться, потом создасться, а дочерняя папка только удалиться.
				Поэтому parent.exists() не запустит перевычисления

				parent.version() меняется не только при удалении, будет ложное срабатывание
				события вотчера addDir сбрасывает только parent.sub(), а parent.version() может остаться та же
				тогда дочерний не перзапустится
				Если addDir будет сбрасывать parent.version(), то будет лишний раз перевычислен parent, хоть и он сам не поменялся
				*/

				parent.version()
			}

			if( virt ) return next ?? null
			
			return next ?? this.info(path)
		}

		protected static changed = new Set<$mol_file_base>
		protected static added = new Set<$mol_file_base>

		protected static frame = null as null | $mol_after_timeout

		protected static changed_add(type: 'addDir' | 'unlinkDir' | 'add' | 'change' | 'unlink', path: string) {
			const file = this.$.$mol_file_base.relative( path.at(-1) === '/' ? path.slice(0, -1) : path )

			if (type === 'add') {
				// добавился файл - у parent надо обновить список sub, если он был заюзан
				this.added.add(file)
			}

			if (type === 'change' || type === 'unlink') {
				// обновился или удалился файл - ресетим
				this.changed.add(file)
			}

			if ( type === 'addDir' ) {
				// добавилась папка, у parent обновляем список директорий в sub
				// дочерние ресетим
				// версию папки не меняем, т.к. иначе выполнится логика, связанная
				this.added.add(file)
			}

			if ( type === 'unlinkDir') {
				// удалилась папка, ресетим ее
				// stat у всех дочерних обновится сам, т.к. связан с parent.version()
				this.changed.add(file)
			}

			if (! this.watching) return

			this.frame?.destructor()
			this.frame = new this.$.$mol_after_timeout(this.watch_debounce(), () => {
				if (! this.watching) return
				this.watching = false
				$mol_wire_async(this).flush()
			} )
		}

		static watch_debounce() { return 500 }

		@ $mol_action
		static flush() {
			// this.flush_counter()
			// Пока flush работает, вотчер сюда не заходит, но может добавлять новые изменения
			// на каждом перезапуске они применятся
			// Пока run выполняется, изменения накапливаются, в конце run вызывается flush
			// Пока применяются изменения, run должен ожидать конца flush

			for (const file of this.added) {
				const parent = file.parent()

				try {
					if ( $mol_wire_probe(() => parent.sub())) parent.sub(null)
					file.reset()
				} catch (error) {
					if ($mol_fail_catch(error)) $mol_fail_log(error)
				}
			}

			for (const file of this.changed) {
				try {
					file.reset()
				} catch (error) {
					if ($mol_fail_catch(error)) $mol_fail_log(error)
				}
			}

			this.added.clear()
			this.changed.clear()

			// Выставляем обратно в true, что б watch мог зайти сюда
			this.watching = true
		}

		protected static watching = true

		protected static lock = new $mol_lock

		@ $mol_action
		protected static watching_off(path: string) {
			this.watching = false
			/*
			watch запаздывает и событие может прилететь через 3 сек после окончания сайд эффекта
			поэтому добавляем папку, которую меняет side_effect
			Когда дойдет до выполнения flush, он ресетнет ее
			
			Иначе будут лишние срабатывания
			Например, удалили hyoo/board, watch ресетит и exists начинает отдавать false, срабатывает git clone
			Сразу после него событие addDir еще не успело прийти,
			на следующем перезапуске вызывается git pull, т.к.
			с точки зрения реактивной системы hyoo/board еще не существует.
			*/
			this.changed.add(this.$.$mol_file_base.absolute(path))
		}
	
		static watch_off<Result>(side_effect: () => Result, affected_dir: string) {
			// ждем, пока выполнится предыдущий watch_off
			const unlock = this.lock.grab()
			this.watching_off(affected_dir)

			try {
				const result = side_effect()
				this.flush()
				unlock()
				return result
			} catch(e) {
				if (! $mol_promise_like(e)) {
					this.flush()
					unlock()
				}
				$mol_fail_hidden(e)
			}
		}

		reset() {
			this.stat( null )
		}

		@ $mol_mem
		modified() { return this.stat()?.mtime ?? null }

		@ $mol_mem
		version() {
			return this.stat()?.mtime.getTime().toString( 36 ).toUpperCase() ?? ''
		}

		protected info( path: string ) { return null as null | $mol_file_stat }
		protected ensure() {}
		protected drop() {}
		protected copy(to: string) {}
		protected read() { return new Uint8Array }
		protected write(buffer: Uint8Array) { }
		protected kids() {
			return [] as readonly this[]
		}

		@ $mol_mem_key
		readable(opts: { start?: number, end?: number }) {
			return new ReadableStream<Uint8Array>
		}

		@ $mol_mem_key
		writable(opts: { start?: number }) {
			return new WritableStream<Uint8Array>
		}

		// open( ... modes: readonly $mol_file_mode[] ) { return 0 }

		@ $mol_mem
		buffer( next? : Uint8Array ) {

			if( next === undefined ) {

				// Если меняется файл, буфер надо перечитать
				if (! this.version() ) return new Uint8Array

				next = this.read()

				const prev = $mol_mem_cached( ()=> this.buffer() )

				if( prev !== undefined && !$mol_compare_array( prev, next ) ) {
					this.$.$mol_log3_rise({
						place: `$mol_file_node.buffer()`,
						message: 'Changed' ,
						path: this.relate() ,
					})
				}

				return next
			
			}
			
			this.parent().exists( true )
			
			this.stat( this.stat_make(next.length), 'virt' )

			this.write(next)

			return next

		}

		@ $mol_action
		stat_make(size: number) {
			const now = new Date()
			return {
				type: 'file',
				size,
				atime: now,
				mtime: now,
				ctime: now,
			} as const
		}

		@ $mol_mem_key
		clone(to: string) {
			if (! this.exists() ) return null

			const target = (this.constructor as typeof $mol_file_base).absolute(to) as this

			try {
				this.version()
				target.parent().exists(true)
				this.copy(to)
				target.reset()
				return target
			} catch (error) {
				if ( $mol_fail_catch(error)) {
					console.error(error)
				}
			}
			return null
		}

		static watch_root = ''

		// static watcher_warned = false
		watcher() {
			// const constructor = this.constructor as typeof $mol_file_base
			// if (! constructor.watcher_warned) {
			// 	console.warn(`${constructor}.watcher() not implemented`)
			// 	constructor.watcher_warned = true
			// }

			return {
				destructor() {}
			}
		}
		
		@ $mol_mem
		exists( next? : boolean ) {
			
			const exists = Boolean( this.stat() )

			if( next === undefined ) return exists
			if( next === exists ) return exists

			if( next ) {
				this.parent().exists( true )
				this.ensure()
				this.reset()
				return next
			}

			this.drop()
			// удалили директорию, все дочерние потеряли актуальность
			this.reset()

			return next
		}
		
		@ $mol_mem
		type() {
			return this.stat()?.type ?? ''
		}
		
		name() {
			return this.path().replace( /^.*\//, '' )
		}
		
		ext() {
			const match = /((?:\.\w+)+)$/.exec( this.path() )
			return match ? match[ 1 ].substring( 1 ) : ''
		}

		text(next?: string, virt?: 'virt') {
			// Если пушим в text, то при сбросе таргета надо перезапускать пуш
			// Например файл удалили, потом снова создали, версия поменялась - перезаписываем
			if (next !== undefined) this.version()
			return this.text_int(next, virt)
		}

		@ $mol_mem
		text_int(next?: string, virt?: 'virt') {
			if( virt ) {
				this.stat( this.stat_make(0), 'virt' )
				return next!
			}

			if( next === undefined ) {
				return $mol_charset_decode( this.buffer( ) )	
			} else {
				const buffer = $mol_charset_encode( next )
				this.buffer( buffer )
				return next
			}
		}

		@ $mol_mem
		sub(reset?: null) {
			if (! this.exists() ) return []
			if ( this.type() !== 'dir') return []

			this.version()

			// Если дочерний file удалился, список надо обновить
			return this.kids().filter(file => file.exists())
		}

		resolve(path: string): this {
			throw new Error('implement')
		}

		relate( base = ( this.constructor as typeof $mol_file_base ).relative( '.' )): string {
			const base_path = base.path()
			const path = this.path()
			return path.startsWith(base_path) ? path.slice(base_path.length) : path
		}

		find(
			include? : RegExp ,
			exclude? : RegExp
		) {
			const found = [] as typeof this[]
			const sub = this.sub()

			for (const child of sub) {
				const child_path = child.path()

				if( exclude && child_path.match( exclude ) ) continue

				if( !include || child_path.match( include ) ) found.push( child )

				if( child.type() === 'dir' ) {
					const sub_child = child.find( include , exclude )
					for (const child of sub_child) found.push(child)
				}
			}

			return found
		}

		@ $mol_mem
		size() {
			switch( this.type() ) {
				case 'file': return this.stat()?.size ?? 0
				default: return 0
			}
		}
		
		toJSON() {
			return this.path()
		}
		
	}

}
