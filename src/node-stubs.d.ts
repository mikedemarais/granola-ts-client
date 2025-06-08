declare module "fs" {
  const anyFs: any;
  export = anyFs;
}

declare module "path" {
  const anyPath: any;
  export = anyPath;
}

declare module "os" {
  const anyOs: any;
  export = anyOs;
}

declare var process: any;
declare function require(path: string): any;

