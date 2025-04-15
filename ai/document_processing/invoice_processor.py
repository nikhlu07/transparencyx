# document_processing/invoice_processor.py

import os
import json
import pytesseract
from pdf2image import convert_from_path
import cv2
import numpy as np
import re
from datetime import datetime

class InvoiceProcessor:
    """
    Extracts structured data from invoice images and PDFs
    """
    
    def __init__(self, config_path=None):
        """
        Initialize the invoice processor
        
        Args:
            config_path: Path to configuration file with extraction settings
        """
        self.config = self._load_config(config_path)
        
    def _load_config(self, config_path):
        """Load configuration from file or use defaults"""
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return json.load(f)
        else:
            # Default configuration
            return {
                'tesseract_path': '/usr/bin/tesseract',
                'field_patterns': {
                    'invoice_number': r'(?:Invoice|INV|Invoice Number|Invoice #)[\s#:]*([A-Z0-9\-]+)',
                    'date': r'(?:Date|Invoice Date|Issue Date)[\s:]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{2,4})',
                    'amount': r'(?:Total|Amount|Total Amount|Invoice Amount|Amount Due)[\s:]*[$€£¥]?[\s]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
                    'vendor_name': r'(?:From|Vendor|Supplier|Company Name|Business Name)[\s:]*([A-Za-z0-9\s\.,&]+)'
                }
            }
    
    def process_document(self, file_path):
        """
        Process an invoice document and extract structured data
        
        Args:
            file_path: Path to the invoice document (PDF or image)
            
        Returns:
            dict: Extracted invoice data
        """
        # Check file extension
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.pdf':
            text = self._extract_text_from_pdf(file_path)
        elif file_ext in ['.jpg', '.jpeg', '.png', '.tiff', '.tif']:
            text = self._extract_text_from_image(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
        
        # Extract fields from text
        invoice_data = self._extract_fields(text)
        
        # Extract line items if possible
        invoice_data['line_items'] = self._extract_line_items(text)
        
        return invoice_data
    
    def _extract_text_from_pdf(self, pdf_path):
        """Extract text from PDF document"""
        # Convert PDF to images
        images = convert_from_path(pdf_path)
        
        # Extract text from each page
        full_text = ""
        for image in images:
            # Convert PIL image to numpy array for OpenCV
            open_cv_image = np.array(image) 
            open_cv_image = open_cv_image[:, :, ::-1].copy() # Convert RGB to BGR
            
            # Preprocess image
            preprocessed = self._preprocess_image(open_cv_image)
            
            # Extract text
            text = pytesseract.image_to_string(preprocessed)
            full_text += text + "\n\n"
            
        return full_text
    
    def _extract_text_from_image(self, image_path):
        """Extract text from image document"""
        # Load image
        image = cv2.imread(image_path)
        
        # Preprocess image
        preprocessed = self._preprocess_image(image)
        
        # Extract text
        text = pytesseract.image_to_string(preprocessed)
        
        return text
    
    def _preprocess_image(self, image):
        """Preprocess image for better OCR results"""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply threshold to get black and white image
        _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
        
        # Remove noise
        denoised = cv2.fastNlMeansDenoising(binary, None, 10, 7, 21)
        
        return denoised
    
    def _extract_fields(self, text):
        """Extract invoice fields using regex patterns"""
        extracted_data = {}
        
        # Apply each field pattern
        for field_name, pattern in self.config['field_patterns'].items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                extracted_data[field_name] = match.group(1).strip()
            else:
                extracted_data[field_name] = None
                
        # Clean and normalize the data
        if extracted_data.get('amount'):
            # Remove any non-numeric characters except decimal point
            amount_str = re.sub(r'[^\d.]', '', extracted_data['amount'])
            try:
                extracted_data['amount'] = float(amount_str)
            except ValueError:
                extracted_data['amount'] = None
                
        if extracted_data.get('date'):
            # Try to parse the date
            date_str = extracted_data['date']
            try:
                # Try various date formats
                for fmt in ['%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%m-%d-%Y', '%d.%m.%Y', '%m.%d.%Y']:
                    try:
                        extracted_data['date'] = datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
                        break
                    except ValueError:
                        continue
            except Exception:
                # Keep as string if parsing fails
                pass
                
        return extracted_data
    
    def _extract_line_items(self, text):
        """Extract line items from invoice"""
        # This is a simplified implementation - real-world implementation would be more complex
        line_items = []
        
        # Look for a table-like structure with items, quantities, and prices
        lines = text.split('\n')
        item_pattern = r'([A-Za-z0-9\s\-]+)\s+(\d+)\s+[\$€£¥]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+[\$€£¥]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
        
        for line in lines:
            match = re.search(item_pattern, line)
            if match:
                item = {
                    'description': match.group(1).strip(),
                    'quantity': int(match.group(2)),
                    'unit_price': float(re.sub(r'[^\d.]', '', match.group(3))),
                    'total_price': float(re.sub(r'[^\d.]', '', match.group(4)))
                }
                line_items.append(item)
                
        return line_items

    def verify_claim_against_invoice(self, claim_data, extracted_data):
        """
        Verify that the blockchain claim matches the extracted invoice data
        
        Args:
            claim_data: Data from the blockchain claim
            extracted_data: Data extracted from the invoice
            
        Returns:
            dict: Verification results
        """
        verification = {
            'amount_matches': False,
            'vendor_matches': False,
            'date_valid': False,
            'overall_valid': False
        }
        
        # Check amount within 1% tolerance
        if extracted_data.get('amount') and claim_data.get('amount'):
            claim_amount = float(claim_data['amount'])
            invoice_amount = float(extracted_data['amount'])
            percent_diff = abs(claim_amount - invoice_amount) / invoice_amount * 100
            verification['amount_matches'] = percent_diff <= 1.0
            
        # Check vendor name (allowing for some variation)
        if extracted_data.get('vendor_name') and claim_data.get('vendor_name'):
            claim_vendor = claim_data['vendor_name'].lower()
            invoice_vendor = extracted_data['vendor_name'].lower()
            # Simple check - in production, would use more sophisticated fuzzy matching
            verification['vendor_matches'] = (claim_vendor in invoice_vendor or invoice_vendor in claim_vendor)
            
        # Check if invoice date is before claim date
        if extracted_data.get('date') and claim_data.get('submission_date'):
            try:
                invoice_date = datetime.strptime(extracted_data['date'], '%Y-%m-%d')
                claim_date = datetime.strptime(claim_data['submission_date'], '%Y-%m-%d')
                verification['date_valid'] = invoice_date <= claim_date
            except Exception:
                verification['date_valid'] = False
                
        # Overall validity requires all checks to pass
        verification['overall_valid'] = (
            verification['amount_matches'] and 
            verification['vendor_matches'] and 
            verification['date_valid']
        )
        
        return verification


# document_processing/ipfs_uploader.py

import ipfshttpclient
import hashlib
import os
import json

class IPFSUploader:
    """
    Handles uploading documents to IPFS and retrieving them
    """
    
    def __init__(self, ipfs_api="/ip4/127.0.0.1/tcp/5001"):
        """
        Initialize the IPFS uploader
        
        Args:
            ipfs_api: API endpoint for IPFS daemon
        """
        self.client = ipfshttpclient.connect(ipfs_api)
        
    def upload_file(self, file_path):
        """
        Upload a file to IPFS
        
        Args:
            file_path: Path to the file to upload
            
        Returns:
            str: IPFS hash of the uploaded file
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        # Upload the file to IPFS
        result = self.client.add(file_path)
        return result['Hash']
        
    def upload_json(self, data):
        """
        Upload JSON data to IPFS
        
        Args:
            data: Dictionary to upload as JSON
            
        Returns:
            str: IPFS hash of the uploaded JSON
        """
        # Convert data to JSON string
        json_str = json.dumps(data)
        
        # Add the JSON string to IPFS
        result = self.client.add_str(json_str)
        return result
        
    def get_file(self, ipfs_hash, output_path):
        """
        Retrieve a file from IPFS
        
        Args:
            ipfs_hash: IPFS hash of the file
            output_path: Where to save the retrieved file
            
        Returns:
            str: Path to the downloaded file
        """
        self.client.get(ipfs_hash, output_path)
        return os.path.join(output_path, ipfs_hash)
        
    def get_json(self, ipfs_hash):
        """
        Retrieve and parse JSON data from IPFS
        
        Args:
            ipfs_hash: IPFS hash of the JSON data
            
        Returns:
            dict: The parsed JSON data
        """
        # Get the JSON string from IPFS
        json_str = self.client.cat(ipfs_hash).decode('utf-8')
        
        # Parse the JSON string
        return json.loads(json_str)


# document_processing/processing_pipeline.py

import os
import json
from .invoice_processor import InvoiceProcessor
from .ipfs_uploader import IPFSUploader

class DocumentProcessingPipeline:
    """
    Complete pipeline for processing procurement documents
    """
    
    def __init__(self, config_path=None):
        """
        Initialize the document processing pipeline
        
        Args:
            config_path: Path to configuration file
        """
        self.config = self._load_config(config_path)
        self.invoice_processor = InvoiceProcessor(config_path)
        self.ipfs_uploader = IPFSUploader(self.config.get('ipfs_api', "/ip4/127.0.0.1/tcp/5001"))
        
    def _load_config(self, config_path):
        """Load configuration from file or use defaults"""
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return json.load(f)
        else:
            # Default configuration
            return {
                'ipfs_api': "/ip4/127.0.0.1/tcp/5001",
                'output_dir': "processed_documents"
            }
    
    def process_claim_document(self, document_path, claim_data):
        """
        Process a claim document and verify it against claim data
        
        Args:
            document_path: Path to the invoice document
            claim_data: Data from the blockchain claim
            
        Returns:
            dict: Processing results including extracted data, verification results, and IPFS hash
        """
        # Create output directory if it doesn't exist
        os.makedirs(self.config['output_dir'], exist_ok=True)
        
        # Extract data from document
        extracted_data = self.invoice_processor.process_document(document_path)
        
        # Verify claim against extracted data
        verification_results = self.invoice_processor.verify_claim_against_invoice(
            claim_data, 
            extracted_data
        )
        
        # Upload document to IPFS
        ipfs_hash = self.ipfs_uploader.upload_file(document_path)
        
        # Create result package
        result = {
            'extracted_data': extracted_data,
            'verification_results': verification_results,
            'ipfs_hash': ipfs_hash,
            'original_claim': claim_data
        }
        
        # Save result to JSON file
        result_path = os.path.join(
            self.config['output_dir'], 
            f"{os.path.basename(document_path)}.json"
        )
        with open(result_path, 'w') as f:
            json.dump(result, f, indent=2)
        
        return result
