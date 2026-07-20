import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Render HTML to a PDF file and offer it through the share sheet. The only
 * module that touches expo-print and expo-sharing.
 */
export async function printAndShareHtml(html: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}
