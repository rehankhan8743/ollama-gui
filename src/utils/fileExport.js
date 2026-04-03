import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export async function exportToFile(data, filename) {
  const jsonStr = JSON.stringify(data, null, 2);

  if (isNative) {
    // Try Documents first (app-specific external storage)
    try {
      const result = await Filesystem.writeFile({
        path: filename,
        data: jsonStr,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      return { success: true, path: result.uri, location: 'Documents' };
    } catch (docErr) {
      console.log('Documents export failed, falling back to Data:', docErr.message);

      // Fallback: app internal Data directory (always works, private)
      try {
        const result = await Filesystem.writeFile({
          path: filename,
          data: jsonStr,
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
        return { success: true, path: result.uri, location: 'Data' };
      } catch (dataErr) {
        console.error('Data export also failed:', dataErr);
        throw new Error('Failed to save file: ' + (dataErr.message || 'Unknown error'));
      }
    }
  } else {
    // Browser fallback
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, path: null };
  }
}

export async function readFileFromPicker(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
