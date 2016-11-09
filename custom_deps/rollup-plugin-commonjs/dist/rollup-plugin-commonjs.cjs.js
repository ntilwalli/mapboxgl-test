'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = require('fs');
var path = require('path');
var resolve$1 = require('resolve');
var rollupPluginutils = require('rollup-pluginutils');
var acorn = _interopDefault(require('acorn'));
var estreeWalker = require('estree-walker');
var MagicString = _interopDefault(require('magic-string'));

var HELPERS_ID = '\0commonjsHelpers';

var HELPERS = "\nexport var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};\n\nexport function commonjsRequire () {\n\tthrow new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');\n}\n\nexport function unwrapExports (x) {\n\treturn x && x.__esModule ? x['default'] : x;\n}\n\nexport function createCommonjsModule(fn, module) {\n\treturn module = { exports: {} }, fn(module, module.exports), module.exports;\n}";

var PREFIX = '\0commonjs-proxy:';
var EXTERNAL = '\0commonjs-external:';

function isFile ( file ) {
	try {
		var stats = fs.statSync( file );
		return stats.isFile();
	} catch ( err ) {
		return false;
	}
}

function addJsExtensionIfNecessary ( file ) {
	if ( isFile( file ) ) return file;

	file += '.js';
	if ( isFile( file ) ) return file;

	return null;
}

var absolutePath = /^(?:\/|(?:[A-Za-z]:)?[\\|\/])/;

function isAbsolute ( path$$1 ) {
	return absolutePath.test( path$$1 );
}

function defaultResolver ( importee, importer ) {
	// absolute paths are left untouched
	if ( isAbsolute( importee ) ) return addJsExtensionIfNecessary( path.resolve( importee ) );

	// if this is the entry point, resolve against cwd
	if ( importer === undefined ) return addJsExtensionIfNecessary( path.resolve( process.cwd(), importee ) );

	// external modules are skipped at this stage
	if ( importee[0] !== '.' ) return null;

	return addJsExtensionIfNecessary( path.resolve( path.dirname( importer ), importee ) );
}

function isReference ( node, parent ) {
	if ( parent.type === 'MemberExpression' ) return parent.computed || node === parent.object;

	// disregard the `bar` in { bar: foo }
	if ( parent.type === 'Property' && node !== parent.value ) return false;

	// disregard the `bar` in `class Foo { bar () {...} }`
	if ( parent.type === 'MethodDefinition' ) return false;

	// disregard the `bar` in `export { foo as bar }`
	if ( parent.type === 'ExportSpecifier' && node !== parent.local ) return false;

	return true;
}

function flatten ( node ) {
	var parts = [];

	while ( node.type === 'MemberExpression' ) {
		if ( node.computed ) return null;

		parts.unshift( node.property.name );
		node = node.object;
	}

	if ( node.type !== 'Identifier' ) return null;

	var name = node.name;
	parts.unshift( name );

	return { name: name, keypath: parts.join( '.' ) };
}

function isTruthy ( node ) {
	if ( node.type === 'Literal' ) return !!node.value;
	if ( node.type === 'ParenthesizedExpression' ) return isTruthy( node.expression );
	if ( node.operator in operators ) return operators[ node.operator ]( node );
}

function isFalsy ( node ) {
	return not( isTruthy( node ) );
}

function not ( value ) {
	return value === undefined ? value : !value;
}

function equals ( a, b, strict ) {
	if ( a.type !== b.type ) return undefined;
	if ( a.type === 'Literal' ) return strict ? a.value === b.value : a.value == b.value;
}

var operators = {
	'==': function (x) {
		return equals( x.left, x.right, false );
	},

	'!=': function (x) { return not( operators['==']( x ) ); },

	'===': function (x) {
		return equals( x.left, x.right, true );
	},

	'!==': function (x) { return not( operators['===']( x ) ); },

	'!': function (x) { return isFalsy( x.argument ); },

	'&&': function (x) { return isTruthy( x.left ) && isTruthy( x.right ); },

	'||': function (x) { return isTruthy( x.left ) || isTruthy( x.right ); }
};

