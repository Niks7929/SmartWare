import QRCode from 'qrcode';

export class QRService {
  /**
   * Generates a Data URL QR Code image containing structured product JSON or SKU URL
   */
  static async generateQRCodeDataUrl(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a', // Slate 900
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error('QR Generation Error:', err);
      return '';
    }
  }

  /**
   * Generates formatted product QR payload string
   */
  static createProductPayload(product: {
    id: string;
    sku: string;
    name: string;
    barcode: string;
    currentStock: number;
  }): string {
    return JSON.stringify({
      app: 'SmartWare',
      id: product.id,
      sku: product.sku,
      code: product.barcode,
      name: product.name,
      stock: product.currentStock
    });
  }
}
