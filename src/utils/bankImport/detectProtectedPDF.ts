/**
 * Detect if a PDF file is password-protected
 * 
 * SECURITY: This function only checks if the PDF requires a password.
 * It does NOT attempt to unlock or parse the document.
 * 
 * @param file - PDF file to check
 * @returns Promise resolving to true if password-protected, false otherwise
 */
export const detectProtectedPDF = async (file: File): Promise<boolean> => {
  try {
    // Dynamically import pdfjs-dist to avoid loading it unless needed
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source (required for pdfjs-dist)
    // Use worker from the installed package, compatible with Vite
    // Import worker as a module for Vite to handle properly
    const workerUrl = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.default;
    
    const arrayBuffer = await file.arrayBuffer();
    
    try {
      // Attempt to load PDF without password
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        // Don't provide password - this will fail if PDF is encrypted
      });
      
      await loadingTask.promise;
      
      // If we get here, PDF is not password-protected
      return false;
    } catch (error: any) {
      // Check if error is due to password requirement
      if (
        error?.name === 'PasswordException' ||
        error?.message?.includes('password') ||
        error?.message?.includes('encrypted') ||
        error?.code === 2 // PDF.js error code for encrypted document
      ) {
        return true;
      }
      
      // Other parsing errors - assume not password-protected
      // (could be corrupted file, but that's handled elsewhere)
      return false;
    }
  } catch (error) {
    // If we can't even check, assume not password-protected
    // The actual parsing will fail later if it is
    console.warn('Could not detect PDF protection status:', error);
    return false;
  }
};