function getName ( id ) {
	return rollupPluginutils.makeLegalIdentifier( path.basename( id, path.extname( id ) ) );
}

var reserved = 'abstract arguments boolean break byte case catch char class const continue debugger default delete do double else enum eval export extends false final finally float for function goto if implements import in instanceof int interface let long native new null package private protected public return short static super switch synchronized this throw throws transient true try typeof var void volatile while with yield'.split( ' ' );
var blacklistedExports = { __esModule: true };
reserved.forEach( function (word) { return blacklistedExports[ word ] = true; } );

var exportsPattern = /^(?:module\.)?exports(?:\.([a-zA-Z_$][a-zA-Z_$0-9]*))?$/;

var firstpassGlobal = /\b(?:require|module|exports|global)\b/;
var firstpassNoGlobal = /\b(?:require|module|exports)\b/;
var importExportDeclaration = /^(?:Import|Export(?:Named|Default))Declaration/;

function deconflict ( scope, globals, identifier ) {
	var i = 1;
	var deconflicted = identifier;

	while ( scope.contains( deconflicted ) || globals.has( deconflicted ) ) deconflicted = identifier + "_" + (i++);
	scope.declarations[ deconflicted ] = true;

	return deconflicted;
}

function tryParse ( code, id ) {
	try {
		return acorn.parse( code, {
			ecmaVersion: 6,
			sourceType: 'module'
		});
	} catch ( err ) {
		err.message += " in " + id;
		throw err;
	}
}

