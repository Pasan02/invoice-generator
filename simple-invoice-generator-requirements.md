# 📄 Project Requirements Document  
**Project Name**: Simple Invoice Generator  
**Type**: Web Application  
**Tech Stack**:  
- **Frontend**: [Astro](https://astro.build/)  
- **Styling**: Tailwind CSS  
- **PDF Generation**: `pdf-lib` or `jspdf` (client-side PDF creation)  
- **Deployment**: Vercel / Netlify  
- **Backend (optional)**: Astro API routes (if needed later)  

## 🎯 Project Goals
- Allow users to generate professional-looking invoices from a web form  
- Enable PDF downloads  
- No database, user accounts, or backend storage (initially)  
- Lightweight, responsive UI  
- Built using Astro for performance and static-first approach  
- Support for multiple currencies and bank account details for payment

## 📋 Functional Requirements Table

| Requirement ID | Description                          | User Story                                                                 | Expected Behaviour / Outcome                                                                                 |
|----------------|--------------------------------------|----------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| RQ-001         | Access the Invoice Generator         | As a user, I want to visit the website and immediately see the invoice generator.                            | User lands on the main page with the invoice creation form visible.                                          |
| RQ-002         | Input Sender Information             | As a user, I want to enter my business or sender details in the invoice.                                     | Form fields available for sender's name, address, email, and phone.                                          |
| RQ-003         | Input Client Information             | As a user, I want to enter the recipient's (client's) details.                                                | Form fields for client's name, address, email, and phone.                                                    |
| RQ-004         | Add Invoice Details                  | As a user, I want to set the invoice number and date.                                                         | Inputs for custom invoice number (optional auto-generate) and invoice date.                                  |
| RQ-005         | Add Items to Invoice                 | As a user, I want to add line items including name, quantity, unit price, and tax.                           | Dynamically repeatable form rows with fields for item name, quantity, unit price, tax, and total per item.   |
| RQ-006         | Remove Items from Invoice            | As a user, I want to remove any item row from the invoice before generating it.                              | Each item row has a "Remove" button that deletes it from the list.                                           |
| RQ-007         | Calculate Total                      | As a user, I want the invoice to auto-calculate subtotal, tax, and total.                                     | Dynamic total calculation updates in real time as item values change.                                        |
| RQ-008         | Add Notes/Terms                      | As a user, I want to write custom notes or payment terms at the bottom.                                      | Text area for entering custom notes or terms, shown on final PDF.                                            |
| RQ-009         | Preview Invoice                      | As a user, I want to preview how the invoice will look before downloading.                                   | Preview section or modal displays a styled version of the invoice layout.                                    |
| RQ-010         | Download Invoice as PDF              | As a user, I want to generate a PDF of the invoice and download it.                                          | Upon clicking "Generate PDF", a styled PDF is created and prompted for download.                             |
| RQ-011         | Print Invoice                        | As a user, I want to print the invoice directly from the browser.                                            | "Print" button triggers browser print dialog with the invoice layout.                                        |
| RQ-012         | Reset/Clear Invoice Form             | As a user, I want to reset the form and start over if needed.                                                | A "Clear" button resets all form fields to default/blank state.                                              |
| RQ-013         | Responsive Design                    | As a user, I want to use the invoice generator smoothly on mobile and desktop.                               | The layout is responsive and adapts well to various screen sizes.                                            |
| RQ-014         | Save Invoice Locally (Future)        | As a user, I want to optionally save my invoice locally to edit it later.                                    | Invoice data can be saved as `.json` and re-imported later (optional feature for v2).                        |
| RQ-015         | Email Invoice (Future)               | As a user, I want to email the invoice directly to my client.                                                | Ability to input recipient email and send the invoice as an attachment (requires EmailJS or API integration).|
| RQ-016         | Light/Dark Mode Toggle (Optional)    | As a user, I want to choose between light and dark themes.                                                   | A toggle that switches styles without affecting functionality.                                               |
| RQ-017         | Validation for Required Fields       | As a user, I want clear guidance when I forget required fields.                                              | Required fields are validated with inline errors before allowing PDF generation.                             |
| RQ-018         | Auto Invoice Number (Optional)       | As a user, I want the invoice number to auto-increment if I leave it blank.                                  | Invoice number is auto-generated using a timestamp or counter.                                               |
| RQ-019         | Multi-currency Support               | As a user, I want to choose a currency for the invoice.                                                      | A dropdown allows selecting currency symbol (e.g., $, €, ₹) and code for the invoice.                        |
| RQ-020         | LocalStorage Draft (Optional)        | As a user, I want my data to be preserved if I refresh or close the tab.                                     | Draft data is stored temporarily in localStorage and auto-loaded on reopen.                                  |
| RQ-021         | Upload Company Logo (Optional)       | As a user, I want to upload my company's logo to display on the invoice.                                     | A file upload input allows the user to select an image (e.g., PNG, JPG). It appears on the invoice and PDF.  |
| RQ-022         | Bank Account Details                 | As a user, I want to include my bank account details for payment on the invoice.                             | Form fields for bank name, account holder, account number, routing/SWIFT/IBAN codes displayed on the invoice.|

## 🧪 Technical Requirements

- Astro project setup with Tailwind CSS  
- Components:
  - Form component for input  
  - Preview component  
  - PDF export logic (client-side with `pdf-lib`)  
- No backend, but structure should allow future API integration  
- Deployment-ready for Netlify/Vercel  

## 📦 Deliverables

- Source code (Astro project)  
- Hosted website  
- Functional invoice creation and PDF generation  
- README file with setup and usage instructions  

