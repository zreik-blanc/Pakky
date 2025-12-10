declare module 'bash-parser' {
    interface ParseOptions {
        resolveEnv?: (name: string) => string | undefined;
    }

    interface ASTNode {
        type: string;
        [key: string]: unknown;
    }

    function parse(source: string, options?: ParseOptions): ASTNode;

    export = parse;
}
