declare const exec: any;
declare const util: any;
declare const path: any;
declare const fs: any;
declare const execPromise: any;
declare const testScripts: string[];
interface ExecError extends Error {
    stdout?: string;
    stderr?: string;
}
declare function runTest(scriptPath: string): Promise<boolean>;
declare function verifyTestFiles(): boolean;
declare function checkAuthFile(): boolean;
declare function runAllTests(): Promise<void>;
