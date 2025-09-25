// Document validation utility for business verification
const path = require('path');
const crypto = require('crypto');

class DocumentValidator {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf'
    ];
    this.allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
  }

  /**
   * Basic validation for file filter (without buffer access)
   * @param {Object} file - Multer file object (partial)
   * @param {string} docType - Document type ('registration' or 'owner_id')
   * @returns {Object} - Validation result
   */
  validateFileBasic(file, docType) {
    const errors = [];
    const warnings = [];

    // Check if file exists
    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors, warnings };
    }

    // Validate MIME type
    const normalizedMimeType = this.normalizeMimeType(file.mimetype);
    if (!this.allowedMimeTypes.includes(normalizedMimeType)) {
      errors.push(`Invalid file type: ${file.mimetype}. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }

    // Validate file extension
    const extension = path.extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(extension)) {
      errors.push(`Invalid file extension: ${extension}. Allowed extensions: ${this.allowedExtensions.join(', ')}`);
    }

    // Check MIME type and extension consistency
    if (!this.validateMimeExtensionConsistency(normalizedMimeType, extension)) {
      errors.push('File extension does not match file content type');
    }

    // Validate file name
    const fileNameValidation = this.validateFileName(file.originalname);
    if (!fileNameValidation.valid) {
      errors.push(...fileNameValidation.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate document file for business verification (full validation with buffer)
   * @param {Object} file - Multer file object
   * @param {string} docType - Document type ('registration' or 'owner_id')
   * @returns {Object} - Validation result
   */
  validateDocument(file, docType) {
    const errors = [];
    const warnings = [];

    // Check if file exists
    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors, warnings };
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(this.maxFileSize)})`);
    }

    // Validate MIME type
    const normalizedMimeType = this.normalizeMimeType(file.mimetype);
    if (!this.allowedMimeTypes.includes(normalizedMimeType)) {
      errors.push(`Invalid file type: ${file.mimetype}. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }

    // Validate file extension
    const extension = path.extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(extension)) {
      errors.push(`Invalid file extension: ${extension}. Allowed extensions: ${this.allowedExtensions.join(', ')}`);
    }

    // Check MIME type and extension consistency
    if (!this.validateMimeExtensionConsistency(normalizedMimeType, extension)) {
      errors.push('File extension does not match file content type');
    }

    // Validate file name
    const fileNameValidation = this.validateFileName(file.originalname);
    if (!fileNameValidation.valid) {
      errors.push(...fileNameValidation.errors);
    }

    // Document type specific validation
    const docTypeValidation = this.validateDocumentType(file, docType);
    if (!docTypeValidation.valid) {
      errors.push(...docTypeValidation.errors);
    }
    warnings.push(...docTypeValidation.warnings);

    // Check for suspicious file characteristics
    const securityCheck = this.performSecurityCheck(file);
    if (!securityCheck.safe) {
      errors.push(...securityCheck.errors);
    }
    warnings.push(...securityCheck.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        extension,
        docType,
        hash: this.generateFileHash(file.buffer) // Will be null if buffer not available
      }
    };
  }

  /**
   * Normalize MIME type (handle browser inconsistencies)
   */
  normalizeMimeType(mimeType) {
    const mimeTypeAliases = {
      'image/jpg': 'image/jpeg',
      'application/x-pdf': 'application/pdf'
    };
    return mimeTypeAliases[mimeType] || mimeType;
  }

  /**
   * Validate file name
   */
  validateFileName(fileName) {
    const errors = [];
    
    // Check for valid characters (prevent path traversal)
    if (/[<>:"|?*\\\/]/.test(fileName)) {
      errors.push('File name contains invalid characters');
    }

    // Check file name length
    if (fileName.length > 255) {
      errors.push('File name is too long (max 255 characters)');
    }

    // Check for suspicious patterns
    if (/\.(exe|bat|cmd|scr|vbs|js)$/i.test(fileName)) {
      errors.push('File name has suspicious extension');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate MIME type and extension consistency
   */
  validateMimeExtensionConsistency(mimeType, extension) {
    const consistencyMap = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf']
    };

    const expectedExtensions = consistencyMap[mimeType];
    return expectedExtensions && expectedExtensions.includes(extension);
  }

  /**
   * Document type specific validation
   */
  validateDocumentType(file, docType) {
    const errors = [];
    const warnings = [];

    switch (docType) {
      case 'registration':
        // Business registration documents are typically PDFs or scanned images
        if (file.size < 50 * 1024) { // Less than 50KB might be too small for a meaningful document
          warnings.push('Registration document file size seems unusually small');
        }
        break;
        
      case 'owner_id':
        // ID documents are typically images or PDFs
        if (file.mimetype.startsWith('image/') && file.size < 100 * 1024) {
          warnings.push('ID document image size seems unusually small for good quality');
        }
        break;
        
      default:
        errors.push(`Unknown document type: ${docType}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Perform basic security checks
   */
  performSecurityCheck(file) {
    const errors = [];
    const warnings = [];

    // Check for empty files
    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Check for extremely large files (beyond our limit but caught earlier)
    if (file.size > 50 * 1024 * 1024) { // 50MB - extreme size
      errors.push('File is extremely large and may be malicious');
    }

    // Basic file header validation (magic numbers)
    const headerCheck = this.validateFileHeader(file.buffer, file.mimetype);
    if (!headerCheck.valid) {
      errors.push('File header does not match expected format (possible file type spoofing)');
    }

    return {
      safe: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate file header (magic numbers)
   */
  validateFileHeader(buffer, mimeType) {
    if (!buffer || buffer.length < 4) {
      return { valid: false };
    }

    const header = buffer.subarray(0, 10);
    
    switch (mimeType) {
      case 'image/jpeg':
        return { valid: header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF };
      case 'image/png':
        return { valid: header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) };
      case 'image/gif':
        const gifHeader1 = Buffer.from('GIF87a');
        const gifHeader2 = Buffer.from('GIF89a');
        return { valid: header.subarray(0, 6).equals(gifHeader1) || header.subarray(0, 6).equals(gifHeader2) };
      case 'image/webp':
        return { valid: header.subarray(0, 4).equals(Buffer.from('RIFF')) && header.subarray(8, 12).equals(Buffer.from('WEBP')) };
      case 'application/pdf':
        return { valid: header.subarray(0, 4).equals(Buffer.from('%PDF')) };
      default:
        return { valid: true }; // Unknown type, skip header validation
    }
  }

  /**
   * Generate file hash for duplicate detection
   */
  generateFileHash(buffer) {
    if (!buffer) {
      return null; // Return null if buffer is not available
    }
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Format file size for human reading
   */
  formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Get validation summary for logging
   */
  getValidationSummary(validationResult) {
    return {
      valid: validationResult.valid,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      fileHash: validationResult.metadata.hash,
      fileSize: this.formatFileSize(validationResult.metadata.size)
    };
  }
}

module.exports = DocumentValidator;