import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/**
 * Safely extract a hostname from a URL string.
 * Falls back to a sanitised version of the raw string if URL parsing fails
 * (e.g. when the protocol is missing — "shopsy.com" instead of "https://shopsy.com").
 */
export function getHostname(rawUrl) {
    try {
        return new URL(rawUrl).hostname;
    } catch {
        return (rawUrl || 'report').replace(/[^a-z0-9]/gi, '_');
    }
}

export const downloadPDF = async (elementId, filename = "SEO_Report.pdf") => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id "${elementId}" not found`);
        alert('Error: Could not find the report content to generate PDF.');
        return false;
    }

    try {
        console.log('Starting PDF generation for element:', elementId);
        
        // Temporarily remove negative margins for better PDF rendering
        const originalStyle = element.style.cssText;
        element.style.margin = '0';
        element.style.padding = '20px';
        element.style.backgroundColor = '#ffffff';
        
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: true, // Enable logging for debugging
            windowWidth: element.scrollWidth + 40, // Add padding
            windowHeight: element.scrollHeight + 40, // Add padding
            scrollX: 0,
            scrollY: 0,
            onclone: (clonedDoc) => {
                // Ensure all images are loaded in the cloned document
                const images = clonedDoc.querySelectorAll('img');
                images.forEach(img => {
                    if (!img.complete) {
                        img.onload = () => console.log('Image loaded for PDF:', img.src);
                    }
                });
            }
        });

        // Restore original styling
        element.style.cssText = originalStyle;

        console.log('Canvas created successfully, dimensions:', canvas.width, 'x', canvas.height);
        
        const imgData = canvas.toDataURL('image/png', 1.0); // Use maximum quality
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 20; // Add 10mm margin on each side
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft > 0) {
            position = -heightLeft;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        console.log('Saving PDF with filename:', filename);
        pdf.save(filename);
        return true;
    } catch (err) {
        console.error('PDF generation failed:', err);
        alert('Failed to generate PDF. Please try again or check the browser console for details.');
        return false;
    }
};