function transform ( code, id, isEntry, ignoreGlobal, customNamedExports, sourceMap ) {
	var firstpass = ignoreGlobal ? firstpassNoGlobal : firstpassGlobal;
	if ( !firstpass.test( code ) ) return null;

	var ast = tryParse( code, id );

	// if there are top-level import/export declarations, this is ES not CommonJS
	for ( var i = 0, list = ast.body; i < list.length; i += 1 ) {
		var node = list[i];

		if ( importExportDeclaration.test( node.type ) ) return null;
	}

	var magicString = new MagicString( code );

	var required = {};
	// Because objects have no guaranteed ordering, yet we need it,
	// we need to keep track of the order in a array
	var sources = [];

	var uid = 0;

	var scope = rollupPluginutils.attachScopes( ast, 'scope' );
	var uses = { module: false, exports: false, global: false, require: false };

	var lexicalDepth = 0;
	var programDepth = 0;

	var globals = new Set();

	var HELPERS_NAME = deconflict( scope, globals, 'commonjsHelpers' ); // TODO technically wrong since globals isn't populated yet, but ¯\_(ツ)_/¯

	var namedExports = {};

	// TODO handle transpiled modules
	var shouldWrap = /__esModule/.test( code );

	estreeWalker.walk( ast, {
		enter: function enter ( node, parent ) {
			if ( sourceMap ) {
				magicString.addSourcemapLocation( node.start );
				magicString.addSourcemapLocation( node.end );
			}

			// skip dead branches
			if ( parent && ( parent.type === 'IfStatement' || parent.type === 'ConditionalExpression' ) ) {
				if ( node === parent.consequent && isFalsy( parent.test ) ) return this.skip();
				if ( node === parent.alternate && isTruthy( parent.test ) ) return this.skip();
			}

			if ( node._skip ) return this.skip();

			programDepth += 1;

			if ( node.scope ) scope = node.scope;
			if ( /^Function/.test( node.type ) ) lexicalDepth += 1;

			// Is this an assignment to exports or module.exports?
			if ( node.type === 'AssignmentExpression' ) {
				if ( node.left.type !== 'MemberExpression' ) return;

				var flattened = flatten( node.left );
				if ( !flattened ) return;

				if ( scope.contains( flattened.name ) ) return;

				var match = exportsPattern.exec( flattened.keypath );
				if ( !match || flattened.keypath === 'exports' ) return;

				uses[ flattened.name ] = true;

				// we're dealing with `module.exports = ...` or `[module.]exports.foo = ...` –
				// if this isn't top-level, we'll need to wrap the module
				if ( programDepth > 3 ) shouldWrap = true;

				node.left._skip = true;

				if ( flattened.keypath === 'module.exports' && node.right.type === 'ObjectExpression' ) {
					return node.right.properties.forEach( function (prop) {
						if ( prop.computed || prop.key.type !== 'Identifier' ) return;
						var name = prop.key.name;
						if ( name === rollupPluginutils.makeLegalIdentifier( name ) ) namedExports[ name ] = true;
					});
				}

				if ( match[1] ) namedExports[ match[1] ] = true;
				return;
			}

			if ( node.type === 'Identifier' ) {
				if ( isReference( node, parent ) && !scope.contains( node.name ) ) {
					if ( node.name in uses ) {
						uses[ node.name ] = true;
						if ( node.name === 'global' && !ignoreGlobal ) {
							magicString.overwrite( node.start, node.end, (HELPERS_NAME + ".commonjsGlobal"), true );
						}

						if ( node.name === 'require' ) {
							magicString.overwrite( node.start, node.end, (HELPERS_NAME + ".commonjsRequire"), true );
						}

						// if module or exports are used outside the context of an assignment
						// expression, we need to wrap the module
						if ( node.name === 'module' || node.name === 'exports' ) {
							shouldWrap = true;
						}
					}

					globals.add( node.name );
				}

				return;
			}

			if ( node.type === 'ThisExpression' && lexicalDepth === 0 ) {
				uses.global = true;
				if ( !ignoreGlobal ) magicString.overwrite( node.start, node.end, (HELPERS_NAME + ".commonjsGlobal"), true );
				return;
			}

			if ( node.type !== 'CallExpression' ) return;
			if ( node.callee.name !== 'require' || scope.contains( 'require' ) ) return;
			if ( node.arguments.length !== 1 || node.arguments[0].type !== 'Literal' ) return; // TODO handle these weird cases?

			var source = node.arguments[0].value;

			var existing = required[ source ];
			if ( existing === undefined ) {
				sources.unshift(source);
			}
			var name;

			if ( !existing ) {
				name = "require$$" + (uid++);
				required[ source ] = { source: source, name: name, importsDefault: false };
			} else {
				name = required[ source ].name;
			}

			if ( parent.type !== 'ExpressionStatement' ) {
				required[ source ].importsDefault = true;
				magicString.overwrite( node.start, node.end, name );
			} else {
				// is a bare import, e.g. `require('foo');`
				magicString.remove( parent.start, parent.end );
			}

			node.callee._skip = true;
		},

		leave: function leave ( node ) {
			programDepth -= 1;
			if ( node.scope ) scope = scope.parent;
			if ( /^Function/.test( node.type ) ) lexicalDepth -= 1;
		}
	});

	if ( !sources.length && !uses.module && !uses.exports && !uses.require && ( ignoreGlobal || !uses.global ) ) {
		if ( Object.keys( namedExports ).length ) {
			throw new Error( ("Custom named exports were specified for " + id + " but it does not appear to be a CommonJS module") );
		}
		return null; // not a CommonJS module
	}

	var includeHelpers = shouldWrap || uses.global || uses.require;
	var importBlock = ( includeHelpers ? [ ("import * as " + HELPERS_NAME + " from '" + HELPERS_ID + "';") ] : [] ).concat(
		sources.map( function (source) {
			// import the actual module before the proxy, so that we know
			// what kind of proxy to build
			return ("import '" + source + "';");
		}),
		sources.map( function (source) {
			var ref = required[ source ];
			var name = ref.name;
			var importsDefault = ref.importsDefault;
			return ("import " + (importsDefault ? (name + " from ") : "") + "'" + PREFIX + source + "';");
		})
	).join( '\n' ) + '\n\n';

	var namedExportDeclarations = [];
	var wrapperStart = '';
	var wrapperEnd = '';

	var moduleName = deconflict( scope, globals, getName( id ) );
	if ( !isEntry ) {
		var exportModuleExports = "export { " + moduleName + " as __moduleExports };";
		namedExportDeclarations.push( exportModuleExports );
	}

	var name = getName( id );

	function addExport ( x ) {
		var declaration;

		if ( x === name ) {
			var deconflicted = deconflict( scope, globals, name );
			declaration = "var " + deconflicted + " = " + moduleName + "." + x + ";\nexport { " + deconflicted + " as " + x + " };";
		} else {
			declaration = "export var " + x + " = " + moduleName + "." + x + ";";
		}

		namedExportDeclarations.push( declaration );
	}

	if ( customNamedExports ) customNamedExports.forEach( addExport );

	var defaultExportPropertyAssignments = [];
	var hasDefaultExport = false;

	if ( shouldWrap ) {
		var args = "module" + (uses.exports ? ', exports' : '');

		wrapperStart = "var " + moduleName + " = " + HELPERS_NAME + ".createCommonjsModule(function (" + args + ") {\n";
		wrapperEnd = "\n});";

		Object.keys( namedExports )
			.filter( function (key) { return !blacklistedExports[ key ]; } )
			.forEach( addExport );
	} else {
		var names = [];

		ast.body.forEach( function (node) {
			if ( node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' ) {
				var ref = node.expression;
				var left = ref.left;
				var right = ref.right;
				var flattened = flatten( left );

				if ( !flattened ) return;

				var match = exportsPattern.exec( flattened.keypath );
				if ( !match ) return;

				if ( flattened.keypath === 'module.exports' ) {
					hasDefaultExport = true;
					magicString.overwrite( node.start, right.start - 1, ("var " + moduleName + " = ") );
				} else {
					var name = match[1];
					var deconflicted = deconflict( scope, globals, name );

					names.push({ name: name, deconflicted: deconflicted });

					magicString.overwrite( node.start, right.start - 1, ("var " + deconflicted + " = ") );

					var declaration = name === deconflicted ?
						("export { " + name + " };") :
						("export { " + deconflicted + " as " + name + " };");

					namedExportDeclarations.push( declaration );
					defaultExportPropertyAssignments.push( (moduleName + "." + name + " = " + deconflicted + ";") );
				}
			}
		});

		if ( !hasDefaultExport ) {
			wrapperEnd = "\n\nvar " + moduleName + " = {\n" + (names.map( function (ref) {
					var name = ref.name;
					var deconflicted = ref.deconflicted;

					return ("\t" + name + ": " + deconflicted);
			} ).join( ',\n' )) + "\n};";
		}
	}

	var defaultExport = /__esModule/.test( code ) ?
		("export default " + HELPERS_NAME + ".unwrapExports(" + moduleName + ");") :
		("export default " + moduleName + ";");

	var exportBlock = '\n\n' + [ defaultExport ]
		.concat( namedExportDeclarations )
		.concat( hasDefaultExport ? defaultExportPropertyAssignments : [] )
		.join( '\n' );

	magicString.trim()
		.prepend( importBlock + wrapperStart )
		.trim()
		.append( wrapperEnd + exportBlock );

	code = magicString.toString();
	var map = sourceMap ? magicString.generateMap() : null;

	return { code: code, map: map };
}

