// Type declarations for CSS imports without type declarations
declare module '*.css' {
    const content: string;
    export default content;
}

// Explicitly allow common CSS module patterns
declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
}

declare module 'cropperjs/dist/cropper.css';
