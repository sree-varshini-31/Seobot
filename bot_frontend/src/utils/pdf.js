import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/**
 * Triggers a native window print dialog specifically styled for PDF export.
 * @param {string} elementId - (Legacy) The ID of the DOM element to focus on.
 * @param {string} filename - (Legacy) Cannot control native filename via JS easily, relies on document.title.
 */
export const downloadPDF = async (elementId, filename = "SEO_Report.pdf") => {
    // We temporarily adjust the document title so the default Save as PDF filename is formatted nicely
    const originalTitle = document.title;
    document.title = filename.replace('.pdf', '');
    
    // Add print styles dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            body * {
                visibility: hidden;
            }
            #${elementId}, #${elementId} * {
                visibility: visible;
            }
            #${elementId} {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
            }
            @page {
                margin: 1cm;
            }
        }
    `;
    document.head.appendChild(style);

    // Give browser a moment to apply styles
    setTimeout(() => {
        window.print();
        
        // Cleanup
        setTimeout(() => {
            document.head.removeChild(style);
            document.title = originalTitle;
        }, 100);
    }, 100);

    return true;
};
