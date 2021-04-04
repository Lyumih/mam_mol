namespace $ {
	$mol_test({
		
		'object to primitive'( $ ) {
			
			$mol_assert_equal( ( { valueOf: ()=> 1 } as number ) + 1, 2 )
			$mol_assert_equal( { valueOf: ()=> 'xxx' } + '!', 'xxx!' )
			$mol_assert_equal( `${ { toString: ()=> 'xxx' } }!`, 'xxx!' )
			
			$mol_assert_fail( ()=> ( {} as number ) + 1, 'Implicit type cast is forbidden by default' )
			$mol_assert_fail( ()=> ({}) + '!', 'Implicit type cast is forbidden by default' )
			$mol_assert_fail( ()=> `${ {} }!`, 'Implicit type cast is forbidden by default' )
			
		},
		
		'unknown properties'( $ ) {
			
			$mol_assert_equal( [ 777 ][0], 777 )
			$mol_assert_equal( [].slice, Array.prototype.slice )
			$mol_assert_equal( ({ foo: 777 }).foo, 777 )
			$mol_assert_ok( 'foo'.slice )
			
			$mol_assert_fail( ()=> [ 777 ][1], 'Field "1" is not defined' )
			$mol_assert_fail( ()=> [ 777 ]['foo'], 'Field "foo" is not defined' )
			$mol_assert_fail( ()=> 'foo'['bar'], 'Field "bar" is not defined' )
			
		},
		
		'unknown properties of custom obects'( $ ) {
			
			class Foo extends Object {
				foo = 123
			}
			
			$mol_assert_equal( new Foo().foo, 123 )
			$mol_assert_fail( ()=> new Foo()['bar'], 'Field "bar" is not defined' )
			
		},
		
	})
}
