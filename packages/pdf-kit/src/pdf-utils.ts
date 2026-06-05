/**
 * PDF Utilities - Lazy Loading Layer
 * 
 * This file provides dynamic imports for heavy PDF libraries.
 * Use these functions instead of static imports to reduce initial bundle size.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading
 */

// ============================================================================
// PDF-Lib (PDF generation, manipulation)
// ============================================================================

/**
 * Dynamically import PDFDocument from pdf-lib
 * Only loads when actually needed
 */
export async function getPdfLib() {
    const { PDFDocument } = await import('pdf-lib')
    return { PDFDocument }
}

/**
 * Dynamically import pdf-lib's download utility
 */
export async function getDownload() {
    const downloadModule = await import('downloadjs')
    return downloadModule.default
}

// ============================================================================
// PDF.js (PDF rendering and viewing)
// ============================================================================

/**
 * Dynamically import pdfjs-dist for PDF rendering
 * Returns the library and configures the worker
 */
export async function getPdfJs() {
    const pdfjsLib = await import('pdfjs-dist')
    
    // Configure worker - use local copy to avoid CDN issues
    if (typeof window !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    }
    
    return pdfjsLib
}

/**
 * Load a PDF document from a URL or File
 * @param source - URL string or File object
 * @returns PDFDocument proxy object
 */
export async function loadPdfDocument(source: string | File) {
    const pdfjs = await getPdfJs()
    
    let loadingTask
    if (typeof source === 'string') {
        loadingTask = pdfjs.getDocument(source)
    } else {
        const arrayBuffer = await source.arrayBuffer()
        loadingTask = pdfjs.getDocument(new Uint8Array(arrayBuffer))
    }
    
    return await loadingTask.promise
}

// ============================================================================
// Image Processing
// ============================================================================

/**
 * Dynamically import react-cropper
 * Heavy dependency - only load when user opens crop dialog
 */
export async function getCropper() {
    const cropperModule = await import('react-cropper')
    return {
        Cropper: cropperModule.default
    }
}

/**
 * Dynamically import tesseract.js for OCR
 * Very heavy (~5MB) - only load when OCR is needed
 */
export async function getTesseract() {
    const tesseractModule = await import('tesseract.js')
    return tesseractModule.default
}

/**
 * Perform OCR on an image blob
 * @param blob - Image blob to scan
 * @param language - Language code (default: 'spa' for Spanish)
 * @param onProgress - Progress callback
 */
export async function performOCR(
    blob: Blob,
    language: string = 'spa',
    onProgress?: (progress: number) => void
): Promise<string> {
    const Tesseract = await getTesseract()
    
    const { data: { text } } = await Tesseract.recognize(
        blob,
        language,
        {
            logger: (m) => {
                if (m.status === 'recognizing text' && onProgress) {
                    onProgress(Math.round(m.progress * 100))
                }
            }
        }
    )
    
    return text
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert canvas to blob
 */
export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
}

/**
 * Load image from URL as HTMLImageElement
 */
export async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
    })
}

/**
 * Calculate A4 dimensions in points
 */
export function getA4Dimensions(orientation: 'portrait' | 'landscape') {
    const A4_WIDTH = 595.28
    const A4_HEIGHT = 841.89
    
    return {
        width: orientation === 'portrait' ? A4_WIDTH : A4_HEIGHT,
        height: orientation === 'portrait' ? A4_HEIGHT : A4_WIDTH
    }
}