function getCandidatesForExtension ( resolved, extension ) {
	return [
		resolved + extension,
		resolved + path.sep + "index" + extension
	];
}

function getCandidates ( resolved, extensions ) {
	return extensions.reduce(
		function ( paths, extension ) { return paths.concat( getCandidatesForExtension ( resolved, extension ) ); },
		[resolved]
	);
}

// Return the first non-falsy result from an array of
// maybe-sync, maybe-promise-returning functions
function first ( candidates ) {
	return function () {
		var args = [], len = arguments.length;
		while ( len-- ) args[ len ] = arguments[ len ];

		return candidates.reduce( function ( promise, candidate ) {
			return promise.then( function (result) { return result != null ?
				result :
				Promise.resolve( candidate.apply( void 0, args ) ); } );
		}, Promise.resolve() );
	};
}

function startsWith ( str, prefix ) {
	return str.slice( 0, prefix.length ) === prefix;
}


function commonjs ( options ) {
	if ( options === void 0 ) options = {};

	var extensions = options.extensions || ['.js'];
	var filter = rollupPluginutils.createFilter( options.include, options.exclude );
	var ignoreGlobal = options.ignoreGlobal;

	var customNamedExports = {};
	if ( options.namedExports ) {
		Object.keys( options.namedExports ).forEach( function (id) {
			var resolvedId;

			try {
				resolvedId = resolve$1.sync( id, { basedir: process.cwd() });
			} catch ( err ) {
				resolvedId = path.resolve( id );
			}

			customNamedExports[ resolvedId ] = options.namedExports[ id ];
		});
	}

	var entryModuleIdPromise = null;
	var entryModuleId = null;

	function resolveId ( importee, importer ) {
		if ( importee === HELPERS_ID ) return importee;

		if ( importer && startsWith( importer, PREFIX ) ) importer = importer.slice( PREFIX.length );

		var isProxyModule = startsWith( importee, PREFIX );
		if ( isProxyModule ) importee = importee.slice( PREFIX.length );

		return resolveUsingOtherResolvers( importee, importer ).then( function (resolved) {
			if ( resolved ) return isProxyModule ? PREFIX + resolved : resolved;

			resolved = defaultResolver( importee, importer );

			if ( isProxyModule ) {
				if ( resolved ) return PREFIX + resolved;
				return EXTERNAL + importee; // external
			}

			return resolved;
		});
	}

	var sourceMap = options.sourceMap !== false;

	var commonjsModules = new Map();
	var resolveUsingOtherResolvers;

	return {
		name: 'commonjs',

		options: function options$1 ( options ) {
			var resolvers = ( options.plugins || [] )
				.map( function (plugin) {
					if ( plugin.resolveId === resolveId ) {
						// substitute CommonJS resolution logic
						return function ( importee, importer ) {
							if ( importee[0] !== '.' || !importer ) return; // not our problem

							var resolved = path.resolve( path.dirname( importer ), importee );
							var candidates = getCandidates( resolved, extensions );

							for ( var i = 0; i < candidates.length; i += 1 ) {
								try {
									var stats = fs.statSync( candidates[i] );
									if ( stats.isFile() ) return candidates[i];
								} catch ( err ) { /* noop */ }
							}
						};
					}

					return plugin.resolveId;
				})
				.filter( Boolean );

			resolveUsingOtherResolvers = first( resolvers );

			entryModuleIdPromise = resolveId( options.entry ).then( function (resolved) {
				entryModuleId = resolved;
			});
		},

		resolveId: resolveId,

		load: function load ( id ) {
			if ( id === HELPERS_ID ) return HELPERS;

			// generate proxy modules
			if ( startsWith( id, EXTERNAL ) ) {
				var actualId = id.slice( EXTERNAL.length );
				var name = getName( actualId );

				return ("import " + name + " from " + (JSON.stringify( actualId )) + "; export default " + name + ";");
			}

			if ( startsWith( id, PREFIX ) ) {
				var actualId$1 = id.slice( PREFIX.length );
				var name$1 = getName( actualId$1 );

				return commonjsModules.has( actualId$1 ) ?
					("import { __moduleExports } from " + (JSON.stringify( actualId$1 )) + "; export default __moduleExports;") :
					("import * as " + name$1 + " from " + (JSON.stringify( actualId$1 )) + "; export default ( " + name$1 + " && " + name$1 + "['default'] ) || " + name$1 + ";");
			}
		},

		transform: function transform$1 ( code, id ) {
			if ( !filter( id ) ) return null;
			if ( extensions.indexOf( path.extname( id ) ) === -1 ) return null;

			return entryModuleIdPromise.then( function () {
				var transformed = transform( code, id, id === entryModuleId, ignoreGlobal, customNamedExports[ id ], sourceMap );

				if ( transformed ) {
					commonjsModules.set( id, true );
					return transformed;
				}
			});
		}
	};
}

module.exports = commonjs;
//# sourceMappingURL=rollup-plugin-commonjs.cjs.js.map