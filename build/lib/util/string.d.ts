export declare const stringUtil: {
    capitalizeFirst(str: string): string;
    splice(src: string, start: number, deleteCount?: number | undefined, insertion?: string): string;
    cleanPath(path: string): string;
    getFileExtension(fileName: string): string;
    compile(template: string, data: {
        [key: string]: any;
    }): string;
    readTime(timeStr: string): number;
};
