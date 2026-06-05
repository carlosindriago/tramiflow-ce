/**
 * Client-side blur detection using Laplacian Variance.
 *
 * Algorithm:
 * 1. Scale image to ≤512px (speed)
 * 2. Convert to grayscale
 * 3. Convolve with 3×3 Laplacian kernel: [0,1,0],[1,-4,1],[0,1,0]
 * 4. Compute variance of the result → sharpness score
 * 5. Score < threshold → blurry
 *
 * No external dependencies — pure Canvas API.
 */

export interface BlurResult {
    isBlurry: boolean
    /** Higher = sharper. Typical range: 10 (very blurry) to 500+ (very sharp) */
    score: number
}

/** Threshold below which an image is considered blurry */
const BLUR_THRESHOLD = 50

/** Max dimension for analysis canvas (larger = more accurate but slower) */
const ANALYSIS_MAX_DIM = 512

/**
 * Detect if an image file appears blurry.
 * Runs entirely on the client using an offscreen canvas.
 * Typically completes in <150ms for a 512px image.
 */
export async function detectBlur(file: File): Promise<BlurResult> {
    const bitmap = await createImageBitmap(file)

    // Scale down for fast analysis
    const scale = Math.min(1, ANALYSIS_MAX_DIM / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)

    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
        // Fallback: assume sharp if canvas unavailable
        return { isBlurry: false, score: 999 }
    }

    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()

    const imageData = ctx.getImageData(0, 0, w, h)
    const pixels = imageData.data

    // Step 1: Convert to grayscale (luminance)
    const gray = new Float32Array(w * h)
    for (let i = 0; i < w * h; i++) {
        const r = pixels[i * 4]
        const g = pixels[i * 4 + 1]
        const b = pixels[i * 4 + 2]
        gray[i] = 0.299 * r + 0.587 * g + 0.114 * b
    }

    // Step 2: Apply 3×3 Laplacian kernel
    // Kernel: [0,1,0], [1,-4,1], [0,1,0]
    const laplacian = new Float32Array(w * h)
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x
            laplacian[idx] =
                gray[idx - w] +          // top
                gray[idx - 1] +          // left
                -4 * gray[idx] +         // center
                gray[idx + 1] +          // right
                gray[idx + w]            // bottom
        }
    }

    // Step 3: Compute variance of Laplacian
    let sum = 0
    let sumSq = 0
    const count = (w - 2) * (h - 2) // exclude border pixels

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const val = laplacian[y * w + x]
            sum += val
            sumSq += val * val
        }
    }

    const mean = sum / count
    const variance = sumSq / count - mean * mean
    const score = Math.round(variance * 100) / 100

    return {
        isBlurry: score < BLUR_THRESHOLD,
        score,
    }
}
