import { BrowserDocumentService } from './adapters/DocumentService';

/**
 * Default instance of DocumentService using browser document
 * Components can use this instance directly
 */
export const documentService = new BrowserDocumentService();

