declare module "fs" {
	const anyFs: {
		existsSync: (path: string) => boolean;
		readFileSync: (path: string, encoding: string) => string;
	};
	export = anyFs;
}

declare module "path" {
	const anyPath: {
		join: (...paths: string[]) => string;
	};
	export = anyPath;
}

declare module "os" {
	const anyOs: {
		homedir: () => string;
	};
	export = anyOs;
}

declare const process: {
	env: Record<string, string | undefined>;
};
declare function require(path: string): unknown;